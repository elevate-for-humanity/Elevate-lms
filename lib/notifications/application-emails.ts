/**
 * Application Email Notifications
 * Handles all email notifications related to student applications
 */

import { sendEmail } from '@/lib/email';

const ADMIN_EMAIL = 'info@elevateforhumanity.org';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

interface ApplicationData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  programInterest: string;
  city?: string;
  zipCode?: string;
  submittedAt: string;
}

/**
 * Send confirmation email to student after application submission
 */
export async function sendApplicationConfirmation(application: ApplicationData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Received</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #dc2626 0%, #f97316 50%, #2563eb 100%); padding: 48px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: -0.5px;">Application Received!</h1>
                  <p style="margin: 12px 0 0 0; color: #ffffff; font-size: 18px; opacity: 0.95;">Thank you for taking the first step</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 48px 40px;">
                  <p style="margin: 0 0 24px 0; color: #111827; font-size: 18px; line-height: 1.6;">
                    Hi <strong>${application.firstName}</strong>,
                  </p>

                  <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.7;">
                    We've received your application for the <strong>${application.programInterest}</strong> program.
                    Our admissions team is reviewing your information and will contact you within 1-2 business days.
                  </p>

                  <!-- What's Next Box -->
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 24px; margin: 32px 0; border-radius: 8px;">
                    <h3 style="margin: 0 0 16px 0; color: #92400e; font-size: 20px; font-weight: 600;">What Happens Next?</h3>
                    <ol style="margin: 0; padding-left: 20px; color: #78350f; font-size: 15px; line-height: 1.8;">
                      <li style="margin-bottom: 8px;">Our team reviews your application</li>
                      <li style="margin-bottom: 8px;">We'll call you to discuss the program and answer questions</li>
                      <li style="margin-bottom: 8px;">If approved, you'll receive an enrollment link via email</li>
                      <li>Complete enrollment and start your training journey!</li>
                    </ol>
                  </div>

                  <!-- Application Details -->
                  <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin: 32px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">Your Application Details</h3>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Program:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${application.programInterest}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Submitted:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${new Date(application.submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Application ID:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right; font-family: monospace;">${application.id.substring(0, 8).toUpperCase()}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${SITE_URL}/programs" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                      Explore Our Programs
                    </a>
                  </div>

                  <!-- Contact Info -->
                  <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                      <strong style="color: #111827;">Questions?</strong> We're here to help!
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      📞 Call us: <a href="tel:317-314-3757" style="color: #dc2626; text-decoration: none; font-weight: 600;">317-314-3757</a><br>
                      📧 Email: <a href="mailto:info@elevateforhumanity.org" style="color: #dc2626; text-decoration: none; font-weight: 600;">info@elevateforhumanity.org</a>
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #111827; padding: 32px 40px; text-align: center;">
                  <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                    Elevate For Humanity
                  </p>
                  <p style="margin: 0 0 16px 0; color: #9ca3af; font-size: 14px;">
                    Workforce Training & Career Pathways
                  </p>
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    © ${new Date().getFullYear()} Elevate For Humanity. All rights reserved.
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
    to: application.email,
    subject: `Application Received - ${application.programInterest}`,
    html,
    replyTo: ADMIN_EMAIL,
  });
}

/**
 * Send notification to admin about new application
 */
export async function sendAdminApplicationNotification(application: ApplicationData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Application Received</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 32px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎓 New Application</h1>
                  <p style="margin: 8px 0 0 0; color: #dbeafe; font-size: 16px;">Action Required</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 24px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                    A new application has been submitted and requires review.
                  </p>

                  <!-- Applicant Info -->
                  <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin: 24px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">Applicant Information</h3>
                    <table width="100%" cellpadding="10" cellspacing="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; font-weight: 500; width: 140px;">Name:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${application.firstName} ${application.lastName}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Email:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;"><a href="mailto:${application.email}" style="color: #2563eb; text-decoration: none;">${application.email}</a></td>
                      </tr>
                      ${application.phone ? `
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Phone:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;"><a href="tel:${application.phone}" style="color: #2563eb; text-decoration: none;">${application.phone}</a></td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Program:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${application.programInterest}</td>
                      </tr>
                      ${application.city ? `
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Location:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${application.city}${application.zipCode ? `, ${application.zipCode}` : ''}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Submitted:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${new Date(application.submittedAt).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Application ID:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; font-family: monospace;">${application.id}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Action Buttons -->
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${SITE_URL}/admin/applications/${application.id}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 0 8px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                      Review Application
                    </a>
                    <a href="${SITE_URL}/admin/applications" style="display: inline-block; background-color: #ffffff; color: #2563eb; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 0 8px; border: 2px solid #2563eb;">
                      View All Applications
                    </a>
                  </div>

                  <!-- Next Steps -->
                  <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 32px 0; border-radius: 8px;">
                    <h4 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600;">Next Steps:</h4>
                    <ol style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 14px; line-height: 1.8;">
                      <li>Review application details in admin dashboard</li>
                      <li>Contact applicant within 24-48 hours</li>
                      <li>Conduct phone interview if needed</li>
                      <li>Approve and send enrollment link</li>
                    </ol>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 13px;">
                    This is an automated notification from Elevate For Humanity Admin System
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
    to: ADMIN_EMAIL,
    subject: `🎓 New Application: ${application.firstName} ${application.lastName} - ${application.programInterest}`,
    html,
    replyTo: application.email,
  });
}

