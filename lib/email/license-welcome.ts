/**
 * License Welcome Email
 * Sent after successful license purchase/subscription activation
 */
import { sendEmail } from './service';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface LicenseWelcomeEmailParams {
  email: string;
  planName: string;
  tenantId?: string | null;
  dashboardUrl: string;
}

export async function sendLicenseWelcomeEmail(params: LicenseWelcomeEmailParams): Promise<boolean> {
  const { email, planName, tenantId, dashboardUrl } = params;

  const planDisplayName = planName.charAt(0).toUpperCase() + planName.slice(1);
  const features = getPlanFeatures(planName);

  const html = `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1e293b">
  <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px">
    <p style="margin:0;color:#fff;font-size:22px;font-weight:700">${PLATFORM_DEFAULTS.orgName}</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Workforce Technology Platform</p>
  </div>
  
  <div style="padding:40px 32px">
    <h1 style="margin:0 0 8px;font-size:26px;color:#1e293b">Welcome to the Platform!</h1>
    <p style="color:#475569;line-height:1.7;margin:0 0 24px">
      Your <strong>${planDisplayName} Plan</strong> is now active. Your workforce platform is ready to use.
    </p>
    
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;border:1px solid #e2e8f0">
      <h2 style="margin:0 0 16px;font-size:18px;color:#1e293b">Your ${planDisplayName} Plan Includes:</h2>
      <ul style="margin:0;padding:0;list-style:none">
        ${features.map(f => `
          <li style="display:flex;align-items:center;gap:10px;padding:8px 0;color:#475569">
            <span style="color:#22c55e;font-size:18px">✓</span>
            ${f}
          </li>
        `).join('')}
      </ul>
    </div>
    
    <div style="background:#eff6ff;border-radius:12px;padding:24px;margin:0 0 32px;border:1px solid #bfdbfe">
      <h2 style="margin:0 0 12px;font-size:18px;color:#1e40af">Your Next Steps:</h2>
      <ol style="margin:0;padding-left:20px;color:#475569;line-height:2">
        <li><strong>Access your dashboard</strong> — Configure your organization</li>
        <li><strong>Add your team</strong> — Invite administrators and instructors</li>
        <li><strong>Set up your programs</strong> — Add courses and curriculum</li>
        <li><strong>Connect your domain</strong> — White-label your platform</li>
      </ol>
    </div>
    
    <a href="${dashboardUrl}"
       style="display:inline-block;background:#2563eb;color:#fff;font-weight:700;padding:16px 32px;border-radius:10px;text-decoration:none;font-size:16px;margin:0 0 24px">
      Access Your Dashboard →
    </a>
    
    <div style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0;margin:0 0 24px">
      <p style="margin:0 0 8px;font-size:14px;color:#64748b">
        <strong>Need help getting started?</strong>
      </p>
      <p style="margin:0;font-size:14px;color:#64748b">
        Visit our <a href="${PLATFORM_DEFAULTS.siteUrl}/support" style="color:#2563eb">Help Center</a> or reply to this email for onboarding support.
      </p>
    </div>
    
    <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6">
      Questions about your plan or billing? Contact us at 
      <a href="mailto:${PLATFORM_DEFAULTS.supportEmail}" style="color:#2563eb">${PLATFORM_DEFAULTS.supportEmail}</a>
      or call <strong>${PLATFORM_DEFAULTS.supportPhone}</strong>
    </p>
  </div>
</div>`;

  return sendEmail({
    to: email,
    subject: `Your ${planDisplayName} Plan is Active — Welcome!`,
    html,
  });
}

function getPlanFeatures(planName: string): string[] {
  const baseFeatures = [
    'Core LMS Platform',
    'Course Creation Tools',
    'Student Enrollment Management',
    'Certification Tracking',
    'Basic Reporting',
  ];

  const planFeatures: Record<string, string[]> = {
    starter: [
      ...baseFeatures,
      'Up to 25 student accounts',
      'Email support',
    ],
    professional: [
      ...baseFeatures,
      'Up to 500 student accounts',
      'AI Features (Basic)',
      'Apprenticeship Management',
      'WIOA Compliance Tracking',
      'Employer Portal',
      'Custom Branding',
      'Priority Support',
    ],
    enterprise: [
      ...baseFeatures,
      'Unlimited student accounts',
      'AI Features (Advanced)',
      'Apprenticeship Management',
      'WIOA Compliance Tracking',
      'Employer Portal',
      'Host Shop Portal',
      'White-label Builder',
      'API Access',
      'SSO/SAML Integration',
      'Dedicated Account Manager',
      'Custom Integrations',
    ],
  };

  return planFeatures[planName] || planFeatures.starter;
}
