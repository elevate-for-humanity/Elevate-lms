// Elevate Institutional Email Template System
// All outbound emails use the institutional header with logo,
// professional typography, and consistent signature block.

const ORG_NAME = 'Elevate for Humanity';
const ORG_OPERATOR = '2Exclusive LLC-S';
const ORG_WEBSITE = 'www.elevateforhumanity.org';
const ORG_EMAIL = 'info@elevateforhumanity.org';
const ORG_PHONE = '(317) 314-3757';
const ORG_LOGO = 'https://www.elevateforhumanity.org/images/logo.png';
const ORG_TAGLINE = 'Workforce Development & Career Training';

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #334155;
`;

const buttonStyle = `
  display: inline-block;
  padding: 12px 28px;
  background: #1e40af;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  margin: 16px 0;
`;

function wrapEmail(subject: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${subject}</title></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
<div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">
  <div style="background-color: #ffffff; border-radius: 8px 8px 0 0; padding: 24px 32px; border-bottom: 3px solid #1e3a5f;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        <td style="vertical-align: middle;"><img src="${ORG_LOGO}" alt="${ORG_NAME}" width="140" height="42" style="display: block; height: 42px; width: auto;" /></td>
        <td style="vertical-align: middle; text-align: right;"><span style="font-size: 11px; color: #64748b; line-height: 1.4;">${ORG_TAGLINE}<br />${ORG_WEBSITE}</span></td>
      </tr>
    </table>
  </div>
  <div style="background-color: #ffffff; padding: 32px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
    ${bodyHtml}
  </div>
  <div style="background-color: #f1f5f9; border-radius: 0 0 8px 8px; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
    <p style="margin: 0; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
      ${ORG_NAME} | Operated by ${ORG_OPERATOR}<br />
      ${ORG_EMAIL} | ${ORG_PHONE}<br />
      <a href="https://${ORG_WEBSITE}" style="color: #64748b; text-decoration: underline;">${ORG_WEBSITE}</a>
    </p>
  </div>
</div>
</body>
</html>`;
}

