// Centralized logging utility

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;

    // Serialize any thrown value — Error instances, plain objects, strings, etc.
    const serializeError = (e: unknown) => {
      if (!e) return undefined;
      if (e instanceof Error) {
        return { name: e.name, message: e.message, stack: e.stack };
      }
      if (typeof e === 'object') {
        // Supabase error objects: { code, details, hint, message }
        try {
          return JSON.parse(JSON.stringify(e));
        } catch {
          return { raw: String(e) };
        }
      }
      return { raw: String(e) };
    };

    if (this.isDevelopment) {
      // Pretty format for development
      let output = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      if (context) {
        output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
      }
      if (error) {
        const serialized = serializeError(error);
        output += `\n  Error: ${JSON.stringify(serialized, null, 2)}`;
      }
      return output;
    }

    // JSON format for production (easier to parse by log aggregators)
    // Cap at 16 KB to prevent RangeError when error objects contain large payloads.
    const MAX_BYTES = 16 * 1024;
    const raw = JSON.stringify({
      ...entry,
      error: serializeError(error),
    });
    return raw.length > MAX_BYTES ? raw.slice(0, MAX_BYTES) + '…[truncated]' : raw;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    // Skip logging in test environment unless explicitly enabled
    if (this.isTest && !process.env.ENABLE_TEST_LOGGING) {
      return;
    }

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
        if (this.isDevelopment) {
          console.info(formatted);
        }
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

    // In production, also send to external logging service
    if (!this.isDevelopment && !this.isTest) {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry) {
    // SECTION 8: Send errors to Sentry
    try {
      // Sentry integration for error tracking
      if (entry.level === 'error' && process.env.SENTRY_DSN) {
        const Sentry = await import('@sentry/nextjs');

        if (entry.error) {
          Sentry.captureException(entry.error, {
            extra: {
              message: entry.message,
              ...entry.context,
            },
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

      // Also send to custom log endpoint if configured
      if (process.env.LOG_ENDPOINT) {
        await fetch(process.env.LOG_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      }
    } catch {
      /* Fail silently to avoid infinite loops */
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, context, error);
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const log = {
  debug: (message: string, context?: Record<string, any>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, any>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, any>) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: Record<string, any>) =>
    logger.error(message, error, context),
};
