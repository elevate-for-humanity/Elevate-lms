import { logger } from '@/lib/logger';
import { sendEmail } from './sendgrid';

interface SendOrgInviteEmailParams {
  to: string;
  inviteUrl: string;
  organizationName: string;
  inviterName?: string;
}

export async function sendOrgInviteEmail({
  to,
  inviteUrl,
  organizationName,
  inviterName,
}: SendOrgInviteEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sendEmail({
      to,
      subject: `Invitation to join ${organizationName}`,
      html: `
        <h2>You've been invited to join ${organizationName}</h2>
        ${inviterName ? `<p>${inviterName} has invited you to join their organization.</p>` : ''}
        <p>Click the link below to accept the invitation:</p>
        <p><a href="${inviteUrl}">${inviteUrl}</a></p>
        <p>This invitation will expire in 7 days.</p>
        <p>If you did not expect this invitation, you can safely ignore this email.</p>
      `,
      text: `You've been invited to join ${organizationName}\n\n${inviterName ? `${inviterName} has invited you to join their organization.\n\n` : ''}Click the link below to accept the invitation:\n${inviteUrl}\n\nThis invitation will expire in 7 days.`,
    });

    return { success: result.success, error: result.error };
  } catch (error) {
    const message = 'Operation failed';
    logger.error('Failed to send org invite email:', message);
    return { success: false, error: message };
  }
}
