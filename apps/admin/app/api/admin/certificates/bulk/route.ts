import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { issueCertificate } from '@/lib/certificates/issue-certificate';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const db = await requireAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const enrollmentIds = Array.isArray(body?.enrollmentIds) ? body.enrollmentIds : [];
  const templateId = typeof body?.templateId === 'string' ? body.templateId : null;
  const issueDate = typeof body?.issueDate === 'string' ? body.issueDate : null;
  const signedBy = typeof body?.signedBy === 'string' ? body.signedBy : null;

  if (!enrollmentIds.length || !templateId) {
    return NextResponse.json({ error: 'Missing enrollmentIds or templateId' }, { status: 400 });
  }
  if (enrollmentIds.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 enrollments per request' }, { status: 400 });
  }

  let issued = 0;
  let failed = 0;
  const failures: Array<{ enrollmentId: string; reason: string }> = [];

  for (const enrollmentId of enrollmentIds) {
    if (typeof enrollmentId !== 'string') {
      failed++;
      continue;
    }

    try {
      const { data: enrollment, error: enrollmentError } = await db
        .from('program_enrollments')
        .select(
          'id,user_id,student_id,course_id,program_id,status,completed_at,certificate_issued_at',
        )
        .eq('id', enrollmentId)
        .maybeSingle();

      if (enrollmentError) throw enrollmentError;
      if (!enrollment) throw new Error('Enrollment not found');
      if (enrollment.status?.toLowerCase() !== 'completed' || !enrollment.completed_at) {
        throw new Error('Enrollment is not complete');
      }

      const studentId = enrollment.user_id || enrollment.student_id;
      if (!studentId) throw new Error('Enrollment has no learner identity');

      const [{ data: learner, error: learnerError }, courseResult, programResult] =
        await Promise.all([
          db.from('profiles').select('full_name,email').eq('id', studentId).maybeSingle(),
          enrollment.course_id
            ? db
                .from('courses')
                .select('id,title,course_name')
                .eq('id', enrollment.course_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          enrollment.program_id
            ? db
                .from('programs')
                .select('id,title,name,required_hours,total_hours,training_hours')
                .eq('id', enrollment.program_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

      if (learnerError) throw learnerError;
      if (courseResult.error) throw courseResult.error;
      if (programResult.error) throw programResult.error;
      if (!learner) throw new Error('Learner profile not found');

      const program = programResult.data as any;
      const course = courseResult.data as any;
      const result = await issueCertificate({
        supabase: db,
        enrollmentId: enrollment.id,
        studentId,
        studentName: learner.full_name || learner.email || 'Learner',
        studentEmail: learner.email || undefined,
        programId: enrollment.program_id || undefined,
        programName: program?.title || program?.name || undefined,
        programHours:
          program?.required_hours ?? program?.total_hours ?? program?.training_hours ?? null,
        courseId: enrollment.program_id ? undefined : enrollment.course_id || undefined,
        courseTitle: enrollment.program_id
          ? undefined
          : course?.title || course?.course_name || undefined,
        templateId,
        signedBy: signedBy || `${PLATFORM_DEFAULTS.orgName} Career & Technical Institute`,
        issuedBy: user.id,
        issueDate,
        competencyEvidence: {
          completionVerifiedAt: enrollment.completed_at,
          completionMethod: 'admin_bulk_verified_completion',
        },
      });

      if (!result.success) throw new Error(result.error || 'Certificate issuance failed');
      issued++;
    } catch (error) {
      failed++;
      const reason = error instanceof Error ? error.message : 'Unknown error';
      failures.push({ enrollmentId, reason });
      logger.error('Bulk certificate issuance failed', error as Error, { enrollmentId });
    }
  }

  await db.from('audit_logs').insert({
    user_id: user.id,
    action: 'bulk_certificates_issued',
    resource_type: 'certificate',
    details: { count: issued, failed, templateId, failures: failures.slice(0, 25) },
  });

  return NextResponse.json({ issued, failed, failures });
}

export const POST = withApiAudit('/api/admin/certificates/bulk', _POST, { critical: true });