function signatureBlock(senderName?: string, senderTitle?: string): string {
  return `
    <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 14px; color: #334155; font-weight: 600;">${senderName || ORG_NAME}</p>
      ${senderTitle ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">${senderTitle}</p>` : ''}
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${ORG_NAME}</p>
      <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">${ORG_EMAIL} | ${ORG_PHONE}</p>
      <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">${ORG_WEBSITE}</p>
    </div>`;
}

export const emailTemplates = {
  // Welcome email
  welcome: (data: { name: string; loginUrl: string }) => ({
    subject: 'Welcome to Elevate for Humanity',
    html: wrapEmail('Welcome to Elevate for Humanity', `
          <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">Dear ${data.name},</p>
          <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">Your account has been created. You now have access to the Elevate for Humanity training platform.</p>

          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px; font-weight: 700;">Next Steps</h3>
            <ol style="color: #334155; padding-left: 20px; font-size: 14px; line-height: 1.8; margin: 0;">
              <li>Complete your profile</li>
              <li>Browse available training programs</li>
              <li>Check your WIOA eligibility</li>
              <li>Connect with a career advisor</li>
            </ol>
          </div>

          <div style="text-align: center;">
            <a href="${data.loginUrl}" style="${buttonStyle}">
              Get Started →
            </a>
          </div>

          </div>

          <div style="text-align: left; margin-top: 16px;">
            <a href="${data.loginUrl}" style="${buttonStyle}">Access Your Dashboard</a>
          </div>

          ${signatureBlock()}
    `),
    text: `Dear ${data.name},\n\nYour account has been created. You now have access to the Elevate for Humanity training platform.\n\nNext Steps:\n1. Complete your profile\n2. Browse available training programs\n3. Check your WIOA eligibility\n4. Connect with a career advisor\n\nAccess your dashboard: ${data.loginUrl}\n\n${ORG_NAME}\n${ORG_EMAIL} | ${ORG_PHONE}\n${ORG_WEBSITE}`,
  }),

  // Course enrollment
  courseEnrollment: (data: { name: string; courseName: string; startDate: string; courseUrl: string }) => ({
    subject: `Enrollment Confirmed — ${data.courseName}`,
    html: wrapEmail(`Enrollment Confirmed — ${data.courseName}`, `
          <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">Dear ${data.name},</p>
          <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">Your enrollment in <strong>${data.courseName}</strong> has been confirmed.</p>

          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #334155; font-size: 14px;"><strong>Start Date:</strong> ${data.startDate}</p>
          </div>

          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px; font-weight: 700;">Next Steps</h3>
            <ol style="color: #334155; padding-left: 20px; font-size: 14px; line-height: 1.8; margin: 0;">
              <li>Access your course materials</li>
              <li>Complete the orientation module</li>
              <li>Join your cohort study group</li>
              <li>Begin coursework</li>
            </ol>
          </div>

          <a href="${data.courseUrl}" style="${buttonStyle}">Access Course</a>

          ${signatureBlock()}
    `),
    text: `Dear ${data.name},\n\nYour enrollment in ${data.courseName} has been confirmed.\n\nStart Date: ${data.startDate}\n\nNext Steps:\n1. Access your course materials\n2. Complete the orientation module\n3. Join your cohort study group\n4. Begin coursework\n\nAccess course: ${data.courseUrl}\n\n${ORG_NAME}\n${ORG_EMAIL} | ${ORG_PHONE}\n${ORG_WEBSITE}`,
  }),

  // Assignment due reminder
  assignmentReminder: (data: { name: string; assignmentName: string; courseName: string; dueDate: string; assignmentUrl: string }) => ({
    subject: `Assignment Reminder — ${data.assignmentName}`,
    html: wrapEmail(`Assignment Reminder — ${data.assignmentName}`, `
      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">Dear ${data.name},</p>
      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">This is a reminder about an upcoming assignment deadline.</p>
      <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 6px 0; font-size: 14px; color: #334155;"><strong>Assignment:</strong> ${data.assignmentName}</p>
        <p style="margin: 0 0 6px 0; font-size: 14px; color: #334155;"><strong>Course:</strong> ${data.courseName}</p>
        <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Due:</strong> ${data.dueDate}</p>
      </div>
      <a href="${data.assignmentUrl}" style="${buttonStyle}">View Assignment</a>
      ${signatureBlock()}
    `),
    text: `Dear ${data.name},\n\nReminder: ${data.assignmentName} for ${data.courseName} is due ${data.dueDate}.\n\nView assignment: ${data.assignmentUrl}\n\n${ORG_NAME}\n${ORG_EMAIL} | ${ORG_PHONE}`,
  }),

  // Certificate issued
  certificateIssued: (data: { name: string; courseName: string; certificateUrl: string; linkedInUrl: string }) => ({
    subject: `Certificate Issued — ${data.courseName}`,
    html: wrapEmail(`Certificate Issued — ${data.courseName}`, `
      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">Dear ${data.name},</p>
      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">Congratulations on completing <strong>${data.courseName}</strong>. Your certificate is now available for download.</p>
      <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; font-weight: 600;">Your certificate is ready</p>
        <a href="${data.certificateUrl}" style="${buttonStyle}">Download Certificate</a>
      </div>
      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">You may also share this credential on LinkedIn to demonstrate your qualifications to employers.</p>
      <a href="${data.linkedInUrl}" style="${buttonStyle} background: #0077b5;">Share on LinkedIn</a>
      ${signatureBlock()}
    `),
    text: `Dear ${data.name},\n\nCongratulations on completing ${data.courseName}. Your certificate is available at: ${data.certificateUrl}\n\n${ORG_NAME}\n${ORG_EMAIL} | ${ORG_PHONE}`,
  }),

  // Achievement unlocked
  achievementUnlocked: (data: { name: string; achievementName: string; achievementDescription: string; points: number; achievementsUrl: string }) => ({
    subject: `Achievement Earned — ${data.achievementName}`,
    html: wrapEmail(`Achievement Earned — ${data.achievementName}`, `
      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">Dear ${data.name},</p>
      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">You have earned a new achievement in your training program.</p>
      <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
        <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px;">${data.achievementName}</h3>
        <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px;">${data.achievementDescription}</p>
        <span style="display: inline-block; padding: 6px 16px; background: #f1f5f9; color: #334155; border-radius: 16px; font-weight: 600; font-size: 14px;">+${data.points} Points</span>
      </div>
      <a href="${data.achievementsUrl}" style="${buttonStyle}">View Achievements</a>
      ${signatureBlock()}
    `),
    text: `Dear ${data.name},\n\nYou earned the ${data.achievementName} achievement (+${data.points} points).\n\nView achievements: ${data.achievementsUrl}\n\n${ORG_NAME}\n${ORG_EMAIL} | ${ORG_PHONE}`,
  }),

  // Job placement notification
  jobPlacement: (data: { name: string; jobTitle: string; company: string; salary: string; startDate: string }) => ({
    subject: `Employment Placement Confirmation — ${data.jobTitle}`,
    html: wrapEmail(`Employment Placement Confirmation`, `
      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">Dear ${data.name},</p>
      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">Congratulations on your employment placement. Below are the details of your new position.</p>
      <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 6px 0; font-size: 14px; color: #334155;"><strong>Position:</strong> ${data.jobTitle}</p>
        <p style="margin: 0 0 6px 0; font-size: 14px; color: #334155;"><strong>Employer:</strong> ${data.company}</p>
        <p style="margin: 0 0 6px 0; font-size: 14px; color: #334155;"><strong>Compensation:</strong> ${data.salary}</p>
        <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Start Date:</strong> ${data.startDate}</p>
      </div>
      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">We encourage you to stay connected through our alumni network. Your experience can help guide future participants.</p>
      ${signatureBlock()}
    `),
    text: `Dear ${data.name},\n\nCongratulations on your placement as ${data.jobTitle} at ${data.company}.\nCompensation: ${data.salary}\nStart Date: ${data.startDate}\n\n${ORG_NAME}\n${ORG_EMAIL} | ${ORG_PHONE}`,
  }),

  // Weekly progress report
  weeklyProgress: (data: { name: string; coursesInProgress: number; lessonsCompleted: number; quizScore: number; studyStreak: number; dashboardUrl: string }) => ({
    subject: `Weekly Progress Report`,
    html: wrapEmail(`Weekly Progress Report`, `
      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">Dear ${data.name},</p>
      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">Below is a summary of your training activity for the past week.</p>
      <table width="100%" cellpadding="0" cellspacing="8" style="margin: 16px 0;">
        <tr>
          <td style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; text-align: center; width: 50%;"><div style="font-size: 28px; font-weight: bold; color: #1e293b;">${data.coursesInProgress}</div><div style="font-size: 12px; color: #64748b;">Courses Active</div></td>
          <td style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; text-align: center; width: 50%;"><div style="font-size: 28px; font-weight: bold; color: #1e293b;">${data.lessonsCompleted}</div><div style="font-size: 12px; color: #64748b;">Lessons Completed</div></td>
        </tr>
        <tr>
          <td style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; text-align: center;"><div style="font-size: 28px; font-weight: bold; color: #1e293b;">${data.quizScore}%</div><div style="font-size: 12px; color: #64748b;">Avg Quiz Score</div></td>
          <td style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; text-align: center;"><div style="font-size: 28px; font-weight: bold; color: #1e293b;">${data.studyStreak}</div><div style="font-size: 12px; color: #64748b;">Day Streak</div></td>
        </tr>
      </table>
      <a href="${data.dashboardUrl}" style="${buttonStyle}">View Dashboard</a>
      ${signatureBlock()}
    `),
    text: `Dear ${data.name},\n\nWeekly Progress:\n- Courses active: ${data.coursesInProgress}\n- Lessons completed: ${data.lessonsCompleted}\n- Avg quiz score: ${data.quizScore}%\n- Day streak: ${data.studyStreak}\n\nView dashboard: ${data.dashboardUrl}\n\n${ORG_NAME}\n${ORG_EMAIL} | ${ORG_PHONE}`,
  }),
};

export default emailTemplates;
