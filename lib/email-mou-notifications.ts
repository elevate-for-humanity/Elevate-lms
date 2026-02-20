import { Resend } from 'resend';
import { logger } from '@/lib/logger';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn(
      'RESEND_API_KEY not configured - email notifications will be skipped'
    );
    return null;
  }
  return new Resend(apiKey);
}

interface MOUSignedNotificationData {
  programHolderName: string;
  signerName: string;
  signerTitle: string;
  contactEmail: string;
  signedAt: string;
}

/**
 * Send email notification to program holder confirming MOU signature
 */
export async function sendMOUSignedConfirmation(
  data: MOUSignedNotificationData
) {
  const resend = getResendClient();
  if (!resend) {
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Elevate for Humanity <noreply@elevateforhumanity.org>',
      to: data.contactEmail,
      subject: 'MOU Signed Successfully - Elevate for Humanity',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">MOU Signed Successfully</h2>

          <p>Dear ${data.signerName},</p>

          <p>Thank you for signing the Memorandum of Understanding (MOU) with Elevate for Humanity.</p>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Signature Details</h3>
            <p><strong>Program Holder:</strong> ${data.programHolderName}</p>
            <p><strong>Signed by:</strong> ${data.signerName}</p>
            <p><strong>Title:</strong> ${data.signerTitle}</p>
            <p><strong>Date:</strong> ${new Date(
              data.signedAt
            ).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</p>
          </div>

          <p>You can download a copy of your signed MOU from your program holder portal at any time.</p>

          <h3>Next Steps</h3>
          <ul>
            <li>You can now begin enrolling participants in training programs</li>
            <li>Access your program holder dashboard to manage cases and track progress</li>
            <li>Review the revenue share model and payment schedule in your MOU</li>
          </ul>

          <p>If you have any questions, please contact our team.</p>

          <p>Best regards,<br>
          <strong>Elevate for Humanity Team</strong></p>
        </div>
      `,
    });

    if (error) {
      logger.error('Error sending MOU confirmation email', error as Error, {
        to: data.contactEmail,
        programHolder: data.programHolderName
      });
      return false;
    }

    return true;
  } catch (error) { /* Error handled silently */ 
    logger.error('Error sending MOU confirmation email', error as Error, {
      to: data.contactEmail
    });
    return false;
  }
}

/**
 * Send email notification to admin team when MOU is signed
 */
export async function sendMOUSignedAdminNotification(
  data: MOUSignedNotificationData
) {
  const resend = getResendClient();
  if (!resend) {
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Elevate for Humanity <noreply@elevateforhumanity.org>',
      to: 'admin@www.elevateforhumanity.org', // Update with actual admin email
      subject: `MOU Signed: ${data.programHolderName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New MOU Signed</h2>

          <p>A program holder has signed their MOU.</p>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Signature Details</h3>
            <p><strong>Program Holder:</strong> ${data.programHolderName}</p>
            <p><strong>Signed by:</strong> ${data.signerName}</p>
            <p><strong>Title:</strong> ${data.signerTitle}</p>
            <p><strong>Contact Email:</strong> ${data.contactEmail}</p>
            <p><strong>Date:</strong> ${new Date(
              data.signedAt
            ).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</p>
          </div>

          <p>The signed MOU is available in the admin portal.</p>

          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/program-holders"
             style="background-color: #2563eb; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            View Program Holders
          </a></p>
        </div>
      `,
    });

    if (error) {
      logger.error('Error sending admin notification email', error as Error, {
        programHolder: data.programHolderName
      });
      return false;
    }

    return true;
  } catch (error) { /* Error handled silently */ 
    logger.error('Error sending admin notification email', error as Error, {
      programHolder: data.programHolderName
    });
    return false;
  }
}
