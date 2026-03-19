export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { getUserById } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { sendEmail as realSendEmail } from '@/lib/email';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function sendEmail(to: string, subject: string, text: string) {
  await realSendEmail({ to, subject, html: text.replace(/\n/g, '<br>') });
}

async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createRouteHandlerClient({ cookies });

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || !['admin', 'partner', 'instructor'].includes(profile.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  // Get request body
  const { application_id } = await req.json();

  // Get application details
  const { data: app, error } = await supabase
    .from('funding_applications')
    .select('id, user_id, course_id, program_id, status')
    .eq('id', application_id)
    .single();

  if (error || !app) {
    return new Response('Application not found', { status: 404 });
  }

  // Get related data
  try {
    const [learnerUser, courseResult, programResult] = await Promise.all([
      getUserById(app.user_id),
      supabase
        .from('training_courses')
        .select('title')
        .eq('id', app.course_id)
        .maybeSingle(),
      supabase
        .from('funding_programs')
        .select('code, name')
        .eq('id', app.program_id)
        .maybeSingle(),
    ]);

    const learnerEmail = learnerUser?.email;
    const courseTitle = courseResult.data?.title || 'your course';
    const programName = programResult.data?.name || programResult.data?.code;

    if (!learnerEmail) {
      return new Response('Learner email not found', { status: 404 });
    }

    // Get base URL
    const origin = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;

    // Send welcome email
    await sendEmail(
      learnerEmail,
      'Welcome to Elevate – Your Training Access',
      `Great news! Your training in ${courseTitle} is funded through ${programName}.

Start your learning journey here: ${origin}/learner/dashboard

Your tuition is fully covered. If you need any help getting started, simply reply to this email.

Welcome to Elevate for Humanity!`
    );

    // Log the action
    await supabase.from('audit_logs').insert({
      who: user.id,
      action: 'RESEND_WELCOME',
      subject: application_id,
      meta: { email: learnerEmail },
    });

    return Response.json({ ok: true });
  } catch (error) { 
    logger.error('Error resending welcome email:', error);
    return new Response('Failed to resend email', { status: 500 });
  }
}
export const POST = withApiAudit('/api/funding/admin/resend', _POST);
