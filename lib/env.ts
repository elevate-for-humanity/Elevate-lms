import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
// Environment configuration with SAFE fallbacks
// This file ensures the app NEVER crashes due to missing env vars

// Safe env access - returns empty string if not set
function safeEnv(key: string): string {
  if (typeof process === 'undefined') return '';
  return process.env[key] || '';
}

/**
 * requireEnv — fail-fast guard for required variables.
 * Use in API routes after hydrateProcessEnv(), never at module level.
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Ensure it is set in AWS SSM Parameter Store (production) or .env.local (development).`,
    );
  }
  return value;
}

/**
 * getEnv — optional env accessor with fallback.
 */
export function getEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

/**
 * assertEnvPresent — check multiple keys at once, returns all missing.
 * Use in startup health checks and /api/internal/system-health.
 */
export function assertEnvPresent(keys: string[]): { ok: boolean; missing: string[] } {
  const missing = keys.filter(k => !process.env[k]);
  return { ok: missing.length === 0, missing };
}

export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: safeEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: safeEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: safeEnv('SUPABASE_SERVICE_ROLE_KEY'),
  DATABASE_URL: safeEnv('DATABASE_URL'),

  // Site
  NEXT_PUBLIC_SITE_URL: safeEnv('NEXT_PUBLIC_SITE_URL') || PLATFORM_DEFAULTS.siteUrl,

  // Stripe
  STRIPE_SECRET_KEY: safeEnv('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: safeEnv('STRIPE_WEBHOOK_SECRET'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: safeEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),

  // Email
  SENDGRID_API_KEY: safeEnv('SENDGRID_API_KEY'),

  // AI / Media generation — ECS server workers (video/audio generation, AI chat)
  OPENAI_API_KEY: safeEnv('OPENAI_API_KEY'),
  DID_API_KEY: safeEnv('DID_API_KEY'),

  SITE_URL: safeEnv('NEXT_PUBLIC_SITE_URL'),

  // Turnstile
  TURNSTILE_SECRET_KEY: safeEnv('TURNSTILE_SECRET_KEY'),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: safeEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY'),
} as const;

// Service availability checks - never throw
export function hasServiceRoleKey(): boolean {
  return Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasEmailConfigured(): boolean {
  return Boolean(env.SENDGRID_API_KEY);
}

export function hasStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
}

export function hasSupabaseConfigured(): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasOpenAIConfigured(): boolean {
  return Boolean(env.OPENAI_API_KEY);
}

export function hasTurnstileConfigured(): boolean {
  return Boolean(env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}
