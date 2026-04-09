import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { checkCertificateIssuanceEligibility } from '@/lib/services/credential-pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile?.role || !['admin', 'super_admin', 'staff', 'instructor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { enrollment_id } = await request.json();
    if (!enrollment_id) {
      return NextResponse.json({ error: 'enrollment_id required' }, { status: 400 });
    }

    const { data: enrollment, error: enrollError } = await supabase
      .from('program_enrollments')
      .select('id, user_id, course_id, program_id, status')
      .eq('id', enrollment_id)
      .single();

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.status !== 'completed') {
      return NextResponse.json({ error: 'Enrollment must be completed before issuing certificate' }, { status: 400 });
    }

    // Credential pipeline gate — payment + exam passage
    // Admins cannot bypass this: if the learner hasn't paid or passed the exam,
    // the certificate must not be issued regardless of who is requesting.
    if (enrollment.program_id) {
      const gate = await checkCertificateIssuanceEligibility(enrollment.user_id, enrollment.program_id);
      if (!gate.eligible) {
        return NextResponse.json({ error: gate.reason }, { status: 400 });
      }
    }

    // Check for existing certificate
    const { data: existing } = await supabase
      .from('certificates')
      .select('id')
      .eq('enrollment_id', enrollment_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Certificate already issued', certificate_id: existing.id }, { status: 409 });
    }

    const certNumber = `EFH-${Date.now().toString(36).toUpperCase()}`;

    const { data: cert, error: certError } = await supabase
      .from('certificates')
      .insert({
        user_id: enrollment.user_id,
        student_id: enrollment.user_id,
        course_id: enrollment.course_id,
        enrollment_id: enrollment.id,
        certificate_number: certNumber,
        issued_at: new Date().toISOString(),
        tenant_id: '6ba71334-58f4-4104-9b2a-5114f2a7614c',
      })
      .select('id, certificate_number')
      .single();

    if (certError) {
      logger.error('Certificate issuance failed', certError);
      return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 });
    }

    return NextResponse.json({ success: true, certificate: cert });
  } catch (error) {
    logger.error('Certificate issuance error', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/certificates/issue-program', _POST);
