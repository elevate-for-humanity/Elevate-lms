export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/apprenticeships/link-account
 * Body: { apprenticeId: string; userId: string }
 *
 * Writes user_id onto an apprentice record that was missing it.
 * Requires admin/super_admin/staff role.
 */

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const authResult = await apiRequireAdmin(req);
  if (authResult.error) return authResult.error;

  let body: { apprenticeId?: string; userId?: string };
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { apprenticeId, userId } = body;
  if (!apprenticeId || !userId) return safeError('apprenticeId and userId are required', 400);

  const db = await requireAdminClient();

  // Verify the apprentice record exists and has no user_id
  const { data: existing, error: fetchErr } = await db
    .from('apprentices')
    .select('id, user_id, email')
    .eq('id', apprenticeId)
    .maybeSingle();

  if (fetchErr || !existing) return safeError('Apprentice record not found', 404);
  if (existing.user_id) return safeError('Apprentice already has a linked user_id', 409);

  // Verify the target auth user exists
  const { data: authUser, error: authErr } = await db.auth.admin.getUserById(userId);
  if (authErr || !authUser?.user) return safeError('Auth user not found', 404);

  // Write the link
  const { error: updateErr } = await db
    .from('apprentices')
    .update({ user_id: userId })
    .eq('id', apprenticeId);

  if (updateErr) {
    logger.error('Failed to link apprentice account', updateErr);
    return safeInternalError(updateErr, 'Failed to update apprentice record');
  }

  logger.info(`Linked apprentice ${apprenticeId} to user ${userId} (${authUser.user.email})`);

  return NextResponse.json({ ok: true, apprenticeId, userId });
}
