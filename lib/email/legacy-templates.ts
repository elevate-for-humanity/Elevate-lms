/**
 * Legacy email templates — full HTML email templates used by cron jobs
 * and the /api/emails/* routes. sendEmail is re-exported from ./sendgrid.
 */
import { sendEmail } from './sendgrid';
export { sendEmail };

// Email templates
export const emailTemplates = {
  welcome: (studentName: string, courseName: string, loginUrl: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Elevate for Humanity</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
                  <h1 style="margin: 0; color: #1e293b; font-size: 32px; font-weight: bold;">Welcome to Elevate!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Hi ${studentName},</h2>
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Welcome to Elevate for Humanity! We're excited to have you enrolled in <strong>${courseName}</strong>.
                  </p>
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Your learning journey starts now. Access your course materials, track your progress, and earn your certificate by completing all required lessons and assessments.
                  </p>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${loginUrl}" style="display: inline-block; padding: 16px 32px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          Access Your Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>

                  <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-left: 4px solid #e5e7eb; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px;">What's Next?</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #374151;">
                      <li style="margin-bottom: 8px;">Complete your profile</li>
                      <li style="margin-bottom: 8px;">Review the course syllabus</li>
                      <li style="margin-bottom: 8px;">Start your first lesson</li>
                      <li>Connect with your case manager (if applicable)</li>
                    </ul>
                  </div>

                  <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Need help? Contact us at <a href="mailto:info@elevateforhumanity.org" style="color: #dc2626;">info@elevateforhumanity.org</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #ffffff; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Elevate for Humanity Career & Technical Institute
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    Empowering individuals through workforce training
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,

  inactivityReminder: (
    studentName: string,
    courseName: string,
    daysSinceLogin: number,
    loginUrl: string
  ) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>We Miss You!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
                  <h1 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: bold;">We Miss You!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Hi ${studentName},</h2>
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    We noticed you haven't logged into your <strong>${courseName}</strong> course in ${daysSinceLogin} days.
                    Don't let your momentum slip away!
                  </p>
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Your goals are within reach. Just a few minutes of learning each day can make a big difference in your career journey.
                  </p>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${loginUrl}" style="display: inline-block; padding: 16px 32px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          Continue Learning
                        </a>
                      </td>
                    </tr>
                  </table>

                  <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-left: 4px solid #e5e7eb; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 18px;">Need Support?</h3>
                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                      If you're facing challenges or have questions, we're here to help. Reach out to your case manager
                      or contact our support team. Don't let obstacles stop your progress!
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #ffffff; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Elevate for Humanity Career & Technical Institute
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    <a href="mailto:info@elevateforhumanity.org" style="color: #dc2626; text-decoration: none;">info@elevateforhumanity.org</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,

  courseCompletion: (
    studentName: string,
    courseName: string,
    certificateUrl: string,
    dashboardUrl: string
  ) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Congratulations!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
                  <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
                  <h1 style="margin: 0; color: #1e293b; font-size: 32px; font-weight: bold;">Congratulations!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Amazing work, ${studentName}!</h2>
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    You've successfully completed <strong>${courseName}</strong>! This is a significant achievement
                    and a major step forward in your career journey.
                  </p>
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Your certificate is ready! Download it, share it on LinkedIn, and add it to your resume.
                    You've earned this recognition.
                  </p>

                  <!-- CTA Buttons -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${certificateUrl}" style="display: inline-block; padding: 16px 32px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 0 5px 10px 5px;">
                          Download Certificate
                        </a>
                        <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #ffffff; color: #059669; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; border: 2px solid #059669; margin: 0 5px 10px 5px;">
                          View Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>

                  <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-left: 4px solid #e5e7eb; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px;">What's Next?</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #374151;">
                      <li style="margin-bottom: 8px;">Share your achievement on social media</li>
                      <li style="margin-bottom: 8px;">Update your resume and LinkedIn profile</li>
                      <li style="margin-bottom: 8px;">Explore additional courses to expand your skills</li>
                      <li>Connect with employers in your field</li>
                    </ul>
                  </div>

                  <p style="margin: 20px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    We're proud of your dedication and hard work. Keep building your future!
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #ffffff; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Elevate for Humanity Career & Technical Institute
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    Empowering individuals through workforce training
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,

  certificateIssued: (
    studentName: string,
    courseName: string,
    certificateNumber: string,
    verificationUrl: string
  ) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Certificate is Ready</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
                  <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
                  <h1 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: bold;">Your Certificate is Ready!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Hi ${studentName},</h2>
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Your certificate for <strong>${courseName}</strong> has been issued and is ready to download!
                  </p>

                  <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #1e40af; font-size: 14px; font-weight: bold;">Certificate Number</p>
                    <p style="margin: 0; color: #374151; font-size: 20px; font-family: monospace; font-weight: bold;">${certificateNumber}</p>
                  </div>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          View & Download Certificate
                        </a>
                      </td>
                    </tr>
                  </table>

                  <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-left: 4px solid #e5e7eb; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 18px;">Share Your Achievement</h3>
                    <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.6;">
                      Add your certificate to LinkedIn, share it with potential employers, and showcase your new skills.
                      Your certificate includes a verification link that employers can use to confirm its authenticity.
                    </p>
                  </div>

                  <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Congratulations on this achievement! We're proud to have been part of your learning journey.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #ffffff; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Elevate for Humanity Career & Technical Institute
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    <a href="mailto:info@elevateforhumanity.org" style="color: #2563eb; text-decoration: none;">info@elevateforhumanity.org</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,

  quizReminder: (
    studentName: string,
    courseName: string,
    quizTitle: string,
    dueDate: string,
    quizUrl: string
  ) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quiz Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
                  <div style="font-size: 48px; margin-bottom: 10px;">⏰</div>
                  <h1 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: bold;">Quiz Reminder</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Hi ${studentName},</h2>
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    This is a friendly reminder that you have a quiz coming up in <strong>${courseName}</strong>.
                  </p>

                  <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-left: 4px solid #e5e7eb; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 18px;">${quizTitle}</h3>
                    <p style="margin: 0; color: #78350f; font-size: 14px;">
                      <strong>Due Date:</strong> ${dueDate}
                    </p>
                  </div>

                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Make sure you're prepared and complete the quiz before the deadline. Review your course materials
                    and reach out if you have any questions.
                  </p>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${quizUrl}" style="display: inline-block; padding: 16px 32px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          Take Quiz Now
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #ffffff; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Elevate for Humanity Career & Technical Institute
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
};

// Helper functions for common email scenarios

interface WelcomeEmailParams {
  to: string;
  tenantId: string;
  licenseType: string;
  validUntil: string;
}

export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  const { to, tenantId, licenseType, validUntil } = params;

  return sendEmail({
    to,
    subject: 'Welcome to Elevate for Humanity - License Activated',
    html: `
      <h1>Welcome to Elevate for Humanity!</h1>
      <p>Your ${licenseType} license has been successfully activated.</p>
      <p><strong>Tenant ID:</strong> ${tenantId}</p>
      <p><strong>Valid Until:</strong> ${new Date(validUntil).toLocaleDateString()}</p>
      <p>You can now access your platform at: <a href="https://www.elevateforhumanity.org/platform">https://www.elevateforhumanity.org/platform</a></p>
      <p>If you have any questions, please contact us at info@elevateforhumanity.org</p>
      <p>Thank you for choosing Elevate for Humanity!</p>
    `,
  });
}

interface EnrollmentEmailParams {
  to: string;
  programName: string;
  enrollmentId: string;
}

export async function sendEnrollmentEmail(params: EnrollmentEmailParams) {
  const { to, programName, enrollmentId } = params;

  return sendEmail({
    to,
    subject: `Enrollment Confirmed - ${programName}`,
    html: `
      <h1>Enrollment Confirmed!</h1>
      <p>You have been successfully enrolled in <strong>${programName}</strong>.</p>
      <p><strong>Enrollment ID:</strong> ${enrollmentId}</p>
      <p>Next steps:</p>
      <ol>
        <li>Log in to your student dashboard</li>
        <li>Complete your student profile</li>
        <li>Review program materials</li>
        <li>Attend orientation (if required)</li>
      </ol>
      <p><a href="https://www.elevateforhumanity.org/lms/dashboard">Access Your Dashboard</a></p>
      <p>If you have any questions, please contact us at info@elevateforhumanity.org</p>
    `,
  });
}
