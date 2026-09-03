import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface MOUSignedNotificationData {
  programHolderName: string;
  signerName: string;
  signerTitle: string;
  contactEmail: string;
  signedAt: string;
}

export async function sendMOUSignedConfirmation(data: MOUSignedNotificationData): Promise<boolean> {
  try {
    await sendEmail({
      to: data.contactEmail,
      subject: 'MOU Signed Successfully — ' + PLATFORM_DEFAULTS.orgName + '',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2563eb">MOU Signed Successfully</h2>
        <p>Dear ${data.signerName},</p>
        <p>Thank you for signing the Memorandum of Understanding (MOU) with ${PLATFORM_DEFAULTS.orgName}.</p>
        <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0">
          <p><strong>Program Holder:</strong> ${data.programHolderName}</p>
          <p><strong>Signed by:</strong> ${data.signerName}, ${data.signerTitle}</p>
          <p><strong>Date:</strong> ${new Date(data.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <p>Questions? <a href="mailto:info@${PLATFORM_DEFAULTS.canonicalDomain}">info@${PLATFORM_DEFAULTS.canonicalDomain}</a></p>
        <p>Best regards,<br><strong>${PLATFORM_DEFAULTS.orgName}</strong></p>
      </div>`,
    });
    return true;
  } catch (error) {
    logger.error('MOU confirmation email failed', error as Error, { to: data.contactEmail });
    return false;
  }
}

export async function sendMOUSignedAdminNotification(
  data: MOUSignedNotificationData,
): Promise<boolean> {
  try {
    await sendEmail({
      to: process.env.MOU_ARCHIVE_EMAIL || 'agreements@elevateforhumanity.org',
      subject: `MOU Signed: ${data.programHolderName}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2563eb">New MOU Signed</h2>
        <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0">
          <p><strong>Program Holder:</strong> ${data.programHolderName}</p>
          <p><strong>Signed by:</strong> ${data.signerName}, ${data.signerTitle}</p>
          <p><strong>Contact:</strong> ${data.contactEmail}</p>
          <p><strong>Date:</strong> ${new Date(data.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/program-holders"
           style="background:#1d4ed8;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">
          View Program Holders
        </a>
      </div>`,
    });
    return true;
  } catch (error) {
    logger.error('MOU admin notification failed', error as Error, {
      programHolder: data.programHolderName,
    });
    return false;
  }
}
