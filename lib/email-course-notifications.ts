// Course Enrollment Email Notifications
// Elevate for Humanity Learning Management System

import { sendEmail } from './email';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.elevateforhumanity.org';
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@elevateforhumanity.org';

interface CourseEnrollmentData {
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseSlug: string;
  startDate?: string;
  duration: string;
  format: string;
  credentials: string[];
  liveSessionInfo?: string;
  handsOnInfo?: string;
  instructorName?: string;
  instructorEmail?: string;
}

/**
 * Send course enrollment confirmation email
 */
export async function sendCourseEnrollmentEmail(data: CourseEnrollmentData) {
  const {
    studentName,
    studentEmail,
    courseName,
    courseSlug,
    startDate,
    duration,
    format,
    credentials,
    liveSessionInfo,
    handsOnInfo,
  } = data;

  const dashboardUrl = `${APP_URL}/lms/dashboard`;
  const courseUrl = `${APP_URL}/lms/courses/${courseSlug}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Course Enrollment Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #E63946 0%, #F77F00 50%, #06A77D 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">🎉 You're Enrolled!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Hi ${studentName},</h2>
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Congratulations! You've successfully enrolled in <strong>${courseName}</strong> at Elevate for Humanity.
                  </p>

                  <!-- Course Details Box -->
                  <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">📚 Course Details</h3>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; width: 40%;">Duration:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${duration}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Format:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${format}</td>
                      </tr>
                      ${
                        startDate
                          ? `
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Start Date:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${startDate}</td>
                      </tr>
                      `
                          : ''
                      }
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Credentials:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${credentials.join(', ')}</td>
                      </tr>
                    </table>
                  </div>

                  ${
                    liveSessionInfo
                      ? `
                  <!-- Live Instruction Info -->
                  <div style="margin: 20px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">📹 Live Instruction Sessions</h3>
                    <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">${liveSessionInfo}</p>
                  </div>
                  `
                      : ''
                  }

                  ${
                    handsOnInfo
                      ? `
                  <!-- Hands-On Training Info -->
                  <div style="margin: 20px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">🛠️ Hands-On Training</h3>
                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">${handsOnInfo}</p>
                  </div>
                  `
                      : ''
                  }

                  <!-- Next Steps -->
                  <div style="margin: 30px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 18px;">✅ Next Steps</h3>
                    <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #064e3b;">
                      <li style="margin-bottom: 8px;">Log in to your student dashboard</li>
                      <li style="margin-bottom: 8px;">Complete your student profile</li>
                      <li style="margin-bottom: 8px;">Review the course syllabus and schedule</li>
                      <li style="margin-bottom: 8px;">Start your first module</li>
                      ${liveSessionInfo ? '<li style="margin-bottom: 8px;">Mark your calendar for live sessions</li>' : ''}
                    </ol>
                  </div>

                  <!-- CTA Buttons -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${courseUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #E63946 0%, #F77F00 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 0 10px 10px 0;">
                          Start Course
                        </a>
                        <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #6b7280; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 0 0 10px 0;">
                          View Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Support Info -->
                  <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Questions? Contact us at <a href="mailto:info@elevateforhumanity.org" style="color: #E63946;">info@elevateforhumanity.org</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #F77F00; font-size: 18px; font-weight: bold; font-style: italic;">
                    Innovate. Elevate. Reset.
                  </p>
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    © ${new Date().getFullYear()} Elevate for Humanity. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: studentEmail,
    subject: `Welcome to ${courseName} - Elevate for Humanity`,
    html,
    from: FROM_EMAIL,
  });
}

/**
 * Send course start reminder email (sent 1-2 days before start date)
 */
export async function sendCourseStartReminderEmail(data: CourseEnrollmentData) {
  const {
    studentName,
    studentEmail,
    courseName,
    courseSlug,
    startDate,
    liveSessionInfo,
  } = data;

  const courseUrl = `${APP_URL}/lms/courses/${courseSlug}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Course Starting Soon</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #7209B7 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">⏰ Your Course Starts Soon!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Hi ${studentName},</h2>
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    This is a friendly reminder that <strong>${courseName}</strong> starts on <strong>${startDate}</strong>.
                  </p>

                  <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 18px;">📅 Get Ready</h3>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #78350f;">
                      <li style="margin-bottom: 8px;">Log in to your dashboard and review course materials</li>
                      <li style="margin-bottom: 8px;">Test your internet connection and device</li>
                      <li style="margin-bottom: 8px;">Prepare any required materials or supplies</li>
                      ${liveSessionInfo ? `<li style="margin-bottom: 8px;">Add live session times to your calendar</li>` : ''}
                    </ul>
                  </div>

                  ${
                    liveSessionInfo
                      ? `
                  <div style="margin: 20px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">📹 Live Sessions</h3>
                    <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">${liveSessionInfo}</p>
                  </div>
                  `
                      : ''
                  }

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${courseUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #7209B7 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          Access Course
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    We're excited to see you in class! Questions? Email <a href="mailto:info@elevateforhumanity.org" style="color: #3b82f6;">info@elevateforhumanity.org</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #F77F00; font-size: 18px; font-weight: bold; font-style: italic;">
                    Innovate. Elevate. Reset.
                  </p>
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    © ${new Date().getFullYear()} Elevate for Humanity. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: studentEmail,
    subject: `Reminder: ${courseName} starts ${startDate}`,
    html,
    from: FROM_EMAIL,
  });
}

/**
 * Send live session reminder email (sent 24 hours before session)
 */
export async function sendLiveSessionReminderEmail(data: {
  studentName: string;
  studentEmail: string;
  courseName: string;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
  sessionLink?: string;
}) {
  const {
    studentName,
    studentEmail,
    courseName,
    sessionTitle,
    sessionDate,
    sessionTime,
    sessionLink,
  } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Live Session Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #06A77D 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">📹 Live Session Tomorrow</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Hi ${studentName},</h2>
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Don't forget! You have a live instruction session tomorrow for <strong>${courseName}</strong>.
                  </p>

                  <div style="margin: 30px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                    <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 18px;">${sessionTitle}</h3>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; width: 30%;">Date:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${sessionDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Time:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${sessionTime}</td>
                      </tr>
                    </table>
                  </div>

                  ${
                    sessionLink
                      ? `
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${sessionLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #06A77D 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          Join Live Session
                        </a>
                      </td>
                    </tr>
                  </table>
                  `
                      : ''
                  }

                  <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    <strong>Tip:</strong> Join a few minutes early to test your audio and video. See you there!
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    © ${new Date().getFullYear()} Elevate for Humanity. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: studentEmail,
    subject: `Reminder: Live Session Tomorrow - ${sessionTitle}`,
    html,
    from: FROM_EMAIL,
  });
}
