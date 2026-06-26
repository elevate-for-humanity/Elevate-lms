/**
 * apps/server.js — Next.js standalone entry (admin ECS task).
 * Studio Shell WebSocket proxy removed — Lizzy uses GitHub API + /api/devstudio/shell (workflows) only.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const v8 = require('v8');

// Import structured logger
const { createLogger } = require('../../lib/logger');
const log = createLogger('admin');

// Import memory monitor
const { startMonitoring, stopMonitoring, getMetrics } = require('../../lib/memory-monitor');

// Suppress expected deployment noise from Next.js Server Action mismatches
const SUPPRESSED_ERROR_PATTERNS = [
  /Failed to find Server Action/i,
  /This request might be from an older or newer deployment/i,
  /server-action/i,
];

const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  const isSuppressed = SUPPRESSED_ERROR_PATTERNS.some(pattern => pattern.test(message));
  if (isSuppressed) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[suppressed] Deployment noise:', message.substring(0, 100));
    }
    return;
  }
  originalConsoleError.apply(console, args);
};

const dir = path.join(__dirname);
const port = parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOSTNAME ?? '0.0.0.0';

let isShuttingDown = false;
let httpServer = null;

// Metrics for unhandled rejections
const rejectionMetrics = {
  total: 0,
  suppressed: 0,
  unhandled: 0,
  recentSuppressed: [],
  recentUnhandled: [],
  lastRecoveryAttempt: 0,
  recoveryCount: 0,
};

// Known safe-to-ignore error codes from Node.js
const KNOWN_SAFE_ERROR_CODES = new Set([
  'ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'ENOTCONN', 'EBADF',
  'ERR_SERVER_NOT_RUNNING', 'ERR_STREAM_PREMATURE_CLOSE', 'ECONNABORTED', 'ESHUTDOWN',
]);

const KNOWN_SAFE_ERROR_NAMES = new Set(['AbortError', 'CancelledError', 'TimeoutError']);

const FATAL_ERROR_CODES = new Set([
  'ENOMEM', 'EACCES', 'EADDRINUSE', 'MODULE_NOT_FOUND', 'ERR_REQUIRE_ESM',
]);

function isKnownSafeError(errorCode, errorName) {
  if (errorCode && KNOWN_SAFE_ERROR_CODES.has(errorCode)) return true;
  if (errorName && KNOWN_SAFE_ERROR_NAMES.has(errorName)) return true;
  return false;
}

function isFatalError(errorCode, errorName) {
  if (errorCode && FATAL_ERROR_CODES.has(errorCode)) return true;
  if (errorName === 'ReferenceError' || errorName === 'SyntaxError') return true;
  return false;
}

/**
 * Attempt to RECOVER from unhandled rejection
 * Actual recovery actions implemented
 */
