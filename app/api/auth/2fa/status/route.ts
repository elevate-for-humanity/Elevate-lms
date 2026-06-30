/**
 * GET /api/auth/2fa/status
 *
 * Returns whether 2FA is enabled for the currently authenticated user.
 * Called immediately after signInWithPassword to decide whether to show
 * the TOTP challenge screen.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return safeError('Not authenticated', 401);

  const { data } = await supabase
    .from('two_factor_auth')
    .select('enabled')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({ enabled: data?.enabled === true });
}
