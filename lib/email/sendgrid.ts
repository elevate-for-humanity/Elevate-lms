import { logger } from '@/lib/logger';

const FROM_EMAIL =
  process.env.EMAIL_FROM ||
  process.env.MAIL_FROM ||
  'Elevate for Humanity <info@elevateforhumanity.org>';
const REPLY_TO_EMAIL =
  process.env.REPLY_TO_EMAIL || 'info@elevateforhumanity.org';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  bcc?: string | string[];
}

/**
 * Send email via SendGrid HTTP API (no SDK — direct fetch).
 * All email in the app routes through this single function.
 */
export async function sendEmail(options: EmailOptions) {
  const sendgridKey = process.env.SENDGRID_API_KEY;

  if (!sendgridKey) {
    logger.warn('[Email] SENDGRID_API_KEY not configured — email not sent');
    return { success: false, error: 'Email service not configured. Set SENDGRID_API_KEY.' };
  }

  const from = options.from || FROM_EMAIL;
  const replyTo = options.replyTo ?? REPLY_TO_EMAIL;
  const toArr = Array.isArray(options.to) ? options.to : [options.to];
  const bccArr = options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined;

  return sendViaSendGrid(sendgridKey, { ...options, from, replyTo, to: toArr, bcc: bccArr });
}

async function sendViaSendGrid(
  apiKey: string,
  opts: { to: string[]; from: string; subject: string; html: string; text?: string; replyTo: string; bcc?: string[] },
) {
  try {
    const personalization: Record<string, unknown> = {
      to: opts.to.map((email) => ({ email })),
    };
    if (opts.bcc?.length) {
      personalization.bcc = opts.bcc.map((email) => ({ email }));
    }

    const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [personalization],
        from: parseSendGridFrom(opts.from),
        reply_to: parseSendGridFrom(opts.replyTo),
        subject: opts.subject,
        content: [
          ...(opts.text ? [{ type: 'text/plain', value: opts.text }] : []),
          { type: 'text/html', value: opts.html },
        ],
      }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      logger.error(`[Email] SendGrid ${resp.status}:`, data);
      return { success: false, error: `SendGrid error ${resp.status}: ${JSON.stringify(data)}`, from: opts.from };
    }

    return { success: true, data: { provider: 'sendgrid' } };
  } catch (error) {
    logger.error('[Email] SendGrid send error:', error);
    return { success: false, error: 'Operation failed' };
  }
}

/** Parse "Name <email>" format into SendGrid {email, name} object */
function parseSendGridFrom(from: string): { email: string; name?: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { email: from };
}

/**
 * Fire-and-forget email send. Never throws.
 */
export async function trySendEmail(
  options: EmailOptions
): Promise<{ ok: boolean; error?: string }> {
  const result = await sendEmail(options);
  return { ok: result.success, error: result.error };
}

