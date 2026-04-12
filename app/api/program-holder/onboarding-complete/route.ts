import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/program-holder/onboarding-complete
 *
 * Called after each onboarding step. Checks whether all 4 steps are done:
 *   1. MOU signed (program_holders.mou_signed = true)
 *   2. Handbook acknowledged (program_holder_acknowledgements row with document_type='handbook')
 *   3. Rights acknowledged (program_holder_acknowledgements row with document_type='rights')
 *   4. At least one document uploaded (program_holder_documents row)
 *
 * If all steps are complete and the welcome email hasn't been sent yet,
 * fires the full welcome email and marks program_holders.welcome_email_sent = true.
 */
export async function POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await getAdminClient();
    if (!admin) return NextResponse.json({ error: 'Server error' }, { status: 500 });

    // 1. Check MOU + welcome_email_sent flag
    const { data: holder } = await admin
      .from('program_holders')
      .select('id, mou_signed, welcome_email_sent, organization_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!holder) return NextResponse.json({ complete: false, reason: 'no_holder_row' });
    if (holder.welcome_email_sent) return NextResponse.json({ complete: true, already_sent: true });
    if (!holder.mou_signed) return NextResponse.json({ complete: false, reason: 'mou_not_signed' });

    // 2. Check handbook acknowledgement
    const { data: handbookAck } = await admin
      .from('program_holder_acknowledgements')
      .select('id')
      .eq('user_id', user.id)
      .eq('document_type', 'handbook')
      .maybeSingle();

    if (!handbookAck) return NextResponse.json({ complete: false, reason: 'handbook_not_acknowledged' });

    // 3. Check rights acknowledgement
    const { data: rightsAck } = await admin
      .from('program_holder_acknowledgements')
      .select('id')
      .eq('user_id', user.id)
      .eq('document_type', 'rights')
      .maybeSingle();

    if (!rightsAck) return NextResponse.json({ complete: false, reason: 'rights_not_acknowledged' });

    // 4. Check at least one document uploaded
    const { count: docCount } = await admin
      .from('program_holder_documents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!docCount || docCount === 0) return NextResponse.json({ complete: false, reason: 'no_documents' });

    // All steps done — get profile for email
    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.email) return NextResponse.json({ complete: false, reason: 'no_profile_email' });

    const firstName = profile.full_name?.split(' ')[0] || 'Program Holder';
    const organizationName = holder.organization_name || 'your organization';

    // Send full welcome email
    await sendProgramHolderFullWelcomeEmail({
      email: profile.email,
      firstName,
      organizationName,
    });

    // Mark welcome email sent — column may not exist yet; ignore error gracefully
    await admin
      .from('program_holders')
      .update({ welcome_email_sent: true })
      .eq('user_id', user.id);

    logger.info('[onboarding-complete] Welcome email sent', { userId: user.id });
    return NextResponse.json({ complete: true, email_sent: true });

  } catch (err: any) {
    logger.error('[onboarding-complete] Error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendProgramHolderFullWelcomeEmail(opts: {
  email: string;
  firstName: string;
  organizationName: string;
}) {
  const sgKey = process.env.SENDGRID_API_KEY;
  if (!sgKey) {
    logger.warn('[onboarding-complete] SENDGRID_API_KEY not set — skipping welcome email');
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const logoUrl = `${siteUrl}/logo.jpg`;
  const dashboardUrl = `${siteUrl}/program-holder/dashboard`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
        <tr><td style="padding:28px 32px;text-align:center;border-bottom:1px solid #e2e8f0">
          <img src="${logoUrl}" alt="Elevate for Humanity" width="140" style="max-width:140px;height:auto" />
        </td></tr>
        <tr><td style="padding:32px">
          <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px">Welcome to Elevate for Humanity, ${opts.firstName}!</h2>
          <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px">
            Congratulations — your onboarding is complete. <strong>${opts.organizationName}</strong> is now
            an active Program Holder with Elevate for Humanity. Your portal is ready.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 28px">
              <a href="${dashboardUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:14px 36px;border-radius:6px;font-weight:bold;font-size:16px">
                Go to My Dashboard →
              </a>
            </td></tr>
          </table>
          <div style="background:#f1f5f9;border-radius:6px;padding:16px 20px;margin:0 0 24px">
            <p style="color:#475569;font-size:13px;font-weight:bold;margin:0 0 10px">What you can do now:</p>
            <ul style="color:#475569;font-size:13px;line-height:1.9;margin:0;padding-left:18px">
              <li>Enroll students in approved training programs</li>
              <li>Track student progress and completion rates</li>
              <li>Access compliance reports and documentation</li>
              <li>Manage your program roster and payroll records</li>
              <li>Contact your Elevate coordinator for support</li>
            </ul>
          </div>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:16px 20px;margin:0 0 24px">
            <p style="color:#1e40af;font-size:13px;font-weight:bold;margin:0 0 6px">Your next step</p>
            <p style="color:#1e40af;font-size:13px;margin:0">
              Log in to your dashboard and enroll your first student. If you need help getting started,
              call us at <a href="tel:3173143757" style="color:#1d4ed8">(317) 314-3757</a> or email
              <a href="mailto:elevate4humanityedu@gmail.com" style="color:#1d4ed8">elevate4humanityedu@gmail.com</a>.
            </p>
          </div>
          <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0">
            Thank you for partnering with us to advance workforce development in your community.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="color:#94a3b8;font-size:12px;margin:0">Elevate for Humanity Career &amp; Technical Institute</p>
          <p style="color:#94a3b8;font-size:12px;margin:4px 0">8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
          <p style="color:#94a3b8;font-size:12px;margin:4px 0">(317) 314-3757</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
        reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elevate for Humanity' },
        personalizations: [{ to: [{ email: opts.email, name: opts.firstName }] }],
        subject: `Welcome — Your Program Holder Portal is Ready`,
        content: [{ type: 'text/html', value: html }],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      logger.error('[onboarding-complete] Welcome email failed', new Error(body));
    } else {
      logger.info('[onboarding-complete] Welcome email sent', { email: opts.email });
    }
  } catch (err) {
    logger.error('[onboarding-complete] Welcome email threw', err as Error);
  }
}
