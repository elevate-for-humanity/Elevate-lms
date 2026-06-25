#!/usr/bin/env node
/**
 * WebSocket Terminal Server with PTY
 * Run separately: node scripts/terminal-server.js
 *
 * SECURITY AUDIT FIXES:
 * - Restricted CORS to specific origins
 * - Added unhandledRejection handler
 * - Added input validation and sanitization
 * - Added structured logging with prefixes
 */

const http = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty');
const os = require('os');

const PORT = process.env.TERMINAL_PORT || 3001;
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['https://admin.elevateforhumanity.org', 'https://www.elevateforhumanity.org'];

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., curl, Postman)
      if (!origin) return callback(null, true);
      
      // Check against allowed origins
      const isAllowed = ALLOWED_ORIGINS.some(allowed => 
        allowed === origin || origin.endsWith(allowed.replace(/^https?:\/\//, ''))
      );
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[terminal] CORS: blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
  },
});

// Track active terminals
const terminals = new Map();

io.on('connection', (socket) => {
  console.info(`[terminal] connection: client connected (id=${socket.id})`);

  // Create new terminal
  socket.on('terminal:create', (options = {}) => {
    // Validate and sanitize input
    const cols = Math.min(Math.max(Number(options.cols) || 80, 20), 500);
    const rows = Math.min(Math.max(Number(options.rows) || 24, 10), 200);
    const cwd = typeof options.cwd === 'string' && options.cwd.startsWith('/workspace/project') 
      ? options.cwd 
      : process.cwd();

    try {
      const term = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd,
        env: { ...process.env, TERM: 'xterm-256color' },
      });

      const terminalId = `term_${Date.now().toString(36)}`;
      terminals.set(terminalId, { term, socket });

      // Send output to client
      term.onData((data) => {
        if (socket.connected) {
          socket.emit('terminal:output', { id: terminalId, data });
        }
      });

      // Handle terminal exit
      term.onExit(({ exitCode }) => {
        if (socket.connected) {
          socket.emit('terminal:exit', { id: terminalId, exitCode });
        }
        terminals.delete(terminalId);
      });

      socket.emit('terminal:created', { id: terminalId, pid: term.pid });
      console.info(`[terminal] terminal: created (id=${terminalId}, pid=${term.pid})`);
    } catch (error) {
      console.error(`[terminal] terminal: create failed (error=${error.message})`);
      socket.emit('terminal:error', { error: error.message });
    }
  });

  // Handle input from client
  socket.on('terminal:input', ({ id, data }) => {
    if (typeof id !== 'string' || typeof data !== 'string') return;
    
    const terminal = terminals.get(id);
    if (terminal && terminal.socket === socket) {
      terminal.term.write(data);
    }
  });

  // Resize terminal
  socket.on('terminal:resize', ({ id, cols, rows }) => {
    if (typeof id !== 'string') return;
    
    const terminal = terminals.get(id);
    if (terminal && terminal.socket === socket) {
      const safeCols = Math.min(Math.max(Number(cols) || 80, 20), 500);
      const safeRows = Math.min(Math.max(Number(rows) || 24, 10), 200);
      terminal.term.resize(safeCols, safeRows);
    }
  });

  // Kill terminal
  socket.on('terminal:kill', ({ id }) => {
    if (typeof id !== 'string') return;
    
    const terminal = terminals.get(id);
    if (terminal && terminal.socket === socket) {
      terminal.term.kill();
      terminals.delete(id);
      console.info(`[terminal] terminal: killed (id=${id})`);
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', (reason) => {
    console.info(`[terminal] connection: client disconnected (id=${socket.id}, reason=${reason})`);
    // Kill all terminals for this socket
    for (const [id, terminal] of terminals.entries()) {
      if (terminal.socket === socket) {
        terminal.term.kill();
        terminals.delete(id);
      }
    }
  });
});

server.listen(PORT, () => {
  console.info(`[terminal] server: started on port ${PORT} (pid=${process.pid})`);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason) => {
  if (!reason) {
    console.error('[terminal] rejection: unhandled (reason=null/undefined)');
    return;
  }

  const error = reason instanceof Error ? reason : new Error(String(reason));
  const errorCode = error.code;
  
  // Safe to ignore connection errors
  const KNOWN_SAFE_CODES = new Set(['ECONNRESET', 'EPIPE', 'ENOTCONN', 'ECONNREFUSED']);
  if (KNOWN_SAFE_CODES.has(errorCode)) {
    console.debug(`[terminal] rejection: suppressed safe (code=${errorCode})`);
    return;
  }

  console.error(`[terminal] rejection: unhandled (code=${errorCode ?? 'none'}, message=${error.message})`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.info('[terminal] shutdown: received SIGINT');
  for (const [id, terminal] of terminals.entries()) {
    terminal.term.kill();
  }
  server.close(() => {
    console.info('[terminal] shutdown: complete');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.info('[terminal] shutdown: received SIGTERM');
  for (const [id, terminal] of terminals.entries()) {
    terminal.term.kill();
  }
  server.close(() => process.exit(0));
});
