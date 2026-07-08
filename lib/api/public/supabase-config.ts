// PUBLIC ROUTE helper: Supabase anon key is intended for browser use (RLS-protected).

import { NextResponse } from 'next/server';
import { getServerPublicSupabaseConfig } from '@/lib/supabase/public-config';

export function getSupabasePublicConfigResponse() {
  const config = getServerPublicSupabaseConfig();
  if (!config) {
    return NextResponse.json(
      { error: 'Authentication service is not configured on this deployment.' },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { url: config.url, anonKey: config.anonKey },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    },
  );
}
