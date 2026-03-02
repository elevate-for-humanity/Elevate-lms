/**
 * Standalone secrets loader for Netlify functions (outside Next.js bundle).
 * Uses raw fetch against Supabase REST API — no @supabase/supabase-js dependency.
 */

let hydrated = false;

export async function hydrateProcessEnv(): Promise<void> {
  if (hydrated) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    const res = await fetch(
      `${url}/rest/v1/app_secrets?scope=eq.runtime&select=key,value`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      }
    );

    if (!res.ok) {
      console.error('[secrets-standalone] fetch failed:', res.status);
      return;
    }

    const rows: { key: string; value: string }[] = await res.json();
    for (const row of rows) {
      if (!process.env[row.key]) {
        process.env[row.key] = row.value;
      }
    }
  } catch (e) {
    console.error('[secrets-standalone] error:', e);
  }

  hydrated = true;
}
