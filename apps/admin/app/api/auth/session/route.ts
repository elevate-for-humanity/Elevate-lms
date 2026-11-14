/**
 * GET /api/auth/session
 * Returns current user session info
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request) {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ user: null, session: null }, { status: 401 });
  }

  return NextResponse.json({
    user,
    session: { expires_at: user.app_metadata?.exp },
    service: process.env.SERVICE_NAME ?? 'admin',
  });
}
