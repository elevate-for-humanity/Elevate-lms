/**
 * lib/logger.js - Structured logging for server entry points
 * CommonJS module compatible with server.js files
 */

const LOG_ENDPOINT = process.env.LOG_ENDPOINT;
const SENTRY_DSN = process.env.SENTRY_DSN;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Structured log entry
 */
function createLogEntry(level, message, context) {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: process.env.SERVICE_NAME || 'elevate-lms',
    pid: process.pid,
    hostname: process.env.HOSTNAME || require('os').hostname(),
    ...context,
  };
}

/**
 * Format log entry for console output
 */
function formatForConsole(entry) {
  const { level, timestamp, message, service, pid, ...context } = entry;
  const contextStr = Object.keys(context).length > 0 
    ? ` ${JSON.stringify(context)}` 
    : '';
  return `[${timestamp}] ${level.toUpperCase()} [${service}] (pid=${pid}) ${message}${contextStr}`;
}

/**
 * Send to external services
 */
async function sendToExternal(entry) {
  if (NODE_ENV === 'development' || NODE_ENV === 'test') return;

  try {
    // Send to Sentry for errors
    if (entry.level === 'error' && SENTRY_DSN) {
      // Sentry would be initialized elsewhere, just log for now
      console.info('[logger] Would send to Sentry:', entry.message);
    }

    // Send to custom log endpoint
    if (LOG_ENDPOINT) {
      await fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    }
  } catch (err) {
    // Fail silently to avoid loops
  }
}

/**
 * Create structured logger for a service
 */
function createLogger(serviceName) {
  const service = serviceName || 'elevate-lms';

  return {
    debug(message, context) {
      if (NODE_ENV === 'production') return; // Skip debug in prod
      
      const entry = createLogEntry('debug', message, { service, ...context });
      console.info(formatForConsole(entry));
    },

    info(message, context) {
      const entry = createLogEntry('info', message, { service, ...context });
      console.info(formatForConsole(entry));
      sendToExternal(entry);
    },

    warn(message, context) {
      const entry = createLogEntry('warn', message, { service, ...context });
      console.warn(formatForConsole(entry));
      sendToExternal(entry);
    },

    error(message, contextOrError, extraContext) {
      let context = contextOrError;
      let error = null;

      if (contextOrError instanceof Error) {
        error = contextOrError;
        context = extraContext;
      }

      const entry = createLogEntry('error', message, { 
        service, 
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code,
        } : null,
        ...context,
      });
      console.error(formatForConsole(entry));
      sendToExternal(entry);
    },

    // Specialized methods for server lifecycle
    serverStart(host, port, extras = {}) {
      this.info('Server started', {
        event: 'server_start',
        host,
        port,
        ...extras,
      });
    },

    serverStop(signal, uptimeSeconds, extras = {}) {
      this.info('Server stopped', {
        event: 'server_stop',
        signal,
        uptimeSeconds,
        ...extras,
      });
    },

    rejection(errorId, type, details) {
      // type: 'suppressed' | 'unhandled' | 'fatal' | 'recovery'
      const level = type === 'fatal' || type === 'unhandled' ? 'error' : 'warn';
      const entry = createLogEntry(level, `Promise rejection: ${type}`, {
        event: 'promise_rejection',
        rejectionType: type,
        errorId,
        ...details,
      });
      if (level === 'error') {
        console.error(formatForConsole(entry));
      } else {
        console.warn(formatForConsole(entry));
      }
      sendToExternal(entry);
    },

    recovery(errorId, action, details) {
      this.info(`Recovery action: ${action}`, {
        event: 'recovery',
        errorId,
        action,
        ...details,
      });
    },
  };
}

module.exports = { createLogger };
