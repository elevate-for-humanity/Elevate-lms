import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'staff', 'org_admin']);

async function requireAdminActor() {
  const auth = await createClient();
  const db = await requireAdminClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const;

  const { data: profile } = await db
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !ADMIN_ROLES.has(String(profile.role || ''))) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const;
  }
  return { db, user } as const;
}

async function auditEmail(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  params: { recipient: string; subject: string; applicationId: string; success: boolean; error?: string },
) {
  await db.from('email_logs').insert({
    action: 'program_holder_denial_notification',
    recipient_email: params.recipient,
    recipient: params.recipient,
    to: params.recipient,
    subject: params.subject,
    provider: 'sendgrid',
    status: params.success ? 'sent' : 'failed',
    error_message: params.error || null,
    error: params.error || null,
    sent_at: params.success ? new Date().toISOString() : null,
    details: { application_id: params.applicationId, application_type: 'program_holder', event: 'rejected' },
    metadata: { application_id: params.applicationId, application_type: 'program_holder', event: 'rejected' },
  }).then(({ error }) => {
    if (error) logger.warn('[program-holder/deny] email audit failed', { error: error.message });
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminActor();
    if ('error' in actor) return actor.error;
    const { db, user: adminUser } = actor;
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = String(body?.reason || '').trim().slice(0, 2000);

    const { data: application, error: applicationError } = await db
      .from('program_holder_applications')
      .select('id, organization_name, contact_name, email, status, data')
      .eq('id', id)
      .maybeSingle();
    if (applicationError) throw applicationError;
    if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    if (application.status === 'approved') {
      return NextResponse.json({ error: 'Approved applications must be revoked through the Program Holder record, not denied.' }, { status: 409 });
    }

    const existingData = application.data && typeof application.data === 'object' && !Array.isArray(application.data)
      ? application.data
      : {};
    const now = new Date().toISOString();
    const { error: updateError } = await db
      .from('program_holder_applications')
      .update({
        status: 'rejected',
        data: {
          ...existingData,
          rejected_at: now,
          rejected_by: adminUser.id,
          rejection_reason: reason || null,
        },
        updated_at: now,
      })
      .eq('id', id);
    if (updateError) throw updateError;

    const email = String(application.email || '').trim().toLowerCase();
    let emailStatus: 'sent' | 'failed' | 'skipped' = 'skipped';
    if (email) {
      const subject = 'Program Holder Application Update | Elevate for Humanity';
      const result = await sendEmail({
        to: email,
        subject,
        html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#0f172a"><h2>Program Holder application update</h2><p>Hello ${application.contact_name || 'Program Holder applicant'},</p><p>We completed the review of the Program Holder application for <strong>${application.organization_name}</strong>. We are unable to approve it at this time.</p>${reason ? `<p><strong>Review note:</strong> ${reason}</p>` : ''}<p>If you believe information is missing or has changed, reply to this email before submitting another application.</p><p>Questions? Call ${PLATFORM_DEFAULTS.supportPhone}.</p></div>`,
      });
      emailStatus = result.success ? 'sent' : 'failed';
      await auditEmail(db, {
        recipient: email,
        subject,
        applicationId: id,
        success: result.success === true,
        error: result.success ? undefined : result.error,
      });
      if (!result.success) {
        await db.from('staff_notifications').insert({
          type: 'program_holder_denial_email_failed',
          title: `Program Holder rejection email failed: ${application.organization_name}`,
          message: `Application ${id} was rejected, but the applicant email to ${email} failed: ${result.error || 'unknown error'}`,
          severity: 'error',
          metadata: { application_id: id, email, error: result.error || null },
        });
      }
    }

    return NextResponse.json({ success: true, applicationId: id, status: 'rejected', emailStatus });
  } catch (error) {
    logger.error('[admin/program-holder/deny] failed', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to deny Program Holder application.' },
      { status: 500 },
    );
  }
}
