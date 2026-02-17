/**
 * Partner LMS Welcome Email Templates
 * Sent when a student is enrolled in an external LMS partner
 */

interface PartnerWelcomeData {
  studentName: string;
  providerName: string;
  providerType: string;
  enrollmentUrl?: string;
  promoCode?: string;
  loginInstructions?: string;
  contactEmail?: string;
  contactPhone?: string;
  programName?: string;
}

export function getPartnerWelcomeEmail(data: PartnerWelcomeData): { subject: string; html: string; text: string } {
  const subject = `Welcome to ${data.providerName} - Your Enrollment is Complete!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to ${data.providerName}!</h1>
  </div>

  <!-- Content -->
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">

    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${data.studentName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Great news! You've been successfully enrolled in <strong>${data.providerName}</strong>${data.programName ? ` as part of your <strong>${data.programName}</strong> program` : ''}.
    </p>

    ${data.enrollmentUrl ? `
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">🚀 Get Started</h2>
      <p style="margin-bottom: 15px;">Click the button below to access your courses:</p>
      <a href="${data.enrollmentUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Access ${data.providerName}</a>
    </div>
    ` : ''}

    ${data.promoCode ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #92400e; font-size: 18px;">💰 Your Promo Code</h3>
      <p style="margin-bottom: 10px; color: #78350f;">Use this code during enrollment:</p>
      <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
        <code style="font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px;">${data.promoCode}</code>
      </div>
    </div>
    ` : ''}

    ${data.loginInstructions ? `
    <div style="background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="margin-top: 0; color: #3730a3; font-size: 18px;">📝 Login Instructions</h3>
      <p style="color: #4338ca; margin: 0;">${data.loginInstructions}</p>
    </div>
    ` : ''}

    <div style="margin: 30px 0;">
      <h3 style="color: #1f2937; font-size: 18px;">What's Next?</h3>
      <ol style="color: #4b5563; padding-left: 20px;">
        <li style="margin-bottom: 10px;">Access the ${data.providerName} platform using the link above</li>
        <li style="margin-bottom: 10px;">Complete your profile and account setup</li>
        <li style="margin-bottom: 10px;">Browse available courses and certifications</li>
        <li style="margin-bottom: 10px;">Start learning and earning credentials!</li>
      </ol>
    </div>

    ${data.contactEmail || data.contactPhone ? `
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="margin-top: 0; color: #1f2937; font-size: 18px;">💬 Need Help?</h3>
      <p style="color: #4b5563; margin-bottom: 10px;">If you have questions or need assistance:</p>
      ${data.contactEmail ? `<p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${data.contactEmail}" style="color: #667eea;">${data.contactEmail}</a></p>` : ''}
      ${data.contactPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${data.contactPhone}</p>` : ''}
    </div>
    ` : ''}

    <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        This enrollment was created through <strong>Elevate for Humanity</strong>. If you didn't request this enrollment, please contact us immediately.
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 30px 20px; color: #9ca3af; font-size: 14px;">
    <p style="margin: 0 0 10px 0;">
      <strong>Elevate for Humanity</strong><br>
      Empowering Communities Through Education
    </p>
    <p style="margin: 0;">
      <a href="https://www.elevateforhumanity.org" style="color: #667eea; text-decoration: none;">Visit Our Website</a> |
      <a href="https://www.elevateforhumanity.org/support" style="color: #667eea; text-decoration: none;">Get Support</a>
    </p>
  </div>

</body>
</html>
  `;

  const text = `
Welcome to ${data.providerName}!

Hi ${data.studentName},

Great news! You've been successfully enrolled in ${data.providerName}${data.programName ? ` as part of your ${data.programName} program` : ''}.

${data.enrollmentUrl ? `
GET STARTED
Access your courses here: ${data.enrollmentUrl}
` : ''}

${data.promoCode ? `
YOUR PROMO CODE
Use this code during enrollment: ${data.promoCode}
` : ''}

${data.loginInstructions ? `
LOGIN INSTRUCTIONS
${data.loginInstructions}
` : ''}

WHAT'S NEXT?
1. Access the ${data.providerName} platform using the link above
2. Complete your profile and account setup
3. Browse available courses and certifications
4. Start learning and earning credentials!

${data.contactEmail || data.contactPhone ? `
NEED HELP?
${data.contactEmail ? `Email: ${data.contactEmail}` : ''}
${data.contactPhone ? `Phone: ${data.contactPhone}` : ''}
` : ''}

---
This enrollment was created through Elevate for Humanity.
If you didn't request this enrollment, please contact us immediately.

Elevate for Humanity
https://www.elevateforhumanity.org
  `;

  return { subject, html, text };
}

export function getPartnerCompletionEmail(data: {
  studentName: string;
  providerName: string;
  courseName?: string;
  certificateUrl?: string;
  completedAt: string;
}): { subject: string; html: string; text: string } {
  const subject = `🎓 Congratulations! You've Completed ${data.courseName || data.providerName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 32px;">🎓 Congratulations!</h1>
  </div>

  <!-- Content -->
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">

    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${data.studentName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      You did it! You've successfully completed <strong>${data.courseName || data.providerName}</strong>.
    </p>

    <div style="background: #ecfdf5; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
      <h2 style="margin: 0; color: #065f46; font-size: 24px;">Course Completed!</h2>
      <p style="color: #047857; margin: 10px 0 0 0;">Completed on ${new Date(data.completedAt).toLocaleDateString()}</p>
    </div>

    ${data.certificateUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.certificateUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Download Your Certificate</a>
    </div>
    ` : ''}

    <div style="margin: 30px 0;">
      <h3 style="color: #1f2937; font-size: 18px;">What's Next?</h3>
      <ul style="color: #4b5563; padding-left: 20px;">
        <li style="margin-bottom: 10px;">Add this certification to your resume and LinkedIn profile</li>
        <li style="margin-bottom: 10px;">Share your achievement with your network</li>
        <li style="margin-bottom: 10px;">Explore additional courses to continue your learning journey</li>
        <li style="margin-bottom: 10px;">Apply your new skills in real-world projects</li>
      </ul>
    </div>

    <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb; text-align: center;">
      <p style="color: #6b7280; font-size: 16px; margin: 0;">
        Keep up the great work! We're proud of your achievement.
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 30px 20px; color: #9ca3af; font-size: 14px;">
    <p style="margin: 0 0 10px 0;">
      <strong>Elevate for Humanity</strong><br>
      Empowering Communities Through Education
    </p>
  </div>

</body>
</html>
  `;

  const text = `
🎓 Congratulations!

Hi ${data.studentName},

You did it! You've successfully completed ${data.courseName || data.providerName}.

COURSE COMPLETED!
Completed on ${new Date(data.completedAt).toLocaleDateString()}

${data.certificateUrl ? `
DOWNLOAD YOUR CERTIFICATE
${data.certificateUrl}
` : ''}

WHAT'S NEXT?
- Add this certification to your resume and LinkedIn profile
- Share your achievement with your network
- Explore additional courses to continue your learning journey
- Apply your new skills in real-world projects

Keep up the great work! We're proud of your achievement.

---
Elevate for Humanity
https://www.elevateforhumanity.org
  `;

  return { subject, html, text };
}

export function getPartnerMilestoneEmail(data: {
  studentName: string;
  providerName: string;
  courseName: string;
  milestone: string;
  progress: number;
}): { subject: string; html: string; text: string } {
  const subject = `🎯 Milestone Reached: ${data.milestone} in ${data.courseName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎯 Milestone Reached!</h1>
  </div>

  <!-- Content -->
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">

    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${data.studentName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      You're making great progress in <strong>${data.courseName}</strong>!
    </p>

    <div style="background: #fef3c7; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">⭐</div>
      <h2 style="margin: 0; color: #92400e; font-size: 24px;">${data.milestone}</h2>
      <p style="color: #78350f; margin: 10px 0 0 0;">You're ${data.progress}% complete!</p>
    </div>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <div style="background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${data.progress}%; transition: width 0.3s ease;"></div>
      </div>
      <p style="text-align: center; margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">${data.progress}% Complete</p>
    </div>

    <div style="margin: 30px 0;">
      <h3 style="color: #1f2937; font-size: 18px;">Keep Going!</h3>
      <p style="color: #4b5563;">You're doing great! Keep up the momentum and you'll reach your goal in no time.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.elevateforhumanity.org/lms/courses" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Continue Learning</a>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 30px 20px; color: #9ca3af; font-size: 14px;">
    <p style="margin: 0 0 10px 0;">
      <strong>Elevate for Humanity</strong><br>
      Empowering Communities Through Education
    </p>
  </div>

</body>
</html>
  `;

  const text = `
🎯 Milestone Reached!

Hi ${data.studentName},

You're making great progress in ${data.courseName}!

${data.milestone}
You're ${data.progress}% complete!

Keep going! You're doing great! Keep up the momentum and you'll reach your goal in no time.

Continue Learning: https://www.elevateforhumanity.org/lms/courses

---
Elevate for Humanity
https://www.elevateforhumanity.org
  `;

  return { subject, html, text };
}
