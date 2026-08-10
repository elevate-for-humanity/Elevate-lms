// Centralized logging utility

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, any>;

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  private serializeError(value: unknown) {
    if (value === undefined || value === null) return undefined;
    if (value instanceof Error) {
      return { name: value.name, message: value.message, stack: value.stack };
    }
    if (typeof value === 'object') {
      try {
        return JSON.parse(JSON.stringify(value));
      } catch {
        return { raw: String(value) };
      }
    }
    return { raw: String(value) };
  }

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;

    if (this.isDevelopment) {
      let output = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      if (context) output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
      if (error !== undefined) {
        output += `\n  Error: ${JSON.stringify(this.serializeError(error), null, 2)}`;
      }
      return output;
    }

    const MAX_BYTES = 16 * 1024;
    const raw = JSON.stringify({
      ...entry,
      error: this.serializeError(error),
    });
    return raw.length > MAX_BYTES ? `${raw.slice(0, MAX_BYTES)}…[truncated]` : raw;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
    if (this.isTest && !process.env.ENABLE_TEST_LOGGING) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    const formatted = this.formatMessage(entry);
    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.info(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }

    if (!this.isDevelopment && !this.isTest) {
      void this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry) {
    try {
      if (entry.level === 'error' && process.env.SENTRY_DSN) {
        const Sentry = await import('@sentry/nextjs');
        if (entry.error !== undefined) {
          Sentry.captureException(entry.error, {
            extra: { message: entry.message, ...entry.context },
            tags: {
              correlation_id: entry.context?.correlationId || entry.context?.paymentIntentId,
            },
          });
        } else {
          Sentry.captureMessage(entry.message, {
            level: 'error',
            extra: entry.context,
            tags: {
              correlation_id: entry.context?.correlationId || entry.context?.paymentIntentId,
            },
          });
        }
      }

      if (process.env.LOG_ENDPOINT) {
        await fetch(process.env.LOG_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      }
    } catch {
      // Logging must never crash the request path.
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  /**
   * Backward-compatible error logger.
   * Existing code historically used both logger.error(message, error, context)
   * and logger.error(message, context). Accept both forms and normalize them.
   */
  error(message: string, errorOrContext?: unknown, context?: LogContext) {
    if (
      context === undefined &&
      errorOrContext &&
      typeof errorOrContext === 'object' &&
      !(errorOrContext instanceof Error)
    ) {
      this.log('error', message, errorOrContext as LogContext);
      return;
    }
    this.log('error', message, context, errorOrContext);
  }
}

export const logger = new Logger();

export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, errorOrContext?: unknown, context?: LogContext) =>
    logger.error(message, errorOrContext, context),
};
