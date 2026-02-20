import { logger } from '@/lib/logger';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from:
        options.from || 'Elevate for Humanity <noreply@elevateforhumanity.org>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      logger.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error('Email send exception:', error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  role: string
) {
  const roleMessages: Record<
    string,
    { title: string; message: string; nextSteps: string }
  > = {
    student: {
      title: 'Welcome to Your Learning Journey!',
      message: 'Your application has been received and is being reviewed.',
      nextSteps: 'Check your dashboard for program updates and next steps.',
    },
    program_holder: {
      title: 'Welcome to Our Partnership!',
      message: 'Thank you for partnering with us to provide training programs.',
      nextSteps: 'Complete your organization profile to get started.',
    },
    employer: {
      title: 'Welcome to Our Hiring Network!',
      message:
        "Your company is being verified. You'll have access to qualified candidates soon.",
      nextSteps: 'Prepare your job postings while we verify your account.',
    },
    staff: {
      title: 'Thank You for Your Application!',
      message: 'Our team is reviewing your application.',
      nextSteps: "We'll contact you if your qualifications match our needs.",
    },
  };

  const content = roleMessages[role] || roleMessages.student;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Elevate for Humanity</h1>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">${content.title}</h2>

          <p style="font-size: 16px; color: #4b5563;">Hi ${firstName},</p>

          <p style="font-size: 16px; color: #4b5563;">${content.message}</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">What's Next?</h3>
            <p style="color: #4b5563; margin-bottom: 0;">${content.nextSteps}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.elevateforhumanity.org/dashboard"
               style="display: inline-block; background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Go to Dashboard
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 14px; color: #6b7280;">
            Need help? Contact us at <a href="mailto:info@www.elevateforhumanity.org" style="color: #f97316;">info@www.elevateforhumanity.org</a> or call 317-314-3757.
          </p>

          <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
            © 2026 Elevate for Humanity. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: content.title,
    html,
  });
}

export async function sendStatusUpdateEmail(
  email: string,
  firstName: string,
  oldStatus: string,
  newStatus: string,
  role: string
) {
  const statusMessages: Record<string, string> = {
    approved: 'Your application has been approved! 🎉',
    rejected: 'Thank you for your application',
    in_progress: 'Your application is being processed',
    pending_verification: "We're verifying your information",
    verified: 'Your account has been verified! ✓',
    active: 'Your account is now active',
  };

  const message =
    statusMessages[newStatus] || 'Your application status has been updated';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Status Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Application Update</h1>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #4b5563;">Hi ${firstName},</p>

          <h2 style="color: #1f2937;">${message}</h2>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #4b5563; margin: 0;">
              <strong>Previous Status:</strong> ${oldStatus}<br>
              <strong>New Status:</strong> ${newStatus}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.elevateforhumanity.org/dashboard"
               style="display: inline-block; background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              View Dashboard
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 14px; color: #6b7280;">
            Questions? Contact us at <a href="mailto:info@www.elevateforhumanity.org" style="color: #f97316;">info@www.elevateforhumanity.org</a>
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Application Status Update: ${message}`,
    html,
  });
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #4b5563;">You requested to reset your password.</p>

          <p style="font-size: 16px; color: #4b5563;">Click the button below to create a new password:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}"
               style="display: inline-block; background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #9ca3af;">
            If the button doesn't work, copy and paste this link:<br>
            <a href="${resetLink}" style="color: #f97316; word-break: break-all;">${resetLink}</a>
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - Elevate for Humanity',
    html,
  });
}
