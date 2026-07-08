/**
 * Canonical secret names injected into the admin ECS task from SSM (/elevate/*).
 * Source of truth: aws/ecs-task-admin.json — keep in sync when task def changes.
 */
export const ADMIN_ECS_SECRET_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'SENDGRID_API_KEY',
  'CRON_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXTAUTH_SECRET',
  'GITHUB_TOKEN',
  'SENDGRID_FROM',
  'SESSION_SECRET',
  'STRIPE_WEBHOOK_SECRET_BARBER',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SUPABASE_URL',
  'STUDIO_SHELL_WS_URL',
  'STUDIO_SHELL_SECRET',
  'GITHUB_REPO',
  'INTERNAL_API_KEY',
  'REDIS_URL',
  'STUDIO_SHELL_WS_URL_PUBLIC',
  'STUDIO_TOKEN_SECRET',
] as const;

/** Keys the devcontainer setup script expects from SSM (via .env.local). */
export const DEVCONTAINER_SSM_PULL_PATH = '/elevate/';
