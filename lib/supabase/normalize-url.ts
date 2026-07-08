/**
 * Normalize Supabase project URLs from env / platform_secrets.
 *
 * Common misconfig (Northflank / copy-paste): `db.<ref>.supabase.co` — that host
 * does not resolve (ENOTFOUND). Canonical API URL is `https://<ref>.supabase.co`.
 */
export function normalizeSupabaseProjectUrl(
  url: string | undefined | null,
): string | undefined {
  if (!url?.trim()) return undefined;

  let normalized = url.trim();

  // Strip mistaken db. API hostname prefix
  if (/^db\.[a-z0-9-]+\.supabase\.co\/?$/i.test(normalized)) {
    normalized = normalized.replace(/^db\./i, '');
  }

  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized.replace(/^\/+/, '')}`;
  }

  try {
    const parsed = new URL(normalized);
    if (!parsed.hostname.endsWith('.supabase.co')) {
      return normalized;
    }
    // Force https for Supabase REST
    parsed.protocol = 'https:';
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.origin;
  } catch {
    return undefined;
  }
}

/** Apply normalized URL to process.env keys used by the app. */
export function applyNormalizedSupabaseUrlToEnv(): void {
  for (const key of [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_URL',
  ] as const) {
    const current = process.env[key];
    const fixed = normalizeSupabaseProjectUrl(current);
    if (fixed && fixed !== current) {
      process.env[key] = fixed;
    }
  }
}
