/**
 * apps/admin/server.js — Standalone-compatible custom server
 *
 * Wraps the Next.js standalone startServer with a WebSocket proxy for
 * the Dev Studio terminal tab (/api/devstudio/shell-ws).
 *
 * IMPORTANT: Must mirror the standalone-generated server.js preamble exactly —
 * set __NEXT_PRIVATE_STANDALONE_CONFIG and call require('next') before
 * startServer, otherwise Next.js cannot resolve its own webpack bundle inside
 * the standalone image.
 */

'use strict';

const path   = require('path');
const http   = require('http');
const crypto = require('crypto');

const dir  = path.join(__dirname);
const port = parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOSTNAME ?? '0.0.0.0';

process.env.NODE_ENV = 'production';
process.chdir(dir);

// Required by the standalone runtime — primes Next.js module resolution so
// webpack and other bundled deps resolve correctly inside the image.
// This must happen before require('next/dist/server/lib/start-server').
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = process.env.__NEXT_PRIVATE_STANDALONE_CONFIG || '{}';
require('next');

const SHELL_WS_URL = process.env.STUDIO_SHELL_WS_URL ?? '';
const SHELL_SECRET = process.env.STUDIO_SHELL_SECRET ?? '';
const TOKEN_SECRET = process.env.STUDIO_TOKEN_SECRET ?? SHELL_SECRET;
const WS_PATH      = '/api/devstudio/shell-ws';

// ── Token helpers ─────────────────────────────────────────────────────────────

function isValidToken(token) {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return false;
    const expected = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payload)
      .digest('base64url');
    if (sig !== expected) return false;
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return Date.now() < exp;
  } catch {
    return false;
  }
}

function getUserIdFromToken(token) {
  try {
    const [payload] = token.split('.');
    const { uid } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return uid ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

// ── WebSocket proxy ───────────────────────────────────────────────────────────

function attachWsProxy(server) {
  let WebSocket, WebSocketServer;
  try {
    ({ WebSocket, WebSocketServer } = require('ws'));
  } catch {
    console.warn('[admin] ws module not available — shell-ws proxy disabled');
    return;
  }

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    if (url.pathname !== WS_PATH) { socket.destroy(); return; }

    if (!SHELL_WS_URL) {
      socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (browserWs) => {
      browserWs.once('message', (rawData) => {
        let token;
        try {
          const msg = JSON.parse(rawData.toString());
          if (msg.type !== 'auth') throw new Error('expected auth frame');
          token = msg.token;
        } catch {
          browserWs.close(4001, 'Expected auth frame');
          return;
        }

        if (!isValidToken(token)) { browserWs.close(4003, 'Invalid or expired token'); return; }

        const shellWs = new WebSocket(SHELL_WS_URL, {
          headers: { 'x-studio-secret': SHELL_SECRET, 'x-user-id': getUserIdFromToken(token) },
        });

        shellWs.on('open', () => {
          if (browserWs.readyState === WebSocket.OPEN) {
            browserWs.send(JSON.stringify({ type: 'ready' }));
          }
          browserWs.on('message', (d) => { if (shellWs.readyState === WebSocket.OPEN) shellWs.send(d); });
          shellWs.on('message',  (d) => { if (browserWs.readyState === WebSocket.OPEN) browserWs.send(d); });
          browserWs.on('close', () => shellWs.close());
          shellWs.on('close',   () => { if (browserWs.readyState === WebSocket.OPEN) browserWs.close(); });
          browserWs.on('error', () => shellWs.close());
          shellWs.on('error', (err) => {
            console.error('[studio-proxy] shell error:', err.message);
            if (browserWs.readyState === WebSocket.OPEN) {
              browserWs.send(JSON.stringify({ type: 'error', message: 'Shell connection lost' }));
              browserWs.close(1011, 'Shell unavailable');
            }
          });
        });

        shellWs.on('error', (err) => {
          console.error('[studio-proxy] connect error:', err.message);
          if (browserWs.readyState === WebSocket.OPEN) {
            browserWs.send(JSON.stringify({ type: 'error', message: 'Could not connect to shell' }));
            browserWs.close(1011, 'Shell unavailable');
          }
        });
      });
    });
  });
}

// ── Start Next.js standalone server ──────────────────────────────────────────
// Intercept http.createServer once to grab the server instance and attach
// the WebSocket proxy before Next.js starts listening.

const _createServer = http.createServer.bind(http);
http.createServer = function (...args) {
  const server = _createServer(...args);
  attachWsProxy(server);
  http.createServer = _createServer; // restore
  return server;
};

const { startServer } = require('next/dist/server/lib/start-server');

startServer({
  dir,
  isDev: false,
  hostname: host,
  port,
  allowRetry: false,
}).catch((err) => {
  console.error('[admin] startup error:', err);
  process.exit(1);
});
