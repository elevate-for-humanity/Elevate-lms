/**
 * Enforce required environment variables
 * Throws error if any are missing
 */
export function requireEnv(keys: string[]): void {
  const missing = keys.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}`,
    );
  }
}

/**
 * Get required env var or throw
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

/**
 * Validate clone-specific env vars
 */
export function validateCloneEnv(): void {
  requireEnv([
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_SITE_URL',
  ]);
}
