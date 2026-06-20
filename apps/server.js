/**
 * apps/admin/server.js — Next.js standalone entry (admin ECS task).
 * Studio Shell WebSocket proxy removed — Lizzy uses GitHub API + /api/devstudio/shell (workflows) only.
 */
'use strict';

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname);
const port = parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOSTNAME ?? '0.0.0.0';

let isShuttingDown = false;
let httpServer = null;

function loadStandaloneConfig() {
  const existing = process.env.__NEXT_PRIVATE_STANDALONE_CONFIG;
  if (existing && existing !== '{}') {
    return existing;
  }

  const requiredServerFilesPath = path.join(
    dir,
    '.next',
    'required-server-files.json',
  );

  let nextConfig = {};
  try {
    const requiredServerFiles = JSON.parse(
      fs.readFileSync(requiredServerFilesPath, 'utf8'),
    );
    nextConfig = requiredServerFiles.config || {};
  } catch (err) {
    console.warn(
      '[admin] failed to load required-server-files.json; using minimal standalone config:',
      err && err.message ? err.message : err,
    );
  }

  const distDir =
    typeof nextConfig.distDir === 'string' && nextConfig.distDir.length > 0
      ? nextConfig.distDir
      : '.next';

  return JSON.stringify({
    ...nextConfig,
    distDir,
  });
}

process.env.NODE_ENV = 'production';
process.chdir(dir);

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = loadStandaloneConfig();
require('next');

const { startServer } = require('next/dist/server/lib/start-server');

/**
 * Graceful shutdown handler for SIGTERM/SIGINT.
 * Northflank sends SIGTERM for container termination.
 */
async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log(`[admin] shutdown already in progress (${signal}), ignoring duplicate signal`);
    return;
  }
  isShuttingDown = true;

  console.log(`[admin] received ${signal}, starting graceful shutdown...`);

  // Give Northflank's load balancer time to drain connections
  const DRAIN_TIMEOUT_MS = 10_000;

  if (httpServer) {
    console.log(`[admin] stopping HTTP server (${DRAIN_TIMEOUT_MS}ms grace period)...`);
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        console.warn('[admin] drain timeout exceeded, forcing close');
        resolve();
      }, DRAIN_TIMEOUT_MS);

      httpServer.close((err) => {
        clearTimeout(timer);
        if (err) {
          console.error('[admin] server close error:', err.message);
        } else {
          console.log('[admin] HTTP server closed gracefully');
        }
        resolve();
      });
    });
  }

  console.log(`[admin] shutdown complete (${signal})`);
  process.exit(0);
}

// Register signal handlers for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections to prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
  // Distinguish between actual errors and intentional rejections
  const reasonStr = reason instanceof Error ? reason.message : String(reason);
  const isIntentional = reasonStr.includes('Server closed') ||
                        reasonStr.includes('socket hang up') ||
                        reasonStr.includes('ERR_CONNECTION_RESET');

  if (isIntentional || isShuttingDown) {
    console.debug(`[admin] suppressed unhandled rejection (${reasonStr})`);
    return;
  }

  console.error('[admin] unhandled promise rejection:', reason);
  // Don't exit immediately - let the server try to recover
  // Only exit if this is a fatal error that prevents the server from functioning
});

console.log(`[admin] starting standalone server on ${host}:${port}...`);

startServer({
  dir,
  isDev: false,
  hostname: host,
  port,
  allowRetry: false,
})
  .then((server) => {
    httpServer = server;
    console.log(`[admin] ✓ server ready on ${host}:${port} (pid=${process.pid})`);
  })
  .catch((err) => {
    // Only exit for actual startup failures, not for errors during operation
    if (isShuttingDown) {
      console.log('[admin] startup interrupted by shutdown signal');
      return;
    }

    console.error('[admin] startup error:', err.message || err);
    process.exit(1);
  });
