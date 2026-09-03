/**
 * WorkOne Survey Email Notifications
 * Sends survey emails to applicants asking about their WorkOne experience
 */

import { sendEmail } from '@/lib/email';
import { WORKONE_SURVEY, buildSurveyUrl } from '@/lib/surveys/workone-survey';

const FROM_EMAIL = 'Elevate for Humanity <noreply@elevateforhumanity.org>';
const REPLY_TO = 'elevate4humanityedu@gmail.com';

interface SurveyRecipient {
  email: string;
  name: string;
  applicationId: string;
  surveyToken: string;
}

/**
 * Send WorkOne survey email to a single recipient
 */
export async function sendWorkOneSurveyEmail(recipient: SurveyRecipient) {
  const surveyUrl = buildSurveyUrl(recipient.surveyToken);
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${WORKONE_SURVEY.emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 48px 40px 40px 40px; text-align: center; background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Quick Question About WorkOne</h1>
              <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">We want to make sure you're getting the support you need</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px 0; color: #111827; font-size: 18px; line-height: 1.6;">
                Hi ${recipient.name},
              </p>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.7;">
                We noticed you're interested in our workforce training programs, and we wanted to check in about your experience with <strong>WorkOne</strong> — your local workforce center.
              </p>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.7;">
                WorkOne can help cover training costs through programs like <strong>WIOA</strong> (Workforce Innovation and Opportunity Act). Your experience there matters to us, and we want to make sure you're getting the support you deserve.
              </p>
              
              <!-- Questions Preview -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 32px 0;">
                <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 18px; font-weight: 600;">
                  We'll ask you 5 quick questions:
                </h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                  <li>Have you gone to WorkOne yet?</li>
                  <li>Did you sign up for funding?</li>
                  <li>Do you need help with the process?</li>
                  <li>Were you referred to other programs?</li>
                  <li>Did anyone try to steer you away from Elevate?</li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${surveyUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">
                  Take the 2-Minute Survey →
                </a>
              </div>
              
              <!-- Why This Matters -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 8px 8px 0; margin: 32px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>Why we're asking:</strong> WorkOne sometimes refers people to other training programs. We want to make sure you get the best fit for your career goals — and if you've been steered somewhere else, we may be able to help advocate for you.
                </p>
              </div>
              
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
                The survey takes about 2 minutes. Your answers help us improve support for students like you.
              </p>
              
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Thanks,<br>
                <strong>The Elevate for Humanity Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.6;">
                You're receiving this because you applied to Elevate for Humanity.<br>
                <a href="${surveyUrl}" style="color: #059669; text-decoration: underline;">Click here to take the survey</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${recipient.name},

We wanted to check in about your WorkOne experience.

WorkOne can help cover training costs through programs like WIOA. Your experience there matters to us.

We'll ask you 5 quick questions:
1. Have you gone to WorkOne yet?
2. Did you sign up for funding?
3. Do you need help with the process?
4. Were you referred to other programs?
5. Did anyone try to steer you away from Elevate?

Take the 2-minute survey: ${surveyUrl}

Why we're asking: WorkOne sometimes refers people to other training programs. We want to make sure you get the best fit for your career goals — and if you've been steered somewhere else, we may be able to help advocate for you.

Thanks,
The Elevate for Humanity Team

---
You're receiving this because you applied to Elevate for Humanity.
  `.trim();

  return sendEmail({
    from: FROM_EMAIL,
    to: recipient.email,
    replyTo: REPLY_TO,
    subject: WORKONE_SURVEY.emailSubject,
    html,
    text,
  });
}

/**
 * Send survey emails to multiple recipients (batch)
 */
export async function sendWorkOneSurveyBatch(recipients: SurveyRecipient[]) {
  const results = await Promise.allSettled(
    recipients.map((recipient) => sendWorkOneSurveyEmail(recipient))
  );
  
  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  
  return {
    total: recipients.length,
    successful,
    failed,
    errors: results
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason),
  };
}