function attemptRecovery(reason, errorId) {
  const now = Date.now();
  
  if (now - rejectionMetrics.lastRecoveryAttempt < 30_000) {
    // eslint-disable-next-line no-console
    console.warn(`[admin] recovery: rate limited (last_attempt=${Math.round((now - rejectionMetrics.lastRecoveryAttempt)/1000)}s ago)`);
    return true;
  }
  
  rejectionMetrics.lastRecoveryAttempt = now;
  rejectionMetrics.recoveryCount++;

  // 1. Clear rejected promise references to free memory
  try {
    if (reason && typeof reason === 'object') {
      Object.keys(reason).forEach(key => {
        try { reason[key] = null; } catch { /* non-writable */ }
      });
    }
    // eslint-disable-next-line no-console
    console.info(`[admin] recovery: cleared rejection references (error_id=${errorId})`);
  } catch (clearErr) {
    // eslint-disable-next-line no-console
    console.warn(`[admin] recovery: failed to clear references: ${clearErr.message}`);
  }

  // 2. Force garbage collection if exposed
  if (typeof global.gc === 'function') {
    try {
      global.gc();
      // eslint-disable-next-line no-console
      console.info(`[admin] recovery: garbage collection forced (error_id=${errorId})`);
    } catch (gcErr) {
      // eslint-disable-next-line no-console
      console.warn(`[admin] recovery: GC failed: ${gcErr.message}`);
    }
  } else {
    // eslint-disable-next-line no-console
    console.info(`[admin] recovery: GC not exposed (start with --expose-gc for best recovery)`);
  }

  // 3. Clear require cache for commonly problematic modules
  ['next/dist/server/web/sandbox-context', 'next/dist/server/web/error-overlay/hot-reloader'].forEach(modName => {
    try {
      if (require.cache[require.resolve(modName)]) {
        delete require.cache[require.resolve(modName)];
        // eslint-disable-next-line no-console
        console.info(`[admin] recovery: cleared cache for ${modName}`);
      }
    } catch { /* not loaded */ }
  });

  // 4. Capture heap snapshot
  try {
    const heapSnapshot = v8.writeHeapSnapshot();
    // eslint-disable-next-line no-console
    console.info(`[admin] recovery: heap snapshot saved (file=${path.basename(heapSnapshot)}, error_id=${errorId})`);
  } catch (snapshotErr) {
    // eslint-disable-next-line no-console
    console.warn(`[admin] recovery: heap snapshot failed: ${snapshotErr.message}`);
  }

  // 5. Log memory usage
  const memUsage = process.memoryUsage();
  // eslint-disable-next-line no-console
  console.info(`[admin] recovery: memory (heapUsed=${Math.round(memUsage.heapUsed/1024/1024)}MB, heapTotal=${Math.round(memUsage.heapTotal/1024/1024)}MB, rss=${Math.round(memUsage.rss/1024/1024)}MB)`);

  // 6. Emit warning for external monitoring
  if (typeof process.emitWarning === 'function') {
    process.emitWarning(
      `Unhandled promise rejection detected and recovery attempted. See logs for error_id=${errorId}. Recovery count: ${rejectionMetrics.recoveryCount}`,
      'UnhandledRejection', 'ELMS001', { errorId, recoveryCount: rejectionMetrics.recoveryCount }
    );
  }

  // eslint-disable-next-line no-console
  console.info(`[admin] recovery: attempted (count=${rejectionMetrics.recoveryCount}, error_id=${errorId})`);

  // 7. Return false if exceeded recovery limits
  if (rejectionMetrics.recoveryCount > 20) {
    // eslint-disable-next-line no-console
    console.error(`[admin] recovery: FAILED - exceeded recovery limit (count=${rejectionMetrics.recoveryCount})`);
    return false;
  }

  // Recovery succeeded
  return true;
}

function loadStandaloneConfig() {
  const existing = process.env.__NEXT_PRIVATE_STANDALONE_CONFIG;
  if (existing && existing !== '{}') {
    return existing;
  }

  const requiredServerFilesPath = path.join(dir, '.next', 'required-server-files.json');

  let nextConfig = {};
  try {
    const requiredServerFiles = JSON.parse(fs.readFileSync(requiredServerFilesPath, 'utf8'));
    nextConfig = requiredServerFiles.config || {};
  } catch (err) {
    log.warn('Config file not loaded, using defaults', { 
      path: requiredServerFilesPath,
      error: err?.message ?? String(err),
      severity: process.env.NODE_ENV === 'production' ? 'error' : 'warning'
    });
  }

  const distDir = typeof nextConfig.distDir === 'string' && nextConfig.distDir.length > 0 ? nextConfig.distDir : '.next';
  return JSON.stringify({ ...nextConfig, distDir });
}

process.env.NODE_ENV = 'production';
process.chdir(dir);

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = loadStandaloneConfig();
require('next');

