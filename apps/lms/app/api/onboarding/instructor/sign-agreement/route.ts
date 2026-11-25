import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  extractRequestMetadata,
  recordAgreementAcceptance,
} from '@/lib/legal/recordAgreementAcceptance';
import {
  INSTRUCTOR_CURRICULUM_IP_AGREEMENT_TYPE,
  INSTRUCTOR_CURRICULUM_IP_VERSION_HASHES,
  getCurrentInstructorCurriculumAgreement,
  issueInstructorCurriculumLicense,
  logInstructorLicenseEvent,
} from '@/lib/legal/instructorCurriculumLicense';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function signCurriculumIpAgreement(
  req: NextRequest,
  auth: { id: string; user: { email: string | null } | null },
  db: NonNullable<Awaited<ReturnType<typeof requireAdminClient>>>,
  body: Record<string, unknown>,
) {
  // Only instructors teach. Admins and staff administer licenses; they do
  // not self-license through this endpoint.
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', auth.id)
    .maybeSingle();
  if (!profile || profile.role !== 'instructor') {
    return safeError('Forbidden', 403);
  }
  const userEmail = auth.user?.email ?? null;
  if (!userEmail) return safeError('Email unavailable', 400);
  const signerName = typeof body.signer_name === 'string' ? body.signer_name.trim() : '';
  if (!signerName) return safeError('Signer name is required', 400);
  const signatureMethod =
    body.signature_method === 'checkbox' || body.signature_method === 'drawn'
      ? body.signature_method
      : 'typed';
  const signatureTyped =
    signatureMethod === 'typed'
      ? typeof body.signature_typed === 'string' && body.signature_typed.trim()
        ? body.signature_typed.trim()
        : signerName
      : undefined;

  const current = await getCurrentInstructorCurriculumAgreement(db);
  if (body.agreement_version !== current.version) return safeError('Reload and review the current agreement before signing.', 409);
  const expectedHash = INSTRUCTOR_CURRICULUM_IP_VERSION_HASHES[current.version];
  if (!expectedHash) {
    return safeError('Agreement version is not published in this release', 503);
  }
  if (current.hash && current.hash !== expectedHash) {
    return safeError('Agreement text changed under its version; re-publication required', 503);
  }

  const { ipAddress, userAgent } = extractRequestMetadata(req.headers);
  const recorded = await recordAgreementAcceptance({
    supabase: db,
    userId: auth.id,
    userEmail,
    userRole: 'instructor',
    agreementType: INSTRUCTOR_CURRICULUM_IP_AGREEMENT_TYPE,
    documentVersion: current.version,
    signerName,
    signerEmail: userEmail,
    signatureMethod,
    signatureTyped,
    ipAddress,
    userAgent,
    context: 'instructor_curriculum_ip_onboarding',
  });
  if (!recorded.success) {
    return safeError(recorded.error || 'Failed to record agreement', 400);
  }

  // Scope snapshot: live instructor_assignments rows remain the authority.
  const { data: assignments } = await db
    .from('instructor_assignments')
    .select('course_id,program_id')
    .eq('instructor_id', auth.id)
    .eq('active', true);
  const scopeCourseIds = [
    ...new Set((assignments ?? []).map((row: any) => row.course_id).filter(Boolean)),
  ].map(String);
  const scopeProgramIds = [
    ...new Set((assignments ?? []).map((row: any) => row.program_id).filter(Boolean)),
  ].map(String);

  let license;
  try {
    license = await issueInstructorCurriculumLicense(db, {
      userId: auth.id,
      agreementVersion: current.version,
      agreementHash: expectedHash,
      scopeCourseIds,
      programIds: scopeProgramIds,
      signatureReceipt: {
        renewalLicenseId: typeof body.renewal_license_id === 'string' ? body.renewal_license_id : undefined,
        acceptanceId: recorded.id!,
        signedAt: new Date().toISOString(),
        signerName,
        signerEmail: userEmail,
        method: signatureMethod,
        signature: signatureTyped || signerName,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to issue instructor license');
  }
  await logInstructorLicenseEvent(db, {
    userId: auth.id,
    action: 'instructor_curriculum_ip.signed',
    details: {
      agreement_version: current.version,
      agreement_hash: expectedHash,
      license_reference: license.licenseReference,
      already_active: license.alreadyActive,
    },
    ipAddress,
  });

  return NextResponse.json({
    ok: true,
    agreement_type: INSTRUCTOR_CURRICULUM_IP_AGREEMENT_TYPE,
    version: current.version,
    license_reference: license.licenseReference,
  });
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return safeError('Database unavailable', 503);

  // Verify caller is an instructor (or admin)
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', auth.id)
    .maybeSingle();

  if (!profile || !['instructor', 'admin', 'super_admin', 'staff'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await req.json();
    if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>;
  } catch {
    body = {};
  }

  // Proprietary-curriculum IP agreement: versioned, hashed, canonical
  // recording plus license issuance. The general instructor services
  // agreement below does NOT satisfy this agreement.
  if (body.agreement_type === INSTRUCTOR_CURRICULUM_IP_AGREEMENT_TYPE) {
    return signCurriculumIpAgreement(req, auth, db, body);
  }

  // Idempotent — upsert so double-clicks don't error
  const { error } = await db.from('license_agreement_acceptances').upsert(
    {
      user_id: auth.id,
      agreement_type: 'instructor_services',
      accepted_at: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
    },
    { onConflict: 'user_id,agreement_type', ignoreDuplicates: false },
  );

  if (error) return safeInternalError(error, 'Failed to record agreement');

  return NextResponse.json({ ok: true });
}
