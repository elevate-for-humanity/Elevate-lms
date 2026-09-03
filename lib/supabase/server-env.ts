import {
  isPlaceholderSupabaseConfig,
  resolveServerSupabaseRawEnv,
} from '@/lib/supabase/public-config';

export type ServerSupabaseEnv = {
  url: string;
  anonKey: string;
};

/** Resolved Supabase URL + anon key for server auth (runtime process.env). */
export function resolveServerSupabaseEnv(): ServerSupabaseEnv | null {
  const { url, anonKey } = resolveServerSupabaseRawEnv();
  if (isPlaceholderSupabaseConfig(url, anonKey)) return null;
  return { url: url!, anonKey: anonKey! };
}

export function getServerSupabaseEnvMisconfigurationReason(): string | null {
  const { url, anonKey } = resolveServerSupabaseRawEnv();

  if (!url?.trim()) return 'NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) is missing';
  if (!anonKey?.trim()) return 'NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY) is missing';
  if (isPlaceholderSupabaseConfig(url, anonKey)) {
    return 'Supabase URL or anon key is still a build placeholder — set real project credentials in Northflank secret group';
  }
  return null;
}
