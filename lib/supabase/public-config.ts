import { normalizeSupabaseProjectUrl } from '@/lib/supabase/normalize-url';

/**
 * Public Supabase URL + anon key (safe to expose to the browser).
 *
 * NEXT_PUBLIC_* values are inlined at build time. Runtime env on the server
 * unless we inject config per request (see SupabasePublicConfigScript).
 */

export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

declare global {
  interface Window {
    __EFH_SUPABASE_PUBLIC__?: SupabasePublicConfig;
  }
}

export function isPlaceholderSupabaseConfig(
  url?: string | null,
  anonKey?: string | null,
): boolean {
  if (!url?.trim() || !anonKey?.trim()) return true;
  const key = anonKey.trim();
  if (key === 'placeholder' || key === 'build-placeholder') return true;
  if (/placeholder/i.test(key)) return true;
  if (url.includes('placeholder')) return true;
  return false;
}

/**
 * Server-side env resolution. Prefer SUPABASE_* (runtime injection) over NEXT_PUBLIC_*
 * because Next inlines NEXT_PUBLIC_* at build time (Docker build-placeholder leaks otherwise).
 */
export function resolveServerSupabaseRawEnv(): { url?: string; anonKey?: string } {
  const url = normalizeSupabaseProjectUrl(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const anonKey =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return { url, anonKey };
}

/** Read from process.env (runtime Northflank + optional build-time NEXT_PUBLIC_*). */
export function getServerPublicSupabaseConfig(): SupabasePublicConfig | null {
  const { url, anonKey } = resolveServerSupabaseRawEnv();
  if (isPlaceholderSupabaseConfig(url, anonKey)) return null;
  return { url: url!, anonKey: anonKey! };
}

/** Browser: prefer runtime injection, then build-time inlined env (if not placeholder). */
export function getBrowserPublicSupabaseConfig(): SupabasePublicConfig | null {
  if (typeof window !== 'undefined') {
    const runtime = window.__EFH_SUPABASE_PUBLIC__;
    if (
      runtime?.url &&
      runtime?.anonKey &&
      !isPlaceholderSupabaseConfig(runtime.url, runtime.anonKey)
    ) {
      return { url: runtime.url, anonKey: runtime.anonKey };
    }
  }

  const url = normalizeSupabaseProjectUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  );
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim();
  if (isPlaceholderSupabaseConfig(url, anonKey)) return null;
  return { url: url!, anonKey: anonKey! };
}

export function isSupabaseAuthConfigured(): boolean {
  return getBrowserPublicSupabaseConfig() !== null;
}

/** Fetch runtime config from the server when build-time inlining was empty. */
export async function hydrateBrowserSupabaseConfig(): Promise<SupabasePublicConfig | null> {
  const existing = getBrowserPublicSupabaseConfig();
  if (existing) return existing;

  if (typeof window === 'undefined') return null;

  try {
    const res = await fetch('/api/public/supabase-config', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string; anonKey?: string };
    if (!data.url || !data.anonKey || isPlaceholderSupabaseConfig(data.url, data.anonKey)) {
      return null;
    }
    window.__EFH_SUPABASE_PUBLIC__ = { url: data.url, anonKey: data.anonKey };
    const { resetSupabaseBrowserClientCache } = await import('@/lib/supabase/client');
    resetSupabaseBrowserClientCache();
    return { url: data.url, anonKey: data.anonKey };
  } catch {
    return null;
  }
}
