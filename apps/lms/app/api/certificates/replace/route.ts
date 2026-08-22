import { NextRequest, NextResponse } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { issueCertificate } from '@/lib/certificates/issue-certificate';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!['admin', 'partner', 'instructor'].includes(profile?.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  const adminDb = await requireAdminClient();
  if (!adminDb) {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  const { old_serial, reason } = await req.json();
  if (!old_serial) return new Response('Missing serial', { status: 400 });

  const { data: old, error: oldError } = await adminDb
    .from('certificates')
    .select(
      'id, tenant_id, user_id, student_id, course_id, program_id, enrollment_id, student_name, student_email, course_title, program_name, issued_at, completion_date, expires_at, metadata, credential_stack, issuance_snapshot, template_id, signed_by',
    )
    .eq('serial', old_serial)
    .is('revoked_at', null)
    .maybeSingle();

  if (oldError) {
    return NextResponse.json({ error: 'Unable to load certificate.' }, { status: 500 });
  }
  if (!old) return new Response('Not found', { status: 404 });

  const studentId = old.student_id || old.user_id;
  if (!studentId || !old.enrollment_id || (!old.course_id && !old.program_id)) {
    return NextResponse.json(
      { error: 'Certificate is missing canonical learner, enrollment, or scope metadata.' },
      { status: 409 },
    );
  }

  const revokedAt = new Date().toISOString();
  const replacementReason = reason || 'Replaced with new certificate';
  const { error: revokeError } = await adminDb
    .from('certificates')
    .update({
      status: 'revoked',
      revoked_at: revokedAt,
      revoked_reason: replacementReason,
    })
    .eq('id', old.id)
    .is('revoked_at', null);

  if (revokeError) {
    return NextResponse.json({ error: 'Unable to revoke existing certificate.' }, { status: 500 });
  }

  const result = await issueCertificate({
    supabase: adminDb,
    enrollmentId: old.enrollment_id,
    studentId,
    courseId: old.course_id || undefined,
    programId: old.program_id || undefined,
    studentName: old.student_name || 'Learner',
    studentEmail: old.student_email || undefined,
    courseTitle: old.course_title || undefined,
    programName: old.program_name || undefined,
    issueDate: old.completion_date || old.issued_at || undefined,
    expiresAt: old.expires_at || undefined,
    templateId: old.template_id || undefined,
    signedBy: old.signed_by || undefined,
    issuedBy: user.id,
    tenantId: old.tenant_id || undefined,
    credentialStack: old.credential_stack || null,
    issuanceSnapshot: old.issuance_snapshot || null,
    metadata: {
      ...(old.metadata || {}),
      replacement_of_certificate_id: old.id,
      replacement_of_serial: old_serial,
      replacement_reason: replacementReason,
      replaced_at: revokedAt,
      replaced_by: user.id,
    },
  });

  if (!result.success || !result.certificate) {
    // Restore the original certificate if canonical reissuance could not be completed.
    await adminDb
      .from('certificates')
      .update({ status: 'active', revoked_at: null, revoked_reason: null })
      .eq('id', old.id);
    return NextResponse.json(
      { error: result.error || 'Unable to issue replacement certificate.' },
      { status: 500 },
    );
  }

  await adminDb.from('enrollment_events').insert({
    user_id: studentId,
    course_id: old.course_id || null,
    kind: 'CERTIFIED',
    metadata: {
      certificate_id: result.certificate.id,
      replacement_of_certificate_id: old.id,
      replacement_of_serial: old_serial,
      reason: replacementReason,
    },
  });

  return Response.json({
    ok: true,
    new_serial: result.certificate.certificate_number,
    certificate_id: result.certificate.id,
  });
}

export const POST = withApiAudit('/api/cert/replace', _POST);
