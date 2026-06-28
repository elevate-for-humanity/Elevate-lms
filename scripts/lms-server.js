/**
 * scripts/lms-server.js — Graceful shutdown wrapper for Next.js standalone server.
 * Used by Dockerfile.northflank-lms instead of the default server.js.
 */
'use strict';

const { spawn } = require('child_process');
const http = require('http');
const v8 = require('v8');
const path = require('path');

// Import structured logger
const { createLogger } = require('../lib/logger');
const log = createLogger('lms');

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

const host = process.env.HOSTNAME ?? '0.0.0.0';
const port = parseInt(process.env.PORT ?? '8080', 10);
const DRAIN_TIMEOUT_MS = parseInt(process.env.DRAIN_TIMEOUT_MS ?? '10000', 10);

let isShuttingDown = false;
let serverProcess = null;

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

// Known safe-to-ignore error names
const KNOWN_SAFE_ERROR_NAMES = new Set([
  'AbortError', 'CancelledError', 'TimeoutError',
]);

// Fatal errors that indicate server cannot continue
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
 */
function attemptRecovery(reason, errorId) {
  const now = Date.now();
  
  if (now - rejectionMetrics.lastRecoveryAttempt < 30_000) {
    log.warn('Recovery rate limited', { lastAttemptSeconds: Math.round((now - rejectionMetrics.lastRecoveryAttempt) / 1000), errorId });
    return true;
  }
  
  rejectionMetrics.lastRecoveryAttempt = now;
  rejectionMetrics.recoveryCount++;

  // 1. Clear rejection references
  try {
    if (reason && typeof reason === 'object') {
      Object.keys(reason).forEach(key => {
        try { reason[key] = null; } catch { /* non-writable */ }
      });
    }
    log.recovery(errorId, 'references_cleared', { errorCode: reason instanceof Error ? reason.code : null });
  } catch (clearErr) {
    log.warn('Failed to clear references', { error: clearErr.message, errorId });
  }

  // 2. Force GC if exposed
  if (typeof global.gc === 'function') {
    try {
      global.gc();
      log.recovery(errorId, 'gc_forced', {});
    } catch (gcErr) {
      log.warn('GC failed', { error: gcErr.message, errorId });
    }
  } else {
    log.info('GC not exposed', { hint: 'Start with --expose-gc for best recovery', errorId });
  }

  // 3. Clear require cache
  ['next/dist/server/web/sandbox-context', 'next/dist/server/web/error-overlay/hot-reloader'].forEach(modName => {
    try {
      if (require.cache[require.resolve(modName)]) {
        delete require.cache[require.resolve(modName)];
        log.recovery(errorId, 'cache_cleared', { module: modName });
      }
    } catch { /* not loaded */ }
  });

  // 4. Capture heap snapshot
  try {
    const heapSnapshot = v8.writeHeapSnapshot();
    log.recovery(errorId, 'heap_snapshot', { file: path.basename(heapSnapshot) });
  } catch (snapshotErr) {
    log.warn('Heap snapshot failed', { error: snapshotErr.message, errorId });
  }

  // 5. Memory usage
  const memUsage = process.memoryUsage();
  log.recovery(errorId, 'memory_snapshot', {
    heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
    rssMB: Math.round(memUsage.rss / 1024 / 1024),
  });

  // 6. Emit warning
  if (typeof process.emitWarning === 'function') {
    process.emitWarning(
      `Unhandled rejection recovered. error_id=${errorId}, recovery_count=${rejectionMetrics.recoveryCount}`,
      'UnhandledRejection', 'ELMS001', { errorId, recoveryCount: rejectionMetrics.recoveryCount }
    );
  }

  // 7. Check limits
  if (rejectionMetrics.recoveryCount > 20) {
    log.error('Recovery failed - exceeded limit', { recoveryCount: rejectionMetrics.recoveryCount, errorId });
    return false;
  }

  log.recovery(errorId, 'recovery_attempted', { recoveryCount: rejectionMetrics.recoveryCount });
  return true;
}

/**
 * Graceful shutdown handler for SIGTERM/SIGINT.
 */
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
  });

  // Stop accepting new connections immediately
  if (serverProcess && !serverProcess.killed) {
    log.info('Sending SIGTERM to Node server', { event: 'sigterm_sent', pid: serverProcess.pid });
    serverProcess.kill('SIGTERM');
  }

  // Wait for graceful shutdown with timeout
  const startTime = Date.now();
  const checkInterval = 500;

  while (serverProcess && !serverProcess.killed) {
    if (Date.now() - startTime > DRAIN_TIMEOUT_MS) {
      log.warn('Drain timeout exceeded, forcing kill', { event: 'drain_timeout', timeoutMs: DRAIN_TIMEOUT_MS });
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
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
    log.error('FATAL error detected', { event: 'fatal_error', errorId, errorCode, errorName });
    gracefulShutdown('FATAL_ERROR');
    return;
  }

  const shouldContinue = attemptRecovery(reason, errorId);

  if (!shouldContinue) {
    log.error('Recovery failed', { event: 'recovery_failed', errorId, recoveryCount: rejectionMetrics.recoveryCount });
    gracefulShutdown('RECOVERY_FAILED');
    return;
  }

  if (rejectionMetrics.unhandled > 10) {
    log.error('High number of unhandled rejections', { event: 'rejection_warning', unhandledCount: rejectionMetrics.unhandled, suppressedCount: rejectionMetrics.suppressed });
  }
});

process.rejectionMetrics = rejectionMetrics;

log.serverStart(host, port, { startup: 'initiated' });

const nodeArgs = ['--max-http-header-size=32768', 'server.js'];
serverProcess = spawn('node', nodeArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    HOSTNAME: host,
    PORT: String(port),
  },
});

serverProcess.on('error', (err) => {
  const errorId = Date.now().toString(36);
  log.error('Server process error', { event: 'process_error', errorId, error: err.message });
  process.exit(1);
});

serverProcess.on('exit', (code, signal) => {
  if (isShuttingDown) return;

  if (code === 0) {
    log.info('Server process exited normally', { event: 'process_exit', code });
  } else {
    const errorId = Date.now().toString(36);
    log.error('Server process crashed unexpectedly', { event: 'process_crash', errorId, code, signal });
    process.exit(1);
  }
});

log.info('LMS wrapper ready', { event: 'wrapper_ready', wrapperPid: process.pid, serverPid: serverProcess.pid });