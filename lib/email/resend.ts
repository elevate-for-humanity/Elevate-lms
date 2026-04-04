import { logger } from '@/lib/logger';

const FROM_EMAIL =
  process.env.EMAIL_FROM ||
  process.env.MAIL_FROM ||
  'Elevate for Humanity <noreply@elevateforhumanity.org>';
const REPLY_TO_EMAIL =
  process.env.REPLY_TO_EMAIL || 'info@elevateforhumanity.org';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email via SendGrid HTTP API.
 * All email in the app routes through this single function.
 */
export async function sendEmail(options: EmailOptions) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    logger.warn('[Email] SENDGRID_API_KEY not configured — email not sent');
    return { success: false, error: 'Email service not configured (SENDGRID_API_KEY missing)' };
  }

  const from = options.from || FROM_EMAIL;
  const replyTo = options.replyTo ?? REPLY_TO_EMAIL;
  const toArr = Array.isArray(options.to) ? options.to : [options.to];

  // Parse "Name <email>" format into SendGrid's { name, email } shape
  const parseAddress = (addr: string) => {
    const m = addr.match(/^(.+?)\s*<(.+?)>$/);
    return m ? { name: m[1].trim(), email: m[2].trim() } : { email: addr.trim() };
  };

  try {
    const body: Record<string, unknown> = {
      personalizations: [{ to: toArr.map(a => parseAddress(a)) }],
      from: parseAddress(from),
      subject: options.subject,
      content: [{ type: 'text/html', value: options.html }],
      reply_to: parseAddress(replyTo),
    };
    if (options.text) {
      (body.content as unknown[]).unshift({ type: 'text/plain', value: options.text });
    }

    const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      logger.error(`[Email] SendGrid ${resp.status}:`, data);
      return { success: false, error: `SendGrid error ${resp.status}: ${JSON.stringify(data)}`, from };
    }

    return { success: true };
  } catch (error) {
    logger.error('[Email] Send error:', error);
    return { success: false, error: 'Operation failed' };
  }
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
  includesMilady?: boolean; // kept for call-site compatibility — ignored
}) {
  const lmsSection = `
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">Start Your Theory Training</h3>
              <p style="margin-bottom: 15px;">Your theory coursework is available in the <strong>Elevate LMS</strong> — all lessons, quizzes, and checkpoints are in your student portal.</p>
              <p style="text-align: center; margin-bottom: 0;">
                <a href="${params.dashboardUrl}" style="display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to My Courses →</a>
              </p>
            </div>`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f97316; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #f97316; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Elevate for Humanity!</h1>
          </div>
          <div class="content">
            <h2>Hi ${params.name},</h2>
            <p>Congratulations! You've successfully enrolled in <strong>${params.programName}</strong>.</p>
            <p>We're excited to have you join our community of learners. Your journey to a better career starts now!</p>
            
            ${lmsSection}
            
            <p><strong>To get started:</strong></p>
            <ol>
              <li>Click the button below to log in to your student portal</li>
              <li>Complete the required orientation (about 10 minutes)</li>
              <li>Once orientation is done, your courses will be unlocked</li>
            </ol>
            <p style="text-align: center;">
              <a href="${params.dashboardUrl}" class="button">Log In to Student Portal</a>
            </p>
            <p>If you have any questions, our support team is here to help. Just reply to this email or call (317) 314-3757.</p>
            <p>Best regards,<br>The Elevate for Humanity Team</p>
          </div>
          <div class="footer">
            <p>Elevate for Humanity Career & Technical Institute<br>
            8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
            <p><a href="https://www.elevateforhumanity.org">www.elevateforhumanity.org</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: params.email,
    subject: `Welcome to ${params.programName}!`,
    html,
  });
}

