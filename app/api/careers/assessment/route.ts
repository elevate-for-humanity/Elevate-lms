export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/sendgrid';
import { hrEmailTemplates } from '@/lib/email/templates/hr-emails';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  let body: { applicationId: string; score: number; answers: Record<string, string>; passed: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { applicationId, score, answers, passed } = body;

  // Save assessment result to job_applications
  if (applicationId) {
    const timestamp = new Date().toISOString();
    await db.from('job_applications').update({
      status: passed ? 'assessment_passed' : 'assessment_failed',
      notes: `Assessment score: ${score}% — ${passed ? 'PASSED' : 'FAILED'} at ${timestamp}`,
      updated_at: timestamp,
    }).eq('id', applicationId);

    // If passed, fetch application details and send next_steps email
    if (passed) {
      const { data: app } = await db
        .from('job_applications')
        .select('*, job_postings(title)')
        .eq('id', applicationId)
        .single();

      if (app) {
        const { data: profile } = await db
          .from('profiles')
          .select('full_name, email')
          .eq('id', app.student_id)
          .maybeSingle();

        if (profile?.email) {
          const firstName = profile.full_name?.split(' ')[0] ?? 'Candidate';
          const tpl = hrEmailTemplates.interview_scheduled({
            firstName,
            email: profile.email,
            position: app.job_postings?.title ?? 'Staff Position',
            applicationId,
            interviewDate: 'To be scheduled',
            interviewTime: 'To be confirmed',
            zoomLink: `${process.env.NEXT_PUBLIC_SITE_URL}/careers/interview/${applicationId}`,
          });
          await sendEmail({ to: profile.email, ...tpl }).catch(e => logger.error('[Assessment] Email failed:', e));
        }
      }
    }
  }

  return NextResponse.json({ success: true, score, passed });
}

export const POST = withApiAudit('/api/careers/assessment', _POST);
