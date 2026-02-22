/**
 * Barber Apprenticeship Welcome Email - Student Paid Version
 * 
 * Sent when student pays for barber apprenticeship program.
 * Includes Milady enrollment link for related instruction.
 * 
 * IMPORTANT: This program provides apprenticeship sponsorship, oversight,
 * and related instruction ONLY. It does NOT provide barber school training
 * or state licensure hours.
 */

export interface BarberWelcomeEmailData {
  studentName: string;
  studentEmail: string;
  dashboardUrl: string;
  miladyEnrollmentUrl: string;
  requiredHours: number;
  transferHours?: number;
  rapidsPending?: boolean;
}

export function getBarberWelcomePaidEmail(data: BarberWelcomeEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { 
    studentName, 
    studentEmail, 
    dashboardUrl,
    miladyEnrollmentUrl,
    requiredHours = 1500,
    transferHours = 0,
    rapidsPending = true,
  } = data;

  const remainingHours = requiredHours - transferHours;

  const subject = 'Welcome to Barber Apprenticeship - Complete Your Milady Enrollment';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Barber Apprenticeship</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">

  <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 26px;">Welcome to Barber Apprenticeship!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Congratulations, ${studentName}!</p>
  </div>

  <div style="background: white; padding: 25px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

    <!-- URGENT: Milady Enrollment -->
    <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h2 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px;">⚠️ ACTION REQUIRED: Complete Milady Enrollment</h2>
      <p style="margin: 0 0 15px 0; color: #78350f;">Your apprenticeship includes Milady theory training. Click below to complete your Milady enrollment:</p>
      
      <a href="${miladyEnrollmentUrl}" style="display: block; background: #f59e0b; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center; font-size: 16px;">
        Complete Milady Enrollment →
      </a>
      
      <p style="margin: 15px 0 0 0; font-size: 13px; color: #92400e;">
        <strong>Use this email to register:</strong> ${studentEmail}
      </p>
    </div>

    <!-- Hour Requirements -->
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
      <h2 style="margin: 0 0 12px 0; color: #1e40af; font-size: 18px;">📊 Your Hour Requirements</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #334155;">Total Required (Indiana):</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e40af;">${requiredHours} hours</td>
        </tr>
        ${transferHours > 0 ? `
        <tr>
          <td style="padding: 8px 0; color: #334155;">Transfer Credits:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #059669;">-${transferHours} hours</td>
        </tr>
        <tr style="border-top: 2px solid #3b82f6;">
          <td style="padding: 12px 0; color: #1e40af; font-weight: bold;">Hours You Need:</td>
          <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #1e40af; font-size: 18px;">${remainingHours} hours</td>
        </tr>
        ` : ''}
      </table>

      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #bfdbfe;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Hour Breakdown:</strong></p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569;">
          <li>RTI (Theory via Milady): ~10% of hours</li>
          <li>OJT (Hands-on at Shop): ~90% of hours</li>
        </ul>
      </div>
    </div>

    <!-- Student Dashboard -->
    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
      <h2 style="margin: 0 0 12px 0; color: #166534; font-size: 18px;">📚 Your Student Dashboard</h2>
      <p style="margin: 0 0 15px 0; color: #166534;">Log your training hours and track progress:</p>
      
      <a href="${dashboardUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Access Dashboard →
      </a>
      
      <p style="margin: 15px 0 0 0; font-size: 13px; color: #166534;">
        Login with: ${studentEmail}
      </p>
    </div>

    <!-- RAPIDS Status -->
    ${rapidsPending ? `
    <div style="background: #faf5ff; border-left: 4px solid #a855f7; padding: 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
      <h2 style="margin: 0 0 12px 0; color: #7e22ce; font-size: 18px;">📋 DOL RAPIDS Registration</h2>
      <p style="margin: 0; color: #6b21a8; font-size: 14px;">
        Your apprenticeship is being registered with the U.S. Department of Labor RAPIDS system. 
        You'll receive confirmation within 5-7 business days.
      </p>
    </div>
    ` : ''}

    <!-- Next Steps -->
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h2 style="margin: 0 0 15px 0; color: #334155; font-size: 18px;">🚀 Your Next Steps</h2>
      <ol style="margin: 0; padding-left: 20px; color: #475569;">
        <li style="margin-bottom: 10px;"><strong>Complete Milady enrollment</strong> (link above) - Required for theory training</li>
        <li style="margin-bottom: 10px;"><strong>Login to your dashboard</strong> - Set up your profile</li>
        <li style="margin-bottom: 10px;"><strong>Start logging hours</strong> - Track RTI and OJT hours</li>
        <li style="margin-bottom: 10px;"><strong>Begin training</strong> - Work with your shop supervisor</li>
      </ol>
    </div>

    <!-- Indiana Requirements -->
    <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h2 style="margin: 0 0 12px 0; color: #c2410c; font-size: 16px;">📜 Indiana State Board Requirements</h2>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #9a3412;">
        <li>Complete ${remainingHours} apprenticeship hours</li>
        <li>Pass Milady theory coursework</li>
        <li>Complete practical skills training at licensed shop</li>
        <li>Pass Indiana State Board written and practical exams</li>
        <li>Apply for barber license through IPLA</li>
      </ul>
    </div>

    <!-- Contact -->
    <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; text-align: center;">
      <h3 style="margin: 0 0 10px 0; color: #334155; font-size: 16px;">Need Help?</h3>
      <p style="margin: 0 0 5px 0;">
        <strong>Call:</strong> <a href="tel:317-314-3757" style="color: #3b82f6; text-decoration: none;">317-314-3757</a>
      </p>
      <p style="margin: 0 0 20px 0;">
        <strong>Email:</strong> <a href="mailto:info@elevateforhumanity.org" style="color: #3b82f6; text-decoration: none;">info@elevateforhumanity.org</a>
      </p>
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        Welcome to your new career in barbering!<br>
        <strong>Elizabeth Greene, CEO</strong><br>
        Elevate For Humanity Career & Training Institute
      </p>
    </div>

  </div>

</body>
</html>
  `;

  const text = `
WELCOME TO BARBER APPRENTICESHIP!

Hi ${studentName},

Congratulations! You're officially enrolled in the Barber Apprenticeship Program.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ACTION REQUIRED: COMPLETE MILADY ENROLLMENT

Your apprenticeship includes Milady theory training. Complete your enrollment here:
${miladyEnrollmentUrl}

Use this email to register: ${studentEmail}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 YOUR HOUR REQUIREMENTS

Total Required (Indiana): ${requiredHours} hours
${transferHours > 0 ? `Transfer Credits: -${transferHours} hours
Hours You Need: ${remainingHours} hours` : ''}

Hour Breakdown:
• RTI (Theory via Milady): ~10% of hours
• OJT (Hands-on at Shop): ~90% of hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 YOUR STUDENT DASHBOARD

Log your training hours and track progress:
${dashboardUrl}

Login with: ${studentEmail}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 YOUR NEXT STEPS

1. Complete Milady enrollment (link above) - Required for theory training
2. Login to your dashboard - Set up your profile
3. Start logging hours - Track RTI and OJT hours
4. Begin training - Work with your shop supervisor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📜 INDIANA STATE BOARD REQUIREMENTS

• Complete ${remainingHours} apprenticeship hours
• Pass Milady theory coursework
• Complete practical skills training at licensed shop
• Pass Indiana State Board written and practical exams
• Apply for barber license through IPLA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEED HELP?

Call: 317-314-3757
Email: info@elevateforhumanity.org

Welcome to your new career in barbering!

Elizabeth Greene, CEO
Elevate For Humanity Career & Training Institute
  `;

  return { subject, html, text };
}
