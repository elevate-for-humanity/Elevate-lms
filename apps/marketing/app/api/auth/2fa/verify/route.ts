/**
 * POST /api/auth/2fa/verify
 *
 * Verifies a TOTP token or backup code for the currently authenticated user.
 * Called after signInWithPassword succeeds when the user has 2FA enabled.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';
import { verify2FAToken, verifyBackupCode } from '@/lib/auth/two-factor';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'auth');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return safeError('Not authenticated', 401);

  const { token, isBackupCode } = await req.json().catch(() => ({}));
  if (!token || typeof token !== 'string') return safeError('Token required', 400);

  const valid = isBackupCode
    ? await verifyBackupCode(user.id, token.trim())
    : await verify2FAToken(user.id, token.trim());

  if (!valid) return safeError('Invalid or expired code', 401);
  return NextResponse.json({ ok: true });
}
