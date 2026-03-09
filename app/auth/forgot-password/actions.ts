'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

/**
 * Generate a password recovery link via Supabase Admin API and send it
 * through Resend. Supabase's built-in SMTP is not configured, so we
 * bypass it entirely.
 */
export async function sendRecoveryEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    logger.error('[Recovery] Admin client unavailable');
    return { success: false, error: 'Service temporarily unavailable. Please try again later.' };
  }

  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        // Must go through /auth/confirm so the server can call verifyOtp
        // and set the session cookie before the reset form loads.
        redirectTo: `${SITE_URL}/auth/confirm?next=/auth/reset-password`,
      },
    });

    if (error) {
      // Don't reveal whether the email exists
      logger.error('[Recovery] generateLink error:', error.message);
      return { success: true };
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      logger.error('[Recovery] No action link returned');
      return { success: true };
    }

    const result = await sendEmail({
      to: email,
      subject: 'Reset Your Password — Elevate for Humanity',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
        <tr>
          <td style="background:linear-gradient(135deg,#ea580c 0%,#dc2626 100%);padding:30px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:24px">Password Reset</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:30px">
            <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 20px">
              We received a request to reset your password. Click the button below to set a new password.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:20px 0">
                <a href="${actionLink}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:bold;font-size:16px">
                  Reset Password
                </a>
              </td></tr>
            </table>
            <p style="color:#64748b;font-size:14px;line-height:1.6;margin:20px 0 0">
              This link expires in 24 hours. If you didn't request a password reset, you can ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="color:#64748b;font-size:13px;margin:0">
              Elevate for Humanity | Indianapolis, IN |
              <a href="https://www.elevateforhumanity.org" style="color:#ea580c;text-decoration:none">elevateforhumanity.org</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    if (!result.success) {
      logger.error('[Recovery] Email send failed:', result.error);
      return { success: false, error: 'Failed to send email. Please try again.' };
    }

    return { success: true };
  } catch (err) {
    logger.error('[Recovery] Unexpected error:', err);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
