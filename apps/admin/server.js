/**
 * apps/admin/server.js — Next.js standalone entry (admin ECS task).
 * Studio Shell WebSocket proxy removed — Lizzy uses GitHub API + /api/devstudio/shell (workflows) only.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const v8 = require('v8');

// Inline logger to avoid @ alias issues in standalone
function createLogger(prefix) {
  const format = (level, msg, ctx = {}) => {
    const ts = new Date().toISOString();
    const ctxStr = Object.keys(ctx).length ? ' ' + JSON.stringify(ctx) : '';
    console.log(`[${ts}] [${level}] [${prefix}] ${msg}${ctxStr}`);
  };
  return {
    info: (msg, ctx) => format('INFO', msg, ctx),
    warn: (msg, ctx) => format('WARN', msg, ctx),
    error: (msg, ctx) => format('ERROR', msg, ctx),
    debug: (msg, ctx) => format('DEBUG', msg, ctx),
    serverStart: (host, port, ctx) => format('INFO', `Server starting on ${host}:${port}`, ctx),
    serverStop: (signal, uptime, ctx) => format('INFO', `Server stopped (${signal}) uptime=${uptime}s`, ctx),
    rejection: (id, type, ctx) => format(type === 'suppressed' ? 'WARN' : 'ERROR', `Unhandled rejection [${id}] ${type}`, ctx),
    recovery: (id, action, ctx) => format('INFO', `Recovery [${id}] ${action}`, ctx),
  };
}
const log = createLogger('admin');

// Inline memory monitor
let memoryInterval = null;
function startMonitoring(shutdownFn, logFn) {
  memoryInterval = setInterval(() => {
    const mem = process.memoryUsage();
    if (mem.heapUsed > 3 * 1024 * 1024 * 1024) {
      logFn('warn', 'High memory usage', { heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024) });
    }
  }, 30000);
}
function stopMonitoring() {
  if (memoryInterval) clearInterval(memoryInterval);
}
function getMetrics() {
  const mem = process.memoryUsage();
  return { heapUsed: mem.heapUsed, heapTotal: mem.heapTotal, rss: mem.rss };
}

// Suppress expected deployment noise from Next.js Server Action mismatches
// These happen during deployment rollovers when users have old pages loaded
const SUPPRESSED_ERROR_PATTERNS = [
  /Failed to find Server Action/i,
  /This request might be from an older or newer deployment/i,
  /server-action/i,
];

// Override console.error to filter deployment noise
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  const isSuppressed = SUPPRESSED_ERROR_PATTERNS.some(pattern => pattern.test(message));
  
  if (isSuppressed) {
    // Log as debug/info instead - not an error
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
 */
function attemptRecovery(reason, errorId) {
  const now = Date.now();
  
  if (now - rejectionMetrics.lastRecoveryAttempt < 30_000) {
    log.warn('Recovery rate limited', { 
      lastAttemptSeconds: Math.round((now - rejectionMetrics.lastRecoveryAttempt) / 1000),
      errorId 
    });
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
    log.recovery(errorId, 'references_cleared', { 
      errorCode: reason instanceof Error ? reason.code : null 
    });
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

  // 4. Heap snapshot
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
    log.error('Recovery failed - exceeded limit', { 
      recoveryCount: rejectionMetrics.recoveryCount,
      errorId 
    });
    return false;
  }

  log.recovery(errorId, 'recovery_attempted', { 
    recoveryCount: rejectionMetrics.recoveryCount 
  });
  
  return true;
}

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
    // Config load failure - warn in dev, error in prod
    log.warn('Config file not loaded, using defaults', { 
      path: requiredServerFilesPath,
      error: err?.message ?? String(err),
      severity: process.env.NODE_ENV === 'production' ? 'error' : 'warning'
    });
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
    log.debug('Duplicate shutdown signal ignored', { signal });
    return;
  }
  isShuttingDown = true;

  log.info('Shutdown initiated', { 
    event: 'shutdown_start',
    signal,
    rejectionMetrics: {
      total: rejectionMetrics.total,
      suppressed: rejectionMetrics.suppressed,
      unhandled: rejectionMetrics.unhandled,
      recoveries: rejectionMetrics.recoveryCount,
    },
    memoryMetrics: getMetrics(),
  });

  // Stop memory monitoring
  stopMonitoring();

  const DRAIN_TIMEOUT_MS = 10_000;

  if (httpServer) {
    log.info('Stopping HTTP server', { 
      event: 'http_stop',
      drainTimeoutMs: DRAIN_TIMEOUT_MS 
    });
    
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

// Register signal handlers for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections with structured logging
process.on('unhandledRejection', (reason) => {
  rejectionMetrics.total++;

  if (!reason) {
    log.error('Unhandled promise rejection (null/undefined reason)', { 
      event: 'promise_rejection',
      type: 'null_reason'
    });
    rejectionMetrics.unhandled++;
    return;
  }

  const error = reason instanceof Error ? reason : new Error(String(reason));
  const errorCode = error.code;
  const errorName = error.name;

  // Check if error is known safe (based on error CODE, not message string)
  const isSafe = isKnownSafeError(errorCode, errorName);

  if (isSafe) {
    log.rejection(Date.now().toString(36), 'suppressed', {
      errorCode,
      errorName,
      errorName_2: error.name,
    });
    
    rejectionMetrics.suppressed++;
    rejectionMetrics.recentSuppressed.push({
      code: errorCode,
      name: errorName,
      timestamp: Date.now(),
    });
    if (rejectionMetrics.recentSuppressed.length > 10) {
      rejectionMetrics.recentSuppressed.shift();
    }
    return;
  }

  // Track unhandled errors for pattern detection
  const errorId = Date.now().toString(36);
  rejectionMetrics.recentUnhandled.push({
    code: errorCode,
    name: errorName,
    message: error.message.substring(0, 200),
    timestamp: Date.now(),
  });
  if (rejectionMetrics.recentUnhandled.length > 10) {
    rejectionMetrics.recentUnhandled.shift();
  }

  // Genuine unhandled rejection
  log.rejection(errorId, 'unhandled', {
    errorCode,
    errorName,
    message: error.message,
    stack: error.stack?.split('\n').slice(0, 5).join('\n'),
  });

  rejectionMetrics.unhandled++;

  // Check for fatal errors
  if (isFatalError(errorCode, errorName)) {
    log.error('FATAL error detected - initiating shutdown', { 
      event: 'fatal_error',
      errorId,
      errorCode,
      errorName 
    });
    gracefulShutdown('FATAL_ERROR');
    return;
  }

  // Attempt recovery
  const shouldContinue = attemptRecovery(reason, errorId);

  if (!shouldContinue) {
    log.error('Recovery failed - initiating shutdown', { 
      event: 'recovery_failed',
      errorId,
      recoveryCount: rejectionMetrics.recoveryCount
    });
    gracefulShutdown('RECOVERY_FAILED');
    return;
  }

  if (rejectionMetrics.unhandled > 10) {
    log.error('High number of unhandled rejections', { 
      event: 'rejection_warning',
      unhandledCount: rejectionMetrics.unhandled,
      suppressedCount: rejectionMetrics.suppressed
    });
  }
});

// Expose metrics for health checks
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
    log.info('Server ready', { 
      event: 'server_ready',
      host,
      port,
      pid: process.pid,
      startupMs: startupDuration 
    });
    
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
    log.error('Server startup failed', { 
      event: 'startup_failed',
      errorId,
      error: err?.message ?? String(err)
    });
    process.exit(1);
  });
