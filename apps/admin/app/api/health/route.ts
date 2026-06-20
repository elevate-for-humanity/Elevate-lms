// PUBLIC ROUTE: platform health check and env verification — no auth
import { NextResponse } from 'next/server';
import { getServerSupabaseEnvMisconfigurationReason } from '@/lib/supabase/server-env';
import { isPlaceholderSupabaseConfig } from '@/lib/supabase/public-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  const supabaseMisconfigured = getServerSupabaseEnvMisconfigurationReason();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKeyLooksPlaceholder =
    !!anonKey &&
    isPlaceholderSupabaseConfig(supabaseUrl ?? null, anonKey);

  const ok = missing.length === 0 && !supabaseMisconfigured;

  return NextResponse.json(
    {
      ok,
      service: 'elevate-admin',
      missing,
      supabaseMisconfigured: supabaseMisconfigured ?? undefined,
      supabaseAnonKeyLooksPlaceholder: anonKeyLooksPlaceholder || undefined,
      ts: new Date().toISOString(),
    },
    {
      status: ok ? 200 : 500,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
