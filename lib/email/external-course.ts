import { sendEmail } from './sendgrid';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';

interface ExternalCourseLoginEmailParams {
  to: string;
  studentName: string;
  courseTitle: string;
  partnerName: string;
  partnerUrl: string;
  loginInstructions: string; // username, temp password, any partner-specific steps
  programTitle: string;
}

/**
 * Sent to the student after Elevate purchases an external course on their behalf,
 * or after a student self-pays and the partner confirms enrollment.
 * Contains login credentials and instructions to access the partner platform.
 */
export async function sendExternalCourseLoginEmail(params: ExternalCourseLoginEmailParams) {
  const {
    to, studentName, courseTitle, partnerName,
    partnerUrl, loginInstructions, programTitle,
  } = params;

  return sendEmail({
    to,
    subject: `Your login for ${courseTitle} — ${partnerName}`,
    replyTo: ADMIN_EMAIL,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#1e293b;padding:24px 32px">
          <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
               alt="Elevate for Humanity" height="48" style="display:block" />
        </div>

        <div style="padding:32px">
          <h2 style="margin:0 0 8px;font-size:20px">You're enrolled in ${courseTitle}</h2>
          <p style="color:#475569;margin:0 0 24px">
            Hi ${studentName}, your enrollment in <strong>${courseTitle}</strong> through
            <strong>${partnerName}</strong> is confirmed as part of your
            <strong>${programTitle}</strong> program.
          </p>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px">
            <p style="margin:0 0 12px;font-weight:600;font-size:14px;color:#0f172a">
              Your login information
            </p>
            <pre style="margin:0;font-size:13px;color:#334155;white-space:pre-wrap;font-family:monospace">${loginInstructions}</pre>
          </div>

          <a href="${partnerUrl}"
             style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;
                    padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
            Go to ${partnerName} →
          </a>

          <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0" />

          <h3 style="font-size:15px;margin:0 0 12px">What happens next</h3>
          <ol style="color:#475569;font-size:14px;padding-left:20px;margin:0 0 24px">
            <li style="margin-bottom:8px">Log in to ${partnerName} using the credentials above.</li>
            <li style="margin-bottom:8px">Complete the course at your own pace.</li>
            <li style="margin-bottom:8px">Download your completion certificate or DOL wallet card.</li>
            <li style="margin-bottom:8px">
              Upload it in your
              <a href="${SITE_URL}/learner/dashboard" style="color:#dc2626">Elevate dashboard</a>
              to unlock your next module.
            </li>
            <li>Staff will verify your credential within 1–2 business days.</li>
          </ol>

          <p style="font-size:13px;color:#94a3b8;margin:0">
            Questions? Reply to this email or call us at 317-314-3757.<br />
            Elevate for Humanity · Indianapolis, IN
          </p>
        </div>
      </div>
    `,
    text: `Hi ${studentName},\n\nYou're enrolled in ${courseTitle} through ${partnerName}.\n\nLogin information:\n${loginInstructions}\n\nGo to: ${partnerUrl}\n\nAfter completing the course, upload your certificate in your Elevate dashboard to advance.\n\nQuestions? Call 317-314-3757.`,
  });
}

interface ExternalCourseApprovedEmailParams {
  to: string;
  studentName: string;
  courseTitle: string;
  programTitle: string;
  dashboardUrl?: string;
}

/**
 * Sent to the student when staff approves their uploaded credential.
 */
export async function sendExternalCourseApprovedEmail(params: ExternalCourseApprovedEmailParams) {
  const {
    to, studentName, courseTitle, programTitle,
    dashboardUrl = `${SITE_URL}/learner/dashboard`,
  } = params;

  return sendEmail({
    to,
    subject: `Credential verified — ${courseTitle}`,
    replyTo: ADMIN_EMAIL,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#1e293b;padding:24px 32px">
          <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
               alt="Elevate for Humanity" height="48" style="display:block" />
        </div>

        <div style="padding:32px">
          <h2 style="margin:0 0 8px;font-size:20px;color:#16a34a">✓ Credential Verified</h2>
          <p style="color:#475569;margin:0 0 24px">
            Hi ${studentName}, your <strong>${courseTitle}</strong> credential has been
            verified by our staff. You're cleared to advance in
            <strong>${programTitle}</strong>.
          </p>

          <a href="${dashboardUrl}"
             style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;
                    padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
            Continue your program →
          </a>

          <p style="font-size:13px;color:#94a3b8;margin:32px 0 0">
            Elevate for Humanity · Indianapolis, IN
          </p>
        </div>
      </div>
    `,
    text: `Hi ${studentName},\n\nYour ${courseTitle} credential has been verified. You're cleared to advance in ${programTitle}.\n\nContinue: ${dashboardUrl}`,
  });
}

interface AdminExternalCoursePurchaseAlertParams {
  courseTitle: string;
  partnerName: string;
  partnerUrl: string;
  studentName: string;
  studentEmail: string;
  programTitle: string;
  completionId: string; // external_course_completions.id — for admin to enter login creds
}

/**
 * Sent to Elevate staff when a sponsored external course purchase is triggered.
 * Staff purchases on the partner site, then enters login credentials in admin.
 */
export async function sendAdminExternalCoursePurchaseAlert(
  params: AdminExternalCoursePurchaseAlertParams,
) {
  const {
    courseTitle, partnerName, partnerUrl,
    studentName, studentEmail, programTitle, completionId,
  } = params;

  const adminUrl = `${SITE_URL}/admin/external-course-completions/${completionId}`;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `ACTION REQUIRED: Purchase ${courseTitle} for ${studentName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#1e293b;padding:24px 32px">
          <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
               alt="Elevate for Humanity" height="48" style="display:block" />
        </div>

        <div style="padding:32px">
          <h2 style="margin:0 0 8px;font-size:20px">External Course Purchase Required</h2>
          <p style="color:#475569;margin:0 0 24px">
            A sponsored student needs you to purchase an external course on their behalf.
          </p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#64748b;width:140px">Student</td>
                <td style="padding:8px 0;font-weight:600">${studentName} (${studentEmail})</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Program</td>
                <td style="padding:8px 0">${programTitle}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Course</td>
                <td style="padding:8px 0">${courseTitle}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Partner</td>
                <td style="padding:8px 0">${partnerName}</td></tr>
          </table>

          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <a href="${partnerUrl}"
               style="display:inline-block;background:#1e293b;color:#fff;text-decoration:none;
                      padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">
              Purchase on ${partnerName} →
            </a>
            <a href="${adminUrl}"
               style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;
                      padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">
              Enter Login Credentials →
            </a>
          </div>

          <p style="font-size:13px;color:#94a3b8;margin:24px 0 0">
            After purchasing, open the admin link above and paste the login credentials.
            The system will email them to the student automatically.
          </p>
        </div>
      </div>
    `,
    text: `Purchase ${courseTitle} for ${studentName} (${studentEmail}) on ${partnerName}: ${partnerUrl}\n\nThen enter login credentials at: ${adminUrl}`,
  });
}
