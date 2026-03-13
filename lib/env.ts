// Environment configuration with SAFE fallbacks
// This file ensures the app NEVER crashes due to missing env vars

// Safe env access - returns empty string if not set
function safeEnv(key: string): string {
  if (typeof process === 'undefined') return '';
  return process.env[key] || '';
}

export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: safeEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: safeEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: safeEnv('SUPABASE_SERVICE_ROLE_KEY'),
  DATABASE_URL: safeEnv('DATABASE_URL'),
  
  // Site
  NEXT_PUBLIC_SITE_URL: safeEnv('NEXT_PUBLIC_SITE_URL') || 'https://www.elevateforhumanity.org',
  
  // Stripe
  STRIPE_SECRET_KEY: safeEnv('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: safeEnv('STRIPE_WEBHOOK_SECRET'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: safeEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  
  // Email
  SENDGRID_API_KEY: safeEnv('SENDGRID_API_KEY'),
  
  // OpenAI
  OPENAI_API_KEY: safeEnv('OPENAI_API_KEY'),
  
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
