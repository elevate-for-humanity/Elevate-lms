// PUBLIC ROUTE: Supabase anon key is intended for browser use (RLS-protected).

import { getSupabasePublicConfigResponse } from '@/lib/api/public/supabase-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  return getSupabasePublicConfigResponse();
}
