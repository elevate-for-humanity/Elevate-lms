import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/milady/issue-link
 *
 * Admin pastes the Milady link received from Milady, system emails it to the student
 * and marks the provisioning queue row as completed.
 *
 * Body: { queueId: string, miladyLink: string }
 */
export async function POST(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { queueId, miladyLink } = await request.json();

    if (!queueId || !miladyLink) {
      return safeError('queueId and miladyLink are required', 400);
    }

    // Basic URL validation
    try { new URL(miladyLink); } catch {
      return safeError('miladyLink must be a valid URL', 400);
    }

    const db = createAdminClient();

    // Fetch the queue row
    const { data: queueRow, error: qErr } = await db
      .from('milady_provisioning_queue')
      .select('*')
      .eq('id', queueId)
      .single();

    if (qErr || !queueRow) {
      return safeError('Queue entry not found', 404);
    }

    if (queueRow.status === 'completed') {
      return safeError('This entry has already been issued', 409);
    }

    const studentEmail = queueRow.student_email as string;
    const studentName  = (queueRow.student_name as string) || studentEmail;
    const firstName    = studentName.split(' ')[0] || 'there';
    const programSlug  = queueRow.program_slug as string;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

    // Send the Milady link to the student
    const { sendEmail } = await import('@/lib/email/sendgrid');
    await sendEmail({
      to: studentEmail,
      subject: 'Your Milady access is ready — next step',
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Barber Apprenticeship Program</p>
  </div>
  <div style="padding:32px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Your Milady account is ready, ${firstName}.</h1>
    <p style="color:#475569;margin:0 0 24px;font-size:15px;">
      Click the button below to access your Milady theory training. This link was sent to us by Milady specifically for your enrollment.
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 16px;color:#166534;font-weight:700;font-size:15px;">Access Your Milady Training</p>
      <a href="${miladyLink}"
         style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
        Open Milady →
      </a>
      <p style="margin:12px 0 0;color:#64748b;font-size:12px;word-break:break-all;">
        ${miladyLink}
      </p>
    </div>

    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="margin:0 0 6px;font-weight:700;color:#92400e;font-size:14px;">What to do:</p>
      <ol style="margin:0;padding-left:20px;color:#374151;font-size:14px;">
        <li style="margin-bottom:6px;">Click the link above to set up your Milady account</li>
        <li style="margin-bottom:6px;">Complete your theory coursework at your own pace</li>
        <li style="margin-bottom:0;">Log your on-the-job hours with your host shop supervisor</li>
      </ol>
    </div>

    <p style="color:#475569;font-size:14px;">
      Questions? Call <a href="tel:3173143757" style="color:#ea580c;font-weight:700;">317-314-3757</a> or email
      <a href="mailto:info@elevateforhumanity.org" style="color:#ea580c;">info@elevateforhumanity.org</a>
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
      Elevate for Humanity · 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240
    </p>
  </div>
</div>`,
    });

    // Mark queue row completed and store the link
    await db
      .from('milady_provisioning_queue')
      .update({
        status:       'completed',
        processed_at: new Date().toISOString(),
        notes:        `${queueRow.notes || ''}\nLink issued: ${miladyLink}`.trim(),
      })
      .eq('id', queueId);

    // Update application milady_status → issued
    if (queueRow.notes?.includes('application_id:')) {
      const appId = (queueRow.notes as string).match(/application_id:([a-f0-9-]+)/)?.[1];
      if (appId) {
        await db
          .from('applications')
          .update({ milady_status: 'issued', updated_at: new Date().toISOString() })
          .eq('id', appId);
      }
    }

    // Update milady_access record
    await db.from('milady_access').upsert({
      student_email: studentEmail,
      program_slug:  programSlug,
      status:        'active',
      provisioning_method: 'link',
      access_url:    miladyLink,
      provisioned_at: new Date().toISOString(),
    }, { onConflict: 'student_email,program_slug' });

    logger.info('[milady/issue-link] Link issued', { queueId, studentEmail, programSlug });

    return NextResponse.json({ ok: true, studentEmail });
  } catch (err) {
    return safeInternalError(err, 'Failed to issue Milady link');
  }
}