/**
 * Send enrollment link to approved applicant
 */
export async function sendEnrollmentLink(application: ApplicationData, enrollmentToken: string) {
  const enrollmentUrl = `${SITE_URL}/enroll/${enrollmentToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Approved - Complete Your Enrollment</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 48px 40px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">Congratulations!</h1>
                  <p style="margin: 12px 0 0 0; color: #d1fae5; font-size: 18px;">Your application has been approved</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 48px 40px;">
                  <p style="margin: 0 0 24px 0; color: #111827; font-size: 18px; line-height: 1.6;">
                    Hi <strong>${application.firstName}</strong>,
                  </p>

                  <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.7;">
                    Great news! Your application for the <strong>${application.programInterest}</strong> program has been approved.
                    You're one step away from starting your training journey.
                  </p>

                  <!-- CTA Box -->
                  <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #10b981; padding: 32px; margin: 32px 0; border-radius: 12px; text-align: center;">
                    <h3 style="margin: 0 0 16px 0; color: #065f46; font-size: 20px; font-weight: 600;">Complete Your Enrollment Now</h3>
                    <p style="margin: 0 0 24px 0; color: #047857; font-size: 15px;">
                      Click the button below to finalize your enrollment and get started
                    </p>
                    <a href="${enrollmentUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 50px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 12px rgba(16, 185, 129, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                      Complete Enrollment →
                    </a>
                    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 13px;">
                      This link is unique to you and expires in 7 days
                    </p>
                  </div>

                  <!-- What's Next -->
                  <div style="margin: 32px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">What Happens After Enrollment:</h3>
                    <div style="margin: 16px 0;">
                      <div style="display: flex; align-items: start; margin-bottom: 16px;">
                        <div style="background-color: #10b981; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 16px; flex-shrink: 0;">1</div>
                        <div>
                          <strong style="color: #111827; font-size: 15px;">Instant Access</strong>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Get immediate access to your student dashboard and course materials</p>
                        </div>
                      </div>
                      <div style="display: flex; align-items: start; margin-bottom: 16px;">
                        <div style="background-color: #10b981; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 16px; flex-shrink: 0;">2</div>
                        <div>
                          <strong style="color: #111827; font-size: 15px;">Orientation</strong>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Complete a brief orientation to learn how to use the platform</p>
                        </div>
                      </div>
                      <div style="display: flex; align-items: start;">
                        <div style="background-color: #10b981; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 16px; flex-shrink: 0;">3</div>
                        <div>
                          <strong style="color: #111827; font-size: 15px;">Start Learning</strong>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Begin your first module and start building your new career</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Contact -->
                  <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                      <strong style="color: #111827;">Questions?</strong> We're here to help!
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      📞 <a href="tel:317-314-3757" style="color: #10b981; text-decoration: none; font-weight: 600;">317-314-3757</a><br>
                      📧 <a href="mailto:info@elevateforhumanity.org" style="color: #10b981; text-decoration: none; font-weight: 600;">info@elevateforhumanity.org</a>
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #111827; padding: 32px 40px; text-align: center;">
                  <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                    Elevate For Humanity
                  </p>
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    © ${new Date().getFullYear()} Elevate For Humanity. All rights reserved.
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
    to: application.email,
    subject: `🎉 Application Approved - Complete Your Enrollment for ${application.programInterest}`,
    html,
    replyTo: ADMIN_EMAIL,
  });
}
