import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  getInstructorCurriculumLicenseStatus,
  logInstructorLicenseEvent,
} from '@/lib/legal/instructorCurriculumLicense';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function callerRole(
  db: NonNullable<Awaited<ReturnType<typeof requireAdminClient>>>,
  userId: string,
) {
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  return profile?.role ?? null;
}

/**
 * GET: an instructor reads their own curriculum-license status; an admin
 * may read any instructor's status with ?user_id=.
 */
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return safeError('Database unavailable', 503);

  const role = await callerRole(db, auth.id);
  if (!role || !['instructor', 'admin', 'super_admin', 'staff'].includes(role)) {
    return safeError('Forbidden', 403);
  }
  const isAdmin = ['admin', 'super_admin'].includes(role);
  const targetId = req.nextUrl.searchParams.get('user_id');
  const userId = isAdmin && targetId ? targetId : auth.id;

  const status = await getInstructorCurriculumLicenseStatus(db, userId);
  return NextResponse.json({
    ok: true,
    user_id: userId,
    authorized: status.authorized,
    reason: status.reason,
    agreement_version: status.agreementVersion,
    license_reference: status.licenseReference,
  });
}

/**
 * POST: an admin revokes an instructor's curriculum license. A revoked
 * license fails the server-side gate immediately; the instructor must sign
 * the current agreement again to be re-licensed.
 */
export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return safeError('Database unavailable', 503);

  const role = await callerRole(db, auth.id);
  if (role !== 'admin' && role !== 'super_admin') {
    return safeError('Forbidden', 403);
  }

  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await req.json();
    if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>;
  } catch {
    body = {};
  }
  const userId = typeof body.user_id === 'string' ? body.user_id.trim() : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!userId) return safeError('user_id is required', 400);
  if (!reason) return safeError('reason is required', 400);

  const { data: revoked, error } = await db
    .from('instructor_curriculum_licenses')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: auth.id,
      revoked_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('status', 'active')
    .select('id,agreement_version,license_reference');

  if (error) return safeInternalError(error, 'Failed to revoke instructor license');
  if (!revoked || revoked.length === 0) {
    return safeError('No active instructor license for this user', 404);
  }
  await logInstructorLicenseEvent(db, {
    userId,
    action: 'instructor_curriculum_ip.revoked',
    details: {
      reason,
      revoked_by: auth.id,
      licenses: revoked.map((row: any) => ({
        agreement_version: row.agreement_version,
        license_reference: row.license_reference,
      })),
    },
    ipAddress:
      req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
  });
  return NextResponse.json({ ok: true, revoked: revoked.length });
}
