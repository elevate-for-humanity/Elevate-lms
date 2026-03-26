import { logger } from '@/lib/logger';
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

    if (this.isDevelopment) {
      // Pretty format for development
      let output = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      if (context) {
        output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
      }
      if (error) {
        const errorMessage = 'Operation failed';
        const errorStack = error instanceof Error ? error.stack : undefined;
        output += `\n  Error: ${errorMessage}`;
        if (errorStack) {
          output += `\n  Stack: ${errorStack}`;
        }
      }
      return output;
    }

    // JSON format for production (easier to parse by log aggregators)
    return JSON.stringify({
      ...entry,
      error: error ? {
        message: 'Operation failed',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      } : undefined,
    });
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
          console.debug(formatted);
        }
        break;
      case 'info':
        logger.info(formatted);
        break;
      case 'warn':
        logger.warn(formatted);
        break;
      case 'error':
        logger.error(formatted);
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
  error: (message: string, error?: Error, context?: Record<string, any>) => logger.error(message, error, context),
};
