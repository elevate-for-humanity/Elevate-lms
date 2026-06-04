/**
 * Canonical env var names for Northflank secret groups — no duplicate aliases.
 */

/** Drop these keys when syncing; readers use getNorthflankToken() fallbacks instead. */
export const DROP_SECRET_KEYS = new Set([
  'NORTHFLANK_API_KEY',
  'NF_API_TOKEN',
  'Northflank_api_token',
]);

/** If SUPABASE_URL equals NEXT_PUBLIC_SUPABASE_URL, keep only NEXT_PUBLIC_* + service role. */
const SUPABASE_CANONICAL_PUBLIC = 'NEXT_PUBLIC_SUPABASE_URL';

export const SUPABASE_URL_FALLBACK = 'https://cuxzzpsyufcewtmicszk.supabase.co';

function isPlaceholderAnon(value) {
  if (!value || typeof value !== 'string') return true;
  const v = value.trim();
  return v === 'placeholder' || v.length < 80;
}

/**
 * @param {Record<string, string>} variables
 * @returns {Record<string, string>}
 */
export function dedupeSecretVariables(variables) {
  const out = { ...variables };

  for (const key of DROP_SECRET_KEYS) {
    delete out[key];
  }

  const pubUrl = out[SUPABASE_CANONICAL_PUBLIC] || out.SUPABASE_URL;
  if (pubUrl) {
    out[SUPABASE_CANONICAL_PUBLIC] = pubUrl;
    if (out.SUPABASE_URL === pubUrl) {
      delete out.SUPABASE_URL;
    }
  }

  if (isPlaceholderAnon(out.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    const fromEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (fromEnv && !isPlaceholderAnon(fromEnv)) {
      out.NEXT_PUBLIC_SUPABASE_ANON_KEY = fromEnv;
    }
  }

  const defaultUrl = defaultSupabaseUrl();
  if (!out[SUPABASE_CANONICAL_PUBLIC]?.trim() && defaultUrl) {
    out[SUPABASE_CANONICAL_PUBLIC] = defaultUrl;
  }

  if (!out.SUPABASE_URL?.trim() && out.SUPABASE_SERVICE_ROLE_KEY) {
    out.SUPABASE_URL = out[SUPABASE_CANONICAL_PUBLIC];
  }

  return out;
}
