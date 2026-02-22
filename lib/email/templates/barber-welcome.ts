export interface BarberWelcomeEmailData {
  studentName: string;
  studentEmail: string;
  dashboardUrl: string;
}

export function getBarberWelcomeEmail(data: BarberWelcomeEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { studentName, studentEmail, dashboardUrl } = data;

  const subject =
    'Welcome to Barber Apprenticeship - Get Your FREE Certification';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Barber Apprenticeship</title>
</head>
<body style="font-family: 'Times New Roman', Times, serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to Barber Apprenticeship!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You're officially enrolled, ${studentName}!</p>
  </div>

  <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px; border-radius: 5px;">
    <h2 style="margin: 0 0 15px 0; color: #1e40af; font-size: 20px;">📚 Your Student Dashboard</h2>
    <p style="margin: 0 0 10px 0;">Access your training portal:</p>
    <a href="${dashboardUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Access Dashboard →</a>
    <p style="margin: 15px 0 0 0; font-size: 14px; color: #64748b;">Login with: ${studentEmail}</p>
  </div>

  <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 20px; margin-bottom: 30px; border-radius: 5px;">
    <h2 style="margin: 0 0 15px 0; color: #ea580c; font-size: 20px;">🎓 REQUIRED: FREE RISE Certification</h2>
    <p style="margin: 0 0 10px 0;">Complete the Milady RISE Client Well-Being & Safety Certification (normally $29.95, <strong>FREE for you</strong>).</p>

    <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p style="margin: 0 0 10px 0; font-weight: bold;">Step 1: Go to enrollment page</p>
      <a href="https://www.miladytraining.com/bundles/client-well-being-safety-certification" style="color: #3b82f6; word-break: break-all;">https://www.miladytraining.com/bundles/client-well-being-safety-certification</a>

      <p style="margin: 15px 0 10px 0; font-weight: bold;">Step 2: Click "Enroll Now"</p>
      <p style="margin: 0; font-size: 14px;">Create account with your email: ${studentEmail}</p>

      <p style="margin: 15px 0 10px 0; font-weight: bold;">Step 3: Enter promo code at checkout</p>
      <div style="background: #fef3c7; border: 2px dashed #f59e0b; padding: 10px; text-align: center; border-radius: 5px; margin: 10px 0;">
        <code style="font-size: 18px; font-weight: bold; color: #92400e;">efhcti-rise295</code>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #92400e;">⚠️ No spaces before or after the code</p>
      </div>

      <p style="margin: 15px 0 10px 0; font-weight: bold;">Step 4: Complete all 3 courses (FREE)</p>
      <ul style="margin: 5px 0; padding-left: 20px;">
        <li>Domestic Violence Awareness</li>
        <li>Human Trafficking Awareness</li>
        <li>Infection Control (2 hours)</li>
      </ul>

      <p style="margin: 15px 0 10px 0; font-weight: bold;">Step 5: Download your certificate</p>
    </div>

    <div style="background: #dcfce7; border: 1px solid #86efac; padding: 12px; border-radius: 5px; margin-top: 15px;">
      <p style="margin: 0; font-size: 14px; color: #166534;">
        🏆 <strong>BONUS:</strong> You're eligible for the $500 RISE Scholarship!<br>
        <span style="font-size: 13px;">10 students awarded twice per year (Spring & Fall)</span>
      </p>
    </div>
  </div>

  <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px; border-radius: 5px;">
    <h2 style="margin: 0 0 15px 0; color: #1e40af; font-size: 20px;">📱 Mobile App (Optional)</h2>
    <p style="margin: 0 0 15px 0;">Access your training on your phone:</p>

    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
      <a href="https://apps.apple.com/us/app/thinkific/id1471012001" style="display: inline-block; background: white; color: #1e40af; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; border: 2px solid #3b82f6; flex: 1; min-width: 200px; text-align: center;">
        📱 Download for iPhone
      </a>
      <a href="https://play.google.com/store/apps/details?id=com.thinkific.mobile" style="display: inline-block; background: white; color: #1e40af; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; border: 2px solid #3b82f6; flex: 1; min-width: 200px; text-align: center;">
        📱 Download for Android
      </a>
    </div>

    <div style="background: white; padding: 12px; border-radius: 5px; margin-top: 15px;">
      <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">How to login:</p>
      <ol style="margin: 5px 0; padding-left: 20px; font-size: 14px;">
        <li>Download Thinkific app</li>
        <li>Open app and tap "Login"</li>
        <li>Enter: <strong>miladytraining.com</strong></li>
        <li>Login with your Milady credentials</li>
      </ol>
    </div>
  </div>

  <div style="background: #f1f5f9; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
    <h2 style="margin: 0 0 15px 0; color: #334155; font-size: 20px;">🚀 Next Steps</h2>
    <ol style="margin: 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Login to your student dashboard</li>
      <li style="margin-bottom: 8px;">Complete RISE certification (required)</li>
      <li style="margin-bottom: 8px;">Download mobile app (optional)</li>
      <li style="margin-bottom: 8px;">Start your apprenticeship training</li>
    </ol>
  </div>

  <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; text-align: center;">
    <h3 style="margin: 0 0 10px 0; color: #334155; font-size: 18px;">💬 Need Help?</h3>
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

</body>
</html>
  `;

  const text = `
Welcome to Barber Apprenticeship!

Hi ${studentName},

Congratulations! You're officially enrolled in the Barber Apprenticeship Program.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 YOUR STUDENT DASHBOARD

Login: ${dashboardUrl}
Email: ${studentEmail}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎓 REQUIRED: FREE RISE CERTIFICATION

Complete the Milady RISE Client Well-Being & Safety Certification (normally $29.95, FREE for you).

STEP 1: Go to this page
https://www.miladytraining.com/bundles/client-well-being-safety-certification

STEP 2: Click "Enroll Now"
- Create account with your email: ${studentEmail}
- Or login if you have an account

STEP 3: At checkout, enter promo code
efhcti-rise295
⚠️ Important: No spaces before or after the code

STEP 4: Complete all 3 courses (FREE)
• Domestic Violence Awareness
• Human Trafficking Awareness
• Infection Control (2 hours)

STEP 5: Download your certificate

🏆 BONUS: You're eligible to apply for the $500 RISE Scholarship!
10 students awarded twice per year (Spring & Fall)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 MOBILE APP (OPTIONAL)

Access training on your phone:

iPhone/iPad:
https://apps.apple.com/us/app/thinkific/id1471012001

Android:
https://play.google.com/store/apps/details?id=com.thinkific.mobile

How to login:
1. Download Thinkific app
2. Open app and tap "Login"
3. Enter: miladytraining.com
4. Login with your Milady credentials

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 NEXT STEPS

1. Login to your student dashboard
2. Complete RISE certification (required)
3. Download mobile app (optional)
4. Start your apprenticeship training

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 NEED HELP?

Call: 317-314-3757
Email: info@elevateforhumanity.org

Welcome to your new career in barbering!

Elizabeth Greene, CEO
Elevate For Humanity Career & Training Institute
  `;

  return { subject, html, text };
}
