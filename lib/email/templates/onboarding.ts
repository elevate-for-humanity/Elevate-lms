// Onboarding Welcome Email Template for Barber & Beauty Apprenticeships
// Sends to new apprentices after application submission and payment

export interface OnboardingEmailData {
  firstName: string;
  lastName: string;
  email: string;
  program: string;
  dashboardUrl: string;
  orientationUrl: string;
  handbookUrl: string;
  supportEmail: string;
  supportPhone: string;
}

export function getOnboardingEmailHtml(data: OnboardingEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Elevate - Your Apprenticeship Journey Begins!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 800;">
          🎉 Welcome to Elevate!
        </h1>
        <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">
          Your ${data.program} Apprenticeship Starts NOW
        </p>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <!-- Greeting -->
        <h2 style="color: #111827; font-size: 24px; margin: 0 0 20px;">
          Congratulations, ${data.firstName}!
        </h2>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          You're officially enrolled in Elevate for Humanity's <strong>${data.program}</strong> apprenticeship program. 
          You're about to start an exciting journey toward a rewarding career in the beauty industry!
        </p>

        <!-- Dashboard CTA -->
        <div style="background: #111827; border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center;">
          <h3 style="color: #ffffff; font-size: 20px; margin: 0 0 10px;">
            🚀 Your Dashboard is Ready!
          </h3>
          <p style="color: #9ca3af; font-size: 14px; margin: 0 0 20px;">
            Track your progress, access courses, and log your OJT hours
          </p>
          <a href="${data.dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: #000000; text-decoration: none; font-weight: 700; padding: 16px 32px; border-radius: 10px; font-size: 16px;">
            Go to My Dashboard →
          </a>
        </div>

        <!-- Next Steps -->
        <h3 style="color: #111827; font-size: 18px; margin: 0 0 20px;">
          📋 Your Next Steps:
        </h3>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
          <tr>
            <td width="50" style="padding: 10px 0;">
              <div style="width: 40px; height: 40px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #d97706;">
                1
              </div>
            </td>
            <td style="padding: 10px 0;">
              <strong style="color: #111827;">Watch Orientation Videos</strong>
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0;">
                Learn everything about your program in our video series
              </p>
              <a href="${data.orientationUrl}" style="color: #f59e0b; font-size: 14px;">
                Start Orientation →
              </a>
            </td>
          </tr>
          <tr>
            <td width="50" style="padding: 10px 0;">
              <div style="width: 40px; height: 40px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #d97706;">
                2
              </div>
            </td>
            <td style="padding: 10px 0;">
              <strong style="color: #111827;">Download Your Handbook</strong>
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0;">
                Everything you need to know about requirements and policies
              </p>
              <a href="${data.handbookUrl}" style="color: #f59e0b; font-size: 14px;">
                Download Handbook →
              </a>
            </td>
          </tr>
          <tr>
            <td width="50" style="padding: 10px 0;">
              <div style="width: 40px; height: 40px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #d97706;">
                3
              </div>
            </td>
            <td style="padding: 10px 0;">
              <strong style="color: #111827;">Connect with Your Host Shop</strong>
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0;">
                If you haven't already, find your host shop partner
              </p>
            </td>
          </tr>
          <tr>
            <td width="50" style="padding: 10px 0;">
              <div style="width: 40px; height: 40px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #d97706;">
                4
              </div>
            </td>
            <td style="padding: 10px 0;">
              <strong style="color: #111827;">Start Your First Course</strong>
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0;">
                Begin your Related Technical Instruction (RTI) coursework
              </p>
            </td>
          </tr>
        </table>

        <!-- Support Box -->
        <div style="background: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
          <h4 style="color: #111827; font-size: 16px; margin: 0 0 10px;">
            💬 Need Help? We're Here!
          </h4>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px;">
            Questions about your program? Our team is ready to help you succeed.
          </p>
          <a href="tel:${data.supportPhone.replace(/[^0-9]/g, '')}" style="color: #f59e0b; font-weight: 600;">
            📞 ${data.supportPhone}
          </a>
          <span style="color: #9ca3af; margin: 0 15px;">|</span>
          <a href="mailto:${data.supportEmail}" style="color: #f59e0b; font-weight: 600;">
            ✉️ ${data.supportEmail}
          </a>
        </div>

        <!-- Success Stats -->
        <div style="display: flex; justify-content: space-around; text-align: center; margin: 30px 0; padding: 20px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
          <div>
            <div style="font-size: 28px; font-weight: 800; color: #f59e0b;">500+</div>
            <div style="font-size: 12px; color: #6b7280;">Graduates</div>
          </div>
          <div>
            <div style="font-size: 28px; font-weight: 800; color: #f59e0b;">98%</div>
            <div style="font-size: 12px; color: #6b7280;">Pass Rate</div>
          </div>
          <div>
            <div style="font-size: 28px; font-weight: 800; color: #f59e0b;">$55K+</div>
            <div style="font-size: 12px; color: #6b7280;">Avg Earnings</div>
          </div>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #111827; padding: 30px; text-align: center;">
        <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px;">
          Elevate for Humanity Career & Technical Institute
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          DOL Registered Apprenticeship Sponsor | ETPL Listed
        </p>
        <div style="margin-top: 20px;">
          <a href="${data.dashboardUrl}" style="color: #f59e0b; text-decoration: none; font-size: 12px; margin: 0 10px;">
            Dashboard
          </a>
          <a href="${data.handbookUrl}" style="color: #f59e0b; text-decoration: none; font-size: 12px; margin: 0 10px;">
            Handbook
          </a>
          <a href="${data.supportEmail}" style="color: #f59e0b; text-decoration: none; font-size: 12px; margin: 0 10px;">
            Support
          </a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function getOnboardingEmailText(data: OnboardingEmailData): string {
  return `
WELCOME TO ELEVATE - YOUR ${data.program.toUpperCase()} APPRENTICESHIP STARTS NOW!

Congratulations, ${data.firstName}!

You're officially enrolled in Elevate for Humanity's ${data.program} apprenticeship program.

YOUR NEXT STEPS:

1. Go to Your Dashboard
   ${data.dashboardUrl}
   Track your progress, access courses, and log your OJT hours.

2. Watch Orientation Videos
   ${data.orientationUrl}
   Learn everything about your program in our video series.

3. Download Your Handbook
   ${data.handbookUrl}
   Everything you need to know about requirements and policies.

4. Start Your First Course
   Begin your Related Technical Instruction (RTI) coursework.

NEED HELP?
📞 ${data.supportPhone}
✉️ ${data.supportEmail}

---
Elevate for Humanity Career & Technical Institute
DOL Registered Apprenticeship Sponsor | ETPL Listed
`;
}

// Example usage:
// const emailHtml = getOnboardingEmailHtml({
//   firstName: 'John',
//   lastName: 'Smith',
//   email: 'john@example.com',
//   program: 'Barber Apprenticeship',
//   dashboardUrl: 'https://elevateforhumanity.org/dashboard',
//   orientationUrl: 'https://elevateforhumanity.org/orientation-video',
//   handbookUrl: 'https://elevateforhumanity.org/handbook',
//   supportEmail: 'support@elevateforhumanity.org',
//   supportPhone: '(317) 314-3757'
// });