export async function sendCreatorApprovalEmail(params: {
  email: string;
  name: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Creator Application Approved!</h1>
          </div>
          <div class="content">
            <h2>Hi ${params.name},</h2>
            <p>Great news! Your creator application has been approved.</p>
            <p>You can now start creating and selling courses on our marketplace.</p>
            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/creator/dashboard" class="button">Go to Creator Dashboard</a>
            </p>
            <p>Best regards,<br>The Elevate for Humanity Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: params.email,
    subject: 'Your Creator Application Has Been Approved!',
    html,
  });
}

export async function sendCreatorRejectionEmail(params: {
  email: string;
  name: string;
  reason: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Creator Application Update</h1>
          </div>
          <div class="content">
            <h2>Hi ${params.name},</h2>
            <p>Thank you for your interest in becoming a creator on our platform.</p>
            <p>After careful review, we're unable to approve your application at this time.</p>
            <p><strong>Reason:</strong> ${params.reason}</p>
            <p>You're welcome to reapply in the future. If you have questions, please contact us.</p>
            <p>Best regards,<br>The Elevate for Humanity Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: params.email,
    subject: 'Creator Application Update',
    html,
  });
}

export async function sendPayoutConfirmationEmail(params: {
  email: string;
  name: string;
  amount: number;
  payoutId: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Payout Processed</h1>
          </div>
          <div class="content">
            <h2>Hi ${params.name},</h2>
            <p>Your payout has been processed successfully!</p>
            <div class="amount">$${params.amount.toFixed(2)}</div>
            <p><strong>Payout ID:</strong> ${params.payoutId}</p>
            <p>The funds should arrive in your account within 2-5 business days.</p>
            <p>Best regards,<br>The Elevate for Humanity Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: params.email,
    subject: `Payout Processed: $${params.amount.toFixed(2)}`,
    html,
  });
}

export async function sendProductApprovalEmail(params: {
  email: string;
  name: string;
  productName: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Product Approved!</h1>
          </div>
          <div class="content">
            <h2>Hi ${params.name},</h2>
            <p>Your product "<strong>${params.productName}</strong>" has been approved and is now live on the marketplace!</p>
            <p>Students can now purchase and access your content.</p>
            <p>Best regards,<br>The Elevate for Humanity Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: params.email,
    subject: `Product Approved: ${params.productName}`,
    html,
  });
}

export async function sendProductRejectionEmail(params: {
  email: string;
  name: string;
  productName: string;
  reason: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Product Review Update</h1>
          </div>
          <div class="content">
            <h2>Hi ${params.name},</h2>
            <p>Your product "<strong>${params.productName}</strong>" requires revisions before it can be approved.</p>
            <p><strong>Reason:</strong> ${params.reason}</p>
            <p>Please make the necessary changes and resubmit for review.</p>
            <p>Best regards,<br>The Elevate for Humanity Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: params.email,
    subject: `Product Needs Revision: ${params.productName}`,
    html,
  });
}

export async function sendMarketplaceSaleNotification(params: {
  creatorEmail: string;
  creatorName: string;
  productName: string;
  amount: number;
  buyerName: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .amount { font-size: 24px; font-weight: bold; color: #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New Sale!</h1>
          </div>
          <div class="content">
            <h2>Hi ${params.creatorName},</h2>
            <p>Great news! You just made a sale.</p>
            <p><strong>Product:</strong> ${params.productName}</p>
            <p><strong>Buyer:</strong> ${params.buyerName}</p>
            <p><strong>Amount:</strong> <span class="amount">$${params.amount.toFixed(2)}</span></p>
            <p>Keep up the great work!</p>
            <p>Best regards,<br>The Elevate for Humanity Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: params.creatorEmail,
    subject: `New Sale: ${params.productName}`,
    html,
  });
}

export async function sendMarketplaceApplicationEmail(params: {
  adminEmail: string;
  applicantName: string;
  applicantEmail: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Creator Application</h1>
          </div>
          <div class="content">
            <p>A new creator application has been submitted:</p>
            <p><strong>Name:</strong> ${params.applicantName}</p>
            <p><strong>Email:</strong> ${params.applicantEmail}</p>
            <p>Please review the application in the admin dashboard.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: params.adminEmail,
    subject: 'New Creator Application',
    html,
  });
}

