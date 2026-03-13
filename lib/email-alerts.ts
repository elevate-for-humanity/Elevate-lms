import { logger } from '@/lib/logger';
/**
 * Email alert system for admin notifications
 * Uses Resend API for reliable email delivery
 */

interface EmailAlert {
  to: string;
  subject: string;
  html: string;
}

export async function sendAdminAlert(alert: EmailAlert) {
  if (!process.env.SENDGRID_API_KEY) {
    return { success: true, provider: 'console' };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: alert.to }] }],
        from: { name: 'Elevate for Humanity', email: 'noreply@elevateforhumanity.org' },
        subject: alert.subject,
        content: [{ type: 'text/html', value: alert.html }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Email API error: ${response.statusText}`);
    }

    return { success: true, provider: 'sendgrid' };
  } catch (error) {
    logger.error('Email alert error:', error);
    return { success: false, error };
  }
}

// Predefined alert templates
export const AlertTemplates = {
  newApplication: (data: { name: string; email: string; program: string; id: string }) => ({
    to: 'admissions@www.elevateforhumanity.org',
    subject: `New Application: ${data.name} - ${data.program}`,
    html: `
      <h2>New Application Received</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Program:</strong> ${data.program}</p>
      <p><strong>Application ID:</strong> ${data.id}</p>
      <p><a href="https://www.elevateforhumanity.org/admin/applications/${data.id}">Review Application</a></p>
      <hr>
      <p><small>SLA: Respond within 48 hours</small></p>
    `,
  }),

  newContactMessage: (data: { name: string; email: string; message: string; id: string }) => ({
    to: 'info@www.elevateforhumanity.org',
    subject: `New Contact Message: ${data.name}`,
    html: `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Message:</strong></p>
      <p>${data.message}</p>
      <p><a href="https://www.elevateforhumanity.org/admin/contact/${data.id}">View Message</a></p>
      <hr>
      <p><small>SLA: Respond within 24 hours</small></p>
    `,
  }),

  enrollmentCreated: (data: { studentName: string; program: string; fundingSource: string; id: string }) => ({
    to: 'registrar@www.elevateforhumanity.org',
    subject: `New Enrollment: ${data.studentName} - ${data.program}`,
    html: `
      <h2>New Enrollment Created</h2>
      <p><strong>Student:</strong> ${data.studentName}</p>
      <p><strong>Program:</strong> ${data.program}</p>
      <p><strong>Funding:</strong> ${data.fundingSource}</p>
      <p><a href="https://www.elevateforhumanity.org/admin/enrollments/${data.id}">View Enrollment</a></p>
      <hr>
      <p><small>Action Required: Verify funding documentation</small></p>
    `,
  }),

  certificateIssued: (data: { studentName: string; program: string; certificateNumber: string; id: string }) => ({
    to: 'registrar@www.elevateforhumanity.org',
    subject: `Certificate Issued: ${data.certificateNumber}`,
    html: `
      <h2>Certificate Issued</h2>
      <p><strong>Student:</strong> ${data.studentName}</p>
      <p><strong>Program:</strong> ${data.program}</p>
      <p><strong>Certificate #:</strong> ${data.certificateNumber}</p>
      <p><a href="https://www.elevateforhumanity.org/admin/certificates/${data.id}">View Certificate</a></p>
      <hr>
      <p><small>Certificate has been generated and is ready for distribution</small></p>
    `,
  }),

  contentFlagged: (data: { postId: string; reason: string; flaggedBy: string }) => ({
    to: 'community@www.elevateforhumanity.org',
    subject: `Content Flagged for Moderation`,
    html: `
      <h2>Content Flagged</h2>
      <p><strong>Post ID:</strong> ${data.postId}</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p><strong>Flagged By:</strong> ${data.flaggedBy}</p>
      <p><a href="https://www.elevateforhumanity.org/admin/moderation">Review in Moderation Queue</a></p>
      <hr>
      <p><small>SLA: Review within 24 hours</small></p>
    `,
  }),
};
