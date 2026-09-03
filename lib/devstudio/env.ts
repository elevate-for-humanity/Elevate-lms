import { getRuntime } from './webcontainer/runtime';

/**
 * Environment variables that are safe to inject into WebContainer
 * ONLY NEXT_PUBLIC_* variables are allowed
 */
export interface DevStudioEnvConfig {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  // Add other NEXT_PUBLIC_* vars as needed
}

// Allowlist of env var prefixes that can be injected
const ALLOWED_PREFIXES = ['NEXT_PUBLIC_'];

/**
 * Validate that an env var name is safe to inject
 */
function isAllowedEnvVar(name: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/**
 * Filter env config to only allowed variables
 */
function filterEnvConfig(config: Record<string, string | undefined>): Record<string, string> {
  const filtered: Record<string, string> = {};

  for (const [key, value] of Object.entries(config)) {
    if (isAllowedEnvVar(key) && value !== undefined) {
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Generate .env.local content from config
 */
function generateEnvFileContent(config: Record<string, string>): string {
  const lines = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .sort();

  return lines.join('\n') + '\n';
}

/**
 * Inject safe environment variables into WebContainer
 * Creates .env.local file with only NEXT_PUBLIC_* variables
 */
export async function injectEnvVars(config: DevStudioEnvConfig): Promise<void> {
  const runtime = getRuntime();

  if (!runtime.isReady()) {
    throw new Error('WebContainer not ready');
  }

  const safeConfig = filterEnvConfig(config as Record<string, string | undefined>);
  const envContent = generateEnvFileContent(safeConfig);

  await runtime.writeFile('.env.local', envContent);
}

/**
 * Get default env config from current environment
 * Only returns NEXT_PUBLIC_* variables
 */
export function getDefaultEnvConfig(): DevStudioEnvConfig {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  };
}

/**
 * Load env config from localStorage (for user-specific overrides)
 */
export function loadStoredEnvConfig(): DevStudioEnvConfig | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('devstudio_env');
    if (stored) {
      const parsed = JSON.parse(stored);
      return filterEnvConfig(parsed) as DevStudioEnvConfig;
    }
  } catch {
    // Invalid stored config
  }

  return null;
}

/**
 * Save env config to localStorage
 */
export function saveEnvConfig(config: DevStudioEnvConfig): void {
  if (typeof window === 'undefined') return;

  const safeConfig = filterEnvConfig(config as Record<string, string | undefined>);
  localStorage.setItem('devstudio_env', JSON.stringify(safeConfig));
}

/**
 * Clear stored env config
 */
export function clearStoredEnvConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('devstudio_env');
}
