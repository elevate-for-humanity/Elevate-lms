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
  const url = normalizeSupabaseProjectUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  );
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    return { ok: false, error: 'Missing Supabase URL or service role key' };
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
