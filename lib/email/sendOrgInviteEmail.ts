import { logger } from '@/lib/logger';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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
  if (!resend) {
    throw new Error('RESEND_API_KEY not configured');
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@www.elevateforhumanity.org',
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
      text: `
You've been invited to join ${organizationName}

${inviterName ? `${inviterName} has invited you to join their organization.\n\n` : ''}
Click the link below to accept the invitation:
${inviteUrl}

This invitation will expire in 7 days.

If you did not expect this invitation, you can safely ignore this email.
      `,
    });

    return { success: true };
  } catch (error) { /* Error handled silently */ 
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to send org invite email:', message);
    return { success: false, error: message };
  }
}
