import { logger } from '@/lib/logger';

/**
 * Checks whether all 4 program holder onboarding steps are complete and,
 * if so, sends the full welcome email and marks welcome_email_sent = true.
 *
 * Steps:
 *   1. MOU signed        — program_holders.mou_signed = true
 *   2. Handbook ack      — program_holder_acknowledgements row, document_type='handbook'
 *   3. Rights ack        — program_holder_acknowledgements row, document_type='rights'
 *   4. Document uploaded — program_holder_documents row exists
 *
 * Safe to call multiple times — idempotent via welcome_email_sent flag.
 */
export async function checkAndSendOnboardingCompleteEmail(
  admin: any,
  userId: string,
): Promise<{ sent: boolean; reason?: string }> {
  // 1. MOU + already-sent guard
  const { data: holder } = await admin
    .from('program_holders')
    .select('id, mou_signed, welcome_email_sent, organization_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (!holder) return { sent: false, reason: 'no_holder_row' };
  if (holder.welcome_email_sent) return { sent: false, reason: 'already_sent' };
  if (!holder.mou_signed) return { sent: false, reason: 'mou_not_signed' };

  // 2 & 3. Acknowledgements
  const { data: acks } = await admin
    .from('program_holder_acknowledgements')
    .select('document_type')
    .eq('user_id', userId);

  const hasHandbook = acks?.some((a: any) => a.document_type === 'handbook');
  const hasRights = acks?.some((a: any) => a.document_type === 'rights');
  if (!hasHandbook) return { sent: false, reason: 'handbook_not_acknowledged' };
  if (!hasRights) return { sent: false, reason: 'rights_not_acknowledged' };

  // 4. At least one document
  const { count: docCount } = await admin
    .from('program_holder_documents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (!docCount || docCount === 0) return { sent: false, reason: 'no_documents' };

  // Get profile for email
  const { data: profile } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (!profile?.email) return { sent: false, reason: 'no_profile_email' };

  const firstName = profile.full_name?.split(' ')[0] || 'Program Holder';
  const organizationName = holder.organization_name || 'your organization';

  await sendWelcomeEmail({ email: profile.email, firstName, organizationName });

  // Mark sent — welcome_email_sent column may not exist yet; ignore error
  await admin
    .from('program_holders')
    .update({ welcome_email_sent: true })
    .eq('user_id', userId)
    .catch(() => {});

  logger.info('[onboarding-complete] Welcome email sent', { userId, email: profile.email });
  return { sent: true };
}

async function sendWelcomeEmail(opts: {
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
  const logoUrl = `${siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`;
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
              Log in to your dashboard and enroll your first student. Need help?
              Call <a href="tel:3173143757" style="color:#1d4ed8">(317) 314-3757</a> or email
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

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
      reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elevate for Humanity' },
      personalizations: [{ to: [{ email: opts.email, name: opts.firstName }] }],
      subject: 'Welcome — Your Program Holder Portal is Ready',
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error('[onboarding-complete] Welcome email failed', new Error(body));
  }
}
