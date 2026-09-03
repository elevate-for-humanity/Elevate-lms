/**
 * Studio IDE Container Server
 *
 * Provides real terminal access via WebSocket using node-pty.
 * Runs in a full Linux container on Fly.io.
 *
 * SECURITY AUDIT FIXES:
 * - Added path traversal protection
 * - Added command allowlist for exec API
 * - Added input sanitization
 * - Added unhandledRejection handler
 * - Improved error handling
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { spawn } = require('node-pty');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/terminal' });

// Constants
const WORKSPACE_ROOT = '/workspace/project';
const ALLOWED_COMMANDS = ['ls', 'cat', 'grep', 'find', 'echo', 'pwd', 'cd', 'git', 'node', 'npm', 'pnpm', 'python3', 'bash'];
const FORBIDDEN_PATTERNS = [/;\s*rm\s+/i, /;\s*del\s+/i, /\.\.\//i, /\|.*\|\s*rm/i, />\s*\/etc\//i];

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
app.use(
  cors({
    origin: [
      'https://elevateforhumanity.org',
      'https://www.elevateforhumanity.org',
      /\.elevateforhumanity\.org$/,
      /\.gitpod\.dev$/,
      'http://localhost:3000',
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));

// Store active terminals
const terminals = new Map();

// Validate path is within workspace
function isPathSafe(requestedPath) {
  if (!requestedPath || typeof requestedPath !== 'string') return false;
  
  // Block path traversal attempts
  if (requestedPath.includes('..') || requestedPath.startsWith('/')) {
    return false;
  }
  
  // Resolve and verify it's within workspace
  const fullPath = path.resolve(WORKSPACE_ROOT, requestedPath);
  return fullPath.startsWith(WORKSPACE_ROOT);
}

// Validate command is allowed
function isCommandSafe(command) {
  if (!command || typeof command !== 'string') return false;
  
  // Check for forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(command)) return false;
  }
  
  // Check first word against allowlist
  const firstWord = command.trim().split(/\s+/)[0];
  return ALLOWED_COMMANDS.includes(firstWord);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime(), pid: process.pid });
});

// API: List files in workspace
app.get('/api/files', (req, res) => {
  try {
    const workspacePath = WORKSPACE_ROOT;

    if (!fs.existsSync(workspacePath)) {
      fs.mkdirSync(workspacePath, { recursive: true });
    }

    const listFiles = (dir, prefix = '', depth = 0) => {
      // Limit recursion depth for security
      if (depth > 10) return [];

      const items = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

        const fullPath = path.join(dir, entry.name);
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          items.push({ path: relativePath, type: 'directory' });
          items.push(...listFiles(fullPath, relativePath, depth + 1));
        } else {
          const stats = fs.statSync(fullPath);
          items.push({
            path: relativePath,
            type: 'file',
            size: stats.size,
            modified: stats.mtime,
          });
        }
      }

      return items;
    };

    res.json(listFiles(workspacePath));
  } catch (error) {
    console.error('[studio] api/files: error:', error.message);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// API: Read file
app.get('/api/file', (req, res) => {
  try {
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'path required' });
    }

    if (!isPathSafe(filePath)) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    const fullPath = path.join(WORKSPACE_ROOT, filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Cannot read directory' });
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    res.json({ path: filePath, content, size: stats.size });
  } catch (error) {
    console.error('[studio] api/file read: error:', error.message);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// API: Write file
app.put('/api/file', (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'path required' });
    }

    if (!isPathSafe(filePath)) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    const fullPath = path.join(WORKSPACE_ROOT, filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Limit file size to 10MB
    if (content && content.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (max 10MB)' });
    }

    fs.writeFileSync(fullPath, content || '');
    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('[studio] api/file write: error:', error.message);
    res.status(500).json({ error: 'Failed to write file' });
  }
});

// API: Delete file
app.delete('/api/file', (req, res) => {
  try {
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'path required' });
    }

    if (!isPathSafe(filePath)) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    const fullPath = path.join(WORKSPACE_ROOT, filePath);

    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[studio] api/file delete: error:', error.message);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// API: Execute command (non-interactive)
app.post('/api/exec', async (req, res) => {
  try {
    const { command, cwd } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'command required' });
    }

    if (!isCommandSafe(command)) {
      console.warn(`[studio] api/exec: blocked dangerous command: ${command}`);
      return res.status(400).json({ error: 'Command not allowed' });
    }

    const workDir = cwd && isPathSafe(cwd) 
      ? path.join(WORKSPACE_ROOT, cwd) 
      : WORKSPACE_ROOT;

    const { exec } = require('child_process');

    exec(command, { cwd: workDir, maxBuffer: 10 * 1024 * 1024, timeout: 30000 }, (error, stdout, stderr) => {
      res.json({
        stdout,
        stderr,
        exitCode: error ? error.code || 1 : 0,
      });
    });
  } catch (error) {
    console.error('[studio] api/exec: error:', error.message);
    res.status(500).json({ error: 'Execution failed' });
  }
});

// WebSocket: Interactive terminal
wss.on('connection', (ws, req) => {
  console.info('[studio] ws: terminal connection established');

  // Create PTY
  const pty = spawn('bash', [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: WORKSPACE_ROOT,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      HOME: '/workspace',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    },
  });

  const terminalId = Date.now().toString(36);
  terminals.set(terminalId, { pty, ws });

  // Send terminal ID
  ws.send(JSON.stringify({ type: 'ready', terminalId }));

  // PTY output -> WebSocket
  pty.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }));
    }
  });

  pty.onExit(({ exitCode }) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'exit', exitCode }));
    }
    terminals.delete(terminalId);
  });

  // WebSocket input -> PTY
  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message.toString());

      switch (msg.type) {
        case 'input':
          pty.write(msg.data);
          break;
        case 'resize':
          pty.resize(Math.min(msg.cols || 80, 500), Math.min(msg.rows || 24, 200));
          break;
        case 'signal':
          if (msg.signal === 'SIGINT') {
            pty.write('\x03');
          } else if (msg.signal === 'SIGTSTP') {
            pty.write('\x1a');
          }
          break;
      }
    } catch (e) {
      console.error('[studio] ws: message parse error:', e.message);
    }
  });

  ws.on('close', () => {
    console.info('[studio] ws: terminal connection closed');
    pty.kill();
    terminals.delete(terminalId);
  });

  ws.on('error', (err) => {
    console.error('[studio] ws: error:', err.message);
    pty.kill();
    terminals.delete(terminalId);
  });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason) => {
  if (!reason) {
    console.error('[studio] rejection: unhandled (reason=null/undefined)');
    return;
  }

  const error = reason instanceof Error ? reason : new Error(String(reason));
  const errorCode = error.code;
  
  // Safe to ignore connection reset errors
  const KNOWN_SAFE_CODES = new Set(['ECONNRESET', 'EPIPE', 'ENOTCONN']);
  if (KNOWN_SAFE_CODES.has(errorCode)) {
    console.debug(`[studio] rejection: suppressed safe (code=${errorCode})`);
    return;
  }

  console.error(`[studio] rejection: unhandled (code=${errorCode ?? 'none'}, message=${error.message})`);
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.info(`[studio] server: started on port ${PORT} (pid=${process.pid})`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('[studio] shutdown: received SIGTERM');
  terminals.forEach(({ pty }) => pty.kill());
  server.close(() => {
    console.info('[studio] shutdown: complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.info('[studio] shutdown: received SIGINT');
  terminals.forEach(({ pty }) => pty.kill());
  server.close(() => process.exit(0));
});
