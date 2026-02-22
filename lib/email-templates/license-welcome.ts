/**
 * License Welcome Email Template
 * Sent after successful license purchase with implementation instructions
 */

export interface LicenseWelcomeEmailData {
  organizationName: string;
  contactName: string;
  email: string;
  licenseKey: string;
  licenseType: 'single' | 'school' | 'enterprise';
  tier: string;
  expiresAt: string;
  features: string[];
  repoUrl: string;
  maxDeployments: number;
  maxUsers: number;
}

export function generateLicenseWelcomeEmail(data: LicenseWelcomeEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const tierNames: Record<string, string> = {
    single: 'Core Platform',
    school: 'School / Training Provider',
    enterprise: 'Enterprise Solution',
  };

  const subject = `Your Elevate LMS License is Ready - ${tierNames[data.licenseType] || 'Platform License'}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                🎉 License Activated!
              </h1>
              <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">
                Welcome to Elevate for Humanity
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${data.contactName},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for purchasing the <strong>${tierNames[data.licenseType]}</strong> license for <strong>${data.organizationName}</strong>. Your platform is ready to deploy!
              </p>

              <!-- License Key Box -->
              <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
                  Your License Key
                </p>
                <p style="color: #10b981; font-family: 'Courier New', monospace; font-size: 18px; margin: 0; word-break: break-all;">
                  ${data.licenseKey}
                </p>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
                ⚠️ Save this key securely. You'll need it to validate your deployment and access updates.
              </p>

              <!-- License Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #111827; font-size: 16px; margin: 0 0 16px 0;">License Details</h3>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">License Type</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${tierNames[data.licenseType]}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Valid Until</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${new Date(data.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Deployments</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${data.maxDeployments === 999 ? 'Unlimited' : data.maxDeployments}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Max Users</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${data.maxUsers === 999999 ? 'Unlimited' : data.maxUsers.toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Quick Start Steps -->
              <h3 style="color: #111827; font-size: 18px; margin: 32px 0 16px 0;">🚀 Quick Start Guide</h3>
              
              <div style="border-left: 3px solid #059669; padding-left: 20px; margin: 16px 0;">
                <p style="color: #374151; font-size: 14px; margin: 0 0 12px 0;">
                  <strong>Step 1:</strong> Clone the repository<br>
                  <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px;">git clone ${data.repoUrl}</code>
                </p>
                <p style="color: #374151; font-size: 14px; margin: 0 0 12px 0;">
                  <strong>Step 2:</strong> Install dependencies<br>
                  <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px;">pnpm install</code>
                </p>
                <p style="color: #374151; font-size: 14px; margin: 0 0 12px 0;">
                  <strong>Step 3:</strong> Configure environment<br>
                  <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px;">cp .env.example .env.local</code>
                </p>
                <p style="color: #374151; font-size: 14px; margin: 0;">
                  <strong>Step 4:</strong> Start development server<br>
                  <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px;">pnpm dev</code>
                </p>
              </div>

              <!-- CTA Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.repoUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-right: 12px;">
                      Access Repository
                    </a>
                    <a href="https://www.elevateforhumanity.org/store/deployment" style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Deployment Guide
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Features Included -->
              <h3 style="color: #111827; font-size: 18px; margin: 32px 0 16px 0;">✅ Features Included</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${data.features.map(feature => `
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-size: 14px;">
                    <span style="color: #059669; margin-right: 8px;">✓</span>
                    ${formatFeatureName(feature)}
                  </td>
                </tr>
                `).join('')}
              </table>

              <!-- Support -->
              <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 32px 0;">
                <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 8px 0;">Need Help?</h4>
                <p style="color: #3b82f6; font-size: 14px; margin: 0;">
                  Schedule a free onboarding call with our team:<br>
                  <a href="https://www.elevateforhumanity.org/schedule?type=onboarding" style="color: #1e40af; font-weight: 600;">Book Onboarding Call</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
                Elevate for Humanity
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Questions? Reply to this email or contact <a href="mailto:info@elevateforhumanity.org" style="color: #059669;">info@elevateforhumanity.org</a>
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

  const text = `
License Activated - ${tierNames[data.licenseType]}

Hi ${data.contactName},

Thank you for purchasing the ${tierNames[data.licenseType]} license for ${data.organizationName}. Your platform is ready to deploy!

YOUR LICENSE KEY
================
${data.licenseKey}

⚠️ Save this key securely. You'll need it to validate your deployment and access updates.

LICENSE DETAILS
===============
License Type: ${tierNames[data.licenseType]}
Valid Until: ${new Date(data.expiresAt).toLocaleDateString()}
Deployments: ${data.maxDeployments === 999 ? 'Unlimited' : data.maxDeployments}
Max Users: ${data.maxUsers === 999999 ? 'Unlimited' : data.maxUsers.toLocaleString()}

QUICK START GUIDE
=================
1. Clone the repository: git clone ${data.repoUrl}
2. Install dependencies: pnpm install
3. Configure environment: cp .env.example .env.local
4. Start development server: pnpm dev

FEATURES INCLUDED
=================
${data.features.map(f => `✓ ${formatFeatureName(f)}`).join('\n')}

NEED HELP?
==========
Schedule a free onboarding call: https://www.elevateforhumanity.org/schedule?type=onboarding

Questions? Reply to this email or contact info@elevateforhumanity.org

---
Elevate for Humanity
`;

  return { subject, html, text };
}

function formatFeatureName(feature: string): string {
  const names: Record<string, string> = {
    'lms': 'Learning Management System',
    'enrollment': 'Enrollment & Intake',
    'admin': 'Admin Dashboard',
    'payments': 'Payment Processing',
    'partner-dashboard': 'Partner Dashboard',
    'case-management': 'Case Management',
    'employer-portal': 'Employer Portal',
    'compliance': 'Compliance & Reporting',
    'mobile-app': 'Mobile PWA',
    'ai-tutor': 'AI Tutor',
    'api-access': 'API Access',
    'white-label': 'White-Label Branding',
  };
  return names[feature] || feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
