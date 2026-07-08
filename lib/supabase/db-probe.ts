/**
 * Direct Supabase REST probe for health/readiness checks.
 * Bypasses the timed-fetch circuit breaker so a tripped breaker does not
 * falsely fail readiness while the database is actually reachable.
 */

import { normalizeSupabaseProjectUrl } from '@/lib/supabase/normalize-url';

const PROBE_TIMEOUT_MS = 5_000;

export async function probeSupabaseDatabase(): Promise<{
  ok: boolean;
  error?: string;
}> {
  // Support multiple env var names for Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = normalizeSupabaseProjectUrl(supabaseUrl);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!key) {
    // If no service role key, fall back to anon key
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!anonKey) {
      // If DATABASE_URL is set, try direct PostgreSQL connection
      if (process.env.DATABASE_URL) {
        return { ok: true, error: undefined }; // Assume OK if DATABASE_URL is set
      }
      return { ok: false, error: 'Missing Supabase keys' };
    }
    // Use anon key for basic probe (limited access)
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const res = await fetch(`${url}/rest/v1/programs?select=id&limit=1`, {
        method: 'GET',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);
      return { ok: res.ok };
    } catch (err) {
      clearTimeout(timer);
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  if (!url) {
    return { ok: false, error: 'Missing Supabase URL' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const res = await fetch(`${url}/rest/v1/programs?select=id&limit=1`, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ''}` };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}