export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  programName: string;
  dashboardUrl: string;
  includesMilady?: boolean;
}) {
  const miladySection = params.includesMilady !== false ? `
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; color: #374151; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: white;">Start Your Theory Training (Milady RISE)</h3>
              <p style="margin-bottom: 15px;">Your theory training through Milady RISE is included in your program. This is required coursework.</p>
              <p style="margin-bottom: 10px;"><strong>To get started:</strong></p>
              <ol style="margin: 0 0 15px 0; padding-left: 20px;">
                <li>Click the button below to go to Milady</li>
                <li>Create your Milady account (use this email: ${params.email})</li>
                <li>Begin your theory coursework</li>
              </ol>
              <p style="text-align: center; margin-bottom: 0;">
                <a href="https://www.miladytraining.com/users/sign_in" style="display: inline-block; padding: 12px 30px; background: white; color: #7c3aed; text-decoration: none; border-radius: 6px; font-weight: bold;">Sign Up for Milady RISE &rarr;</a>
              </p>
            </div>` : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <div style="max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#f97316;color:white;padding:30px;text-align:center"><h1>Welcome to Elevate for Humanity!</h1></div>
        <div style="padding:30px;background:#f9fafb">
          <h2>Hi ${params.name},</h2>
          <p>Congratulations! You've successfully enrolled in <strong>${params.programName}</strong>.</p>
          ${miladySection}
          <p><strong>To get started:</strong></p>
          <ol><li>Click the button below to log in to your student portal</li><li>Complete the required orientation (about 10 minutes)</li><li>Once orientation is done, your courses will be unlocked</li></ol>
          <p style="text-align:center"><a href="${params.dashboardUrl}" style="display:inline-block;padding:12px 30px;background:#f97316;color:white;text-decoration:none;border-radius:6px;margin:20px 0">Log In to Student Portal</a></p>
          <p>If you have any questions, reply to this email or call (317) 314-3757.</p>
          <p>Best regards,<br>The Elevate for Humanity Team</p>
        </div>
        <div style="padding:20px;text-align:center;color:#666;font-size:14px">
          <p>Elevate for Humanity Career &amp; Technical Institute<br>8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
        </div>
      </div>
    </body></html>`;

  return sendEmail({ to: params.email, subject: `Welcome to ${params.programName}!`, html });
}

export async function sendCreatorApprovalEmail(params: { email: string; name: string }) {
  return sendEmail({
    to: params.email,
    subject: 'Your Creator Application Has Been Approved!',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#10b981">Creator Application Approved!</h2><p>Hi ${params.name},</p><p>Your creator application has been approved. You can now start creating and selling courses.</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/creator/dashboard" style="display:inline-block;padding:12px 30px;background:#10b981;color:white;text-decoration:none;border-radius:6px">Go to Creator Dashboard</a></p></div>`,
  });
}

export async function sendCreatorRejectionEmail(params: { email: string; name: string; reason: string }) {
  return sendEmail({
    to: params.email,
    subject: 'Creator Application Update',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2>Creator Application Update</h2><p>Hi ${params.name},</p><p>We're unable to approve your application at this time.</p><p><strong>Reason:</strong> ${params.reason}</p><p>You're welcome to reapply in the future.</p></div>`,
  });
}

export async function sendPayoutConfirmationEmail(params: { email: string; name: string; amount: number; payoutId: string }) {
  return sendEmail({
    to: params.email,
    subject: `Payout Processed: $${params.amount.toFixed(2)}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#10b981">Payout Processed</h2><p>Hi ${params.name},</p><div style="font-size:32px;font-weight:bold;color:#10b981;text-align:center;margin:20px 0">$${params.amount.toFixed(2)}</div><p><strong>Payout ID:</strong> ${params.payoutId}</p><p>Funds should arrive within 2-5 business days.</p></div>`,
  });
}

export async function sendProductApprovalEmail(params: { email: string; name: string; productName: string }) {
  return sendEmail({
    to: params.email,
    subject: `Product Approved: ${params.productName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#10b981">Product Approved!</h2><p>Hi ${params.name},</p><p>Your product "<strong>${params.productName}</strong>" is now live on the marketplace.</p></div>`,
  });
}

export async function sendProductRejectionEmail(params: { email: string; name: string; productName: string; reason: string }) {
  return sendEmail({
    to: params.email,
    subject: `Product Needs Revision: ${params.productName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2>Product Review Update</h2><p>Hi ${params.name},</p><p>Your product "<strong>${params.productName}</strong>" requires revisions.</p><p><strong>Reason:</strong> ${params.reason}</p></div>`,
  });
}

export async function sendMarketplaceSaleNotification(params: { creatorEmail: string; creatorName: string; productName: string; amount: number; buyerName: string }) {
  return sendEmail({
    to: params.creatorEmail,
    subject: `New Sale: ${params.productName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#10b981">New Sale!</h2><p>Hi ${params.creatorName},</p><p><strong>Product:</strong> ${params.productName}</p><p><strong>Buyer:</strong> ${params.buyerName}</p><p><strong>Amount:</strong> <span style="font-size:24px;font-weight:bold;color:#10b981">$${params.amount.toFixed(2)}</span></p></div>`,
  });
}

export async function sendMarketplaceApplicationEmail(params: { adminEmail: string; applicantName: string; applicantEmail: string }) {
  return sendEmail({
    to: params.adminEmail,
    subject: 'New Creator Application',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2>New Creator Application</h2><p><strong>Name:</strong> ${params.applicantName}</p><p><strong>Email:</strong> ${params.applicantEmail}</p><p>Please review in the admin dashboard.</p></div>`,
  });
}
