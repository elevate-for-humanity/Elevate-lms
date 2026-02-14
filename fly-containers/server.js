/**
 * Studio IDE Container Server
 * 
 * Provides real terminal access via WebSocket using node-pty.
 * Runs in a full Linux container on Fly.io.
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

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://elevateforhumanity.org',
    'https://www.elevateforhumanity.org',
    /\.elevateforhumanity\.org$/,
    /\.gitpod\.dev$/,
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '100mb' }));

// Store active terminals
const terminals = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// API: List files in workspace
app.get('/api/files', (req, res) => {
  const workspacePath = '/workspace/project';
  
  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true });
  }
  
  const listFiles = (dir, prefix = '') => {
    const items = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      
      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        items.push({ path: relativePath, type: 'directory' });
        items.push(...listFiles(fullPath, relativePath));
      } else {
        const stats = fs.statSync(fullPath);
        items.push({ 
          path: relativePath, 
          type: 'file',
          size: stats.size,
          modified: stats.mtime
        });
      }
    }
    
    return items;
  };
  
  res.json(listFiles(workspacePath));
});

// API: Read file
app.get('/api/file', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(400).json({ error: 'path required' });
  }
  
  const fullPath = path.join('/workspace/project', filePath);
  
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  res.json({ path: filePath, content });
});

// API: Write file
app.put('/api/file', (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: 'path required' });
  }
  
  const fullPath = path.join('/workspace/project', filePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content || '');
  res.json({ success: true, path: filePath });
});

// API: Delete file
app.delete('/api/file', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(400).json({ error: 'path required' });
  }
  
  const fullPath = path.join('/workspace/project', filePath);
  
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true });
    } else {
      fs.unlinkSync(fullPath);
    }
  }
  
  res.json({ success: true });
});

// API: Execute command (non-interactive)
app.post('/api/exec', async (req, res) => {
  const { command, cwd } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'command required' });
  }
  
  const workDir = cwd ? path.join('/workspace/project', cwd) : '/workspace/project';
  
  const { exec } = require('child_process');
  
  exec(command, { cwd: workDir, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
    res.json({
      stdout,
      stderr,
      exitCode: error ? error.code || 1 : 0
    });
  });
});

// WebSocket: Interactive terminal
wss.on('connection', (ws, req) => {
  console.log('Terminal connection established');
  
  // Create PTY
  const pty = spawn('bash', [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: '/workspace/project',
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      HOME: '/workspace',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
    }
  });
  
  const terminalId = Date.now().toString();
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
          pty.resize(msg.cols || 80, msg.rows || 24);
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
      console.error('Message parse error:', e);
    }
  });
  
  ws.on('close', () => {
    console.log('Terminal connection closed');
    pty.kill();
    terminals.delete(terminalId);
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    pty.kill();
    terminals.delete(terminalId);
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Studio container server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  terminals.forEach(({ pty }) => pty.kill());
  server.close(() => process.exit(0));
});