const { startServer } = require('next/dist/server/lib/start-server');

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    log.debug('Duplicate shutdown signal ignored', { signal });
    return;
  }
  isShuttingDown = true;

  log.info('Shutdown initiated', { 
    event: 'shutdown_start',
    signal,
    rejectionMetrics: { total: rejectionMetrics.total, suppressed: rejectionMetrics.suppressed, unhandled: rejectionMetrics.unhandled, recoveries: rejectionMetrics.recoveryCount },
    memoryMetrics: getMetrics(),
  });

  // Stop memory monitoring
  stopMonitoring();

  const DRAIN_TIMEOUT_MS = 10_000;

  if (httpServer) {
    log.info('Stopping HTTP server', { event: 'http_stop', drainTimeoutMs: DRAIN_TIMEOUT_MS });
    
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        log.warn('Drain timeout exceeded, forcing close', { event: 'drain_timeout' });
        resolve();
      }, DRAIN_TIMEOUT_MS);

      httpServer.close((err) => {
        clearTimeout(timer);
        if (err) {
          log.error('Server close error', { event: 'server_close_error', error: err });
        } else {
          log.debug('HTTP server closed gracefully', { event: 'http_closed' });
        }
        resolve();
      });
    });
  }

  const uptimeSeconds = Math.round(process.uptime());
  log.serverStop(signal, uptimeSeconds, { event: 'shutdown_complete' });
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  rejectionMetrics.total++;

  if (!reason) {
    log.error('Unhandled promise rejection (null/undefined reason)', { event: 'promise_rejection', type: 'null_reason' });
    rejectionMetrics.unhandled++;
    return;
  }

  const error = reason instanceof Error ? reason : new Error(String(reason));
  const errorCode = error.code;
  const errorName = error.name;

  const isSafe = isKnownSafeError(errorCode, errorName);

  if (isSafe) {
    log.rejection(Date.now().toString(36), 'suppressed', { errorCode, errorName });
    
    rejectionMetrics.suppressed++;
    rejectionMetrics.recentSuppressed.push({ code: errorCode, name: errorName, timestamp: Date.now() });
    if (rejectionMetrics.recentSuppressed.length > 10) rejectionMetrics.recentSuppressed.shift();
    return;
  }

  const errorId = Date.now().toString(36);
  rejectionMetrics.recentUnhandled.push({ code: errorCode, name: errorName, message: error.message.substring(0, 200), timestamp: Date.now() });
  if (rejectionMetrics.recentUnhandled.length > 10) rejectionMetrics.recentUnhandled.shift();

  log.rejection(errorId, 'unhandled', { errorCode, errorName, message: error.message, stack: error.stack?.split('\n').slice(0, 5).join('\n') });

  rejectionMetrics.unhandled++;

  if (isFatalError(errorCode, errorName)) {
    log.error('FATAL error detected - initiating shutdown', { event: 'fatal_error', errorId, errorCode, errorName });
    gracefulShutdown('FATAL_ERROR');
    return;
  }

  const shouldContinue = attemptRecovery(reason, errorId);

  if (!shouldContinue) {
    log.error('Recovery failed - initiating shutdown', { event: 'recovery_failed', errorId, recoveryCount: rejectionMetrics.recoveryCount });
    gracefulShutdown('RECOVERY_FAILED');
    return;
  }

  if (rejectionMetrics.unhandled > 10) {
    log.error('High number of unhandled rejections', { event: 'rejection_warning', unhandledCount: rejectionMetrics.unhandled, suppressedCount: rejectionMetrics.suppressed });
  }
});

process.rejectionMetrics = rejectionMetrics;

log.serverStart(host, port, { startup: 'initiated' });

const startTime = Date.now();

startServer({
  dir,
  isDev: false,
  hostname: host,
  port,
  allowRetry: false,
})
  .then((server) => {
    httpServer = server;
    const startupDuration = Date.now() - startTime;
    log.info('Server ready', { event: 'server_ready', host, port, pid: process.pid, startupMs: startupDuration });
    
    // Start memory monitoring after server is ready
    startMonitoring(gracefulShutdown, (level, msg, ctx) => {
      if (level === 'error') log.error(msg, ctx);
      else if (level === 'warn') log.warn(msg, ctx);
      else if (level === 'info') log.info(msg, ctx);
      else log.debug(msg, ctx);
    });
  })
  .catch((err) => {
    if (isShuttingDown) {
      log.debug('Startup interrupted by shutdown', { event: 'startup_interrupted' });
      return;
    }

    const errorId = Date.now().toString(36);
    log.error('Server startup failed', { event: 'startup_failed', errorId, error: err?.message ?? String(err) });
    process.exit(1);
  });
