/**
 * apps/admin/server.js — Next.js standalone entry (admin ECS task).
 * Studio Shell WebSocket proxy removed — Lizzy uses GitHub API + /api/admin/dev-studio/shell (workflows) only.
 */
'use strict';

const fs = require('fs');
const path = require('path');

// Inline logger to avoid @ alias issues in standalone
function createLogger(prefix) {
  const format = (level, msg, ctx = {}) => {
    const ts = new Date().toISOString();
    const ctxStr = Object.keys(ctx).length ? ' ' + JSON.stringify(ctx) : '';
    console.info(`[${ts}] [${level}] [${prefix}] ${msg}${ctxStr}`);
  };
  return {
    info: (msg, ctx) => format('INFO', msg, ctx),
    warn: (msg, ctx) => format('WARN', msg, ctx),
    error: (msg, ctx) => format('ERROR', msg, ctx),
    debug: (msg, ctx) => format('DEBUG', msg, ctx),
    serverStart: (host, port, ctx) => format('INFO', `Server starting on ${host}:${port}`, ctx),
    serverStop: (signal, uptime, ctx) => format('INFO', `Server stopped (${signal}) uptime=${uptime}s`, ctx),
    rejection: (id, type, ctx) => format(type === 'suppressed' ? 'WARN' : 'ERROR', `Unhandled rejection [${id}] ${type}`, ctx),
  };
}
const log = createLogger('admin');

// Inline memory monitor
let memoryInterval = null;
function startMonitoring(logFn) {
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
};

const UNHANDLED_REJECTION_WINDOW_MS = 60_000;

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
async function gracefulShutdown(signal, exitCode = 0) {
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
  process.exit(exitCode);
}

// Register signal handlers for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections with structured logging.
// Only errors that are demonstrably fatal to the process trigger a shutdown.
// Repeated non-fatal async failures remain visible in telemetry but must not
// create an orchestrator restart loop by terminating an otherwise live server.
process.on('unhandledRejection', (reason) => {
  rejectionMetrics.total++;

  const error = reason instanceof Error
    ? reason
    : new Error(reason == null ? 'Unhandled rejection without a reason' : String(reason));
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

  const errorId = Date.now().toString(36);
  const now = Date.now();
  rejectionMetrics.recentUnhandled = rejectionMetrics.recentUnhandled.filter(
    (item) => now - item.timestamp < UNHANDLED_REJECTION_WINDOW_MS,
  );
  rejectionMetrics.recentUnhandled.push({
    code: errorCode,
    name: errorName,
    message: error.message.substring(0, 200),
    timestamp: now,
  });

  log.rejection(errorId, 'unhandled', {
    errorCode,
    errorName,
    message: error.message,
    stack: error.stack?.split('\n').slice(0, 5).join('\n'),
  });

  rejectionMetrics.unhandled++;

  if (isFatalError(errorCode, errorName)) {
    log.error('FATAL error detected - initiating shutdown', {
      event: 'fatal_error',
      errorId,
      errorCode,
      errorName
    });
    void gracefulShutdown('FATAL_ERROR', 1);
    return;
  }

  if (rejectionMetrics.recentUnhandled.length >= 3) {
    log.error('Repeated non-fatal unhandled rejections detected; process remains alive', {
      event: 'rejection_degraded',
      errorId,
      count: rejectionMetrics.recentUnhandled.length,
      windowMs: UNHANDLED_REJECTION_WINDOW_MS,
      action: 'logged_not_restarted',
    });
  }
});

// Expose metrics for health checks
process.rejectionMetrics = rejectionMetrics;

// Log deterministic build identity at startup
const deploymentIdentity = {
  service: 'admin',
  commitSha: process.env.GIT_SHA ?? 'unknown',
  buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? 'unknown',
  builtAt: process.env.BUILD_TIMESTAMP ?? 'unknown',
  nodeEnv: process.env.NODE_ENV ?? 'unknown',
};
console.info('[deployment]', JSON.stringify(deploymentIdentity));

log.serverStart(host, port, { startup: 'initiated', ...deploymentIdentity });

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
    startMonitoring((level, msg, ctx) => {
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
