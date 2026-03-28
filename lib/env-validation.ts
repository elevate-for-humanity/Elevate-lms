import { logger } from '@/lib/logger';
/**
 * Environment Variable Validation
 *
 * Validates required environment variables and provides helpful error messages.
 * Allows optional services to degrade gracefully.
 */

export interface EnvConfig {
  // Required - Core functionality
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  // Required in production: used for redirect targets in checkout and auth flows.
  // Missing value causes checkout failure redirects to point at localhost.
  NEXT_PUBLIC_SITE_URL: string;

  // Optional - Services degrade gracefully if missing
  SUPABASE_SERVICE_ROLE_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  SENDGRID_API_KEY?: string;
  OPENAI_API_KEY?: string;
  SUPERSONIC_API_KEY?: string;
  JOTFORM_API_KEY?: string;
  SENTRY_DSN?: string;
}

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * Validate required environment variables
 * Throws error if required vars are missing
 */
export function validateRequiredEnv(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  // NEXT_PUBLIC_SITE_URL is required in production — missing value causes
  // checkout and auth redirects to point at localhost instead of the real domain.
  if (process.env.NODE_ENV === 'production') {
    required.push('NEXT_PUBLIC_SITE_URL');
  }

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new EnvValidationError(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\n\n` +
        `Please create a .env.local file with these variables.\n` +
        `See .env.example for reference.`
    );
  }
}

/**
 * Check if a service is available
 */
export function isServiceAvailable(service: keyof EnvConfig): boolean {
  return !!process.env[service];
}

/**
 * Get environment variable with fallback
 */
export function getEnvOrFallback(key: string, fallback: string = ''): string {
  return process.env[key] || fallback;
}

/**
 * Service availability checks
 */
export const services = {
  stripe: () => isServiceAvailable('STRIPE_SECRET_KEY'),
  resend: () => isServiceAvailable('SENDGRID_API_KEY'),
  openai: () => isServiceAvailable('OPENAI_API_KEY'),
  supersonic: () => isServiceAvailable('SUPERSONIC_API_KEY'),
  jotform: () => isServiceAvailable('JOTFORM_API_KEY'),
  sentry: () => isServiceAvailable('SENTRY_DSN'),
  supabaseAdmin: () => isServiceAvailable('SUPABASE_SERVICE_ROLE_KEY'),
};

/**
 * Get service status for debugging
 */
export function getServiceStatus() {
  return {
    stripe: services.stripe(),
    resend: services.resend(),
    openai: services.openai(),
    supersonic: services.supersonic(),
    jotform: services.jotform(),
    sentry: services.sentry(),
    supabaseAdmin: services.supabaseAdmin(),
  };
}

/**
 * Log service availability (development only)
 */
export function logServiceStatus() {
  if (process.env.NODE_ENV === 'development') {
    const status = getServiceStatus();
    Object.entries(status).forEach(([service, available]) => {
    });
  }
}

// Validate on import (only in Node.js environment)
if (typeof window === 'undefined') {
  try {
    validateRequiredEnv();
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(error);
      // Don't throw during build - let it fail gracefully
      if (process.env.npm_lifecycle_event !== 'build') {
        throw error;
      }
    }
  }
}
