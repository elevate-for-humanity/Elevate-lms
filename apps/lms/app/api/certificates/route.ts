import { NextResponse } from 'next/server';

import { parseBody } from '@/lib/api-helpers';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { safeDbError, safeError, safeInternalError } from '@/lib/api/safe-error';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return safeError('Unauthorized', 401);
    }

    const supabase = await createServerSupabaseClient();

    const { data: certificates, error } = await supabase
      .from('certificates')
      .select(
        `
        *,
        profiles!certificates_student_id_fkey (
          full_name,
          email
        ),
        courses (
          title
        )
      `,
      )
      .eq('student_id', user.id)
      .order('issued_at', { ascending: false });

    if (error) {
      return safeDbError(error, 'Failed to fetch certificates');
    }

    return NextResponse.json({ certificates: certificates || [] });
  } catch (error) {
    return safeInternalError(error, 'Failed to fetch certificates');
  }
}

async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return safeError('Unauthorized', 401);
    }

    const body = await parseBody<Record<string, any>>(request);

    if (!body.courseId) {
      return safeError('Missing required fields', 400);
    }

    const supabase = await createServerSupabaseClient();

    const { data: existing, error: existingError } = await supabase
      .from('certificates')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', body.courseId)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return safeDbError(existingError, 'Failed to check existing certificate');
    }

    if (existing) {
      return safeError('Certificate already exists for this course', 409);
    }

    const { data: certificate, error } = await supabase
      .from('certificates')
      .insert({
        student_id: user.id,
        course_id: body.courseId,
        certificate_number: `CERT-${Date.now()}`,
        issued_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) {
      return safeDbError(error, 'Failed to generate certificate');
    }

    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    return safeInternalError(error, 'Failed to generate certificate');
  }
}
export const GET = withApiAudit('/api/certificates', _GET);
export const POST = withApiAudit('/api/certificates', _POST);
