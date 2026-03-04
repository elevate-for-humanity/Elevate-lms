import { ORG } from '@/lib/documents/elevate-document-system';

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

  const subject = 'Barber Apprenticeship — Enrollment Confirmation';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">

    <!-- Institutional Header -->
    <div style="background-color: #ffffff; border-radius: 8px 8px 0 0; padding: 24px 32px; border-bottom: 3px solid #1e3a5f;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="vertical-align: middle;">
            <img src="${ORG.logoAbsoluteUrl}" alt="${ORG.name}" width="140" height="42" style="display: block; height: 42px; width: auto;" />
          </td>
          <td style="vertical-align: middle; text-align: right;">
            <span style="font-size: 11px; color: #64748b; line-height: 1.4;">
              ${ORG.tagline}<br />
              ${ORG.website.replace('https://', '')}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body -->
    <div style="background-color: #ffffff; padding: 32px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">

      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">Dear ${studentName},</p>

      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">
        Your enrollment in the Barber Apprenticeship Program has been confirmed. Below you will find your login credentials, required certifications, and next steps.
      </p>

      <!-- Student Dashboard -->
      <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0;">
        <h2 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px; font-weight: 700;">Student Dashboard</h2>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #334155;">Access your training portal using the link below.</p>
        <a href="${dashboardUrl}" style="display: inline-block; background-color: #1e40af; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Access Dashboard</a>
        <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b;">Login email: ${studentEmail}</p>
      </div>

      <!-- RISE Certification -->
      <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0;">
        <h2 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px; font-weight: 700;">Required: Milady RISE Certification</h2>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #334155;">
          Complete the Milady RISE Client Well-Being and Safety Certification. This is normally $29.95 but is provided at no cost to enrolled apprentices.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 14px; color: #334155;">
          <tr><td style="padding: 6px 0; font-weight: 600;">Step 1</td><td style="padding: 6px 0;">Visit <a href="https://www.miladytraining.com/bundles/client-well-being-safety-certification" style="color: #1e40af;">miladytraining.com enrollment page</a></td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Step 2</td><td style="padding: 6px 0;">Click "Enroll Now" and create an account with ${studentEmail}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Step 3</td><td style="padding: 6px 0;">Enter promo code at checkout:</td></tr>
        </table>

        <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 10px; text-align: center; border-radius: 4px; margin: 8px 0 12px 0;">
          <code style="font-size: 18px; font-weight: bold; color: #1e293b; letter-spacing: 1px;">efhcti-rise295</code>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 14px; color: #334155;">
          <tr><td style="padding: 6px 0; font-weight: 600;">Step 4</td><td style="padding: 6px 0;">Complete all three courses: Domestic Violence Awareness, Human Trafficking Awareness, Infection Control</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Step 5</td><td style="padding: 6px 0;">Download your certificate upon completion</td></tr>
        </table>
      </div>

      <!-- Next Steps -->
      <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0;">
        <h2 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px; font-weight: 700;">Next Steps</h2>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155; line-height: 1.8;">
          <li>Log in to your student dashboard</li>
          <li>Complete the RISE certification (required before OJT placement)</li>
          <li>Download the mobile app for on-the-go access (optional)</li>
          <li>Begin your apprenticeship training modules</li>
        </ol>
      </div>

      <!-- Signature -->
      <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px; color: #334155; font-weight: 600;">Elizabeth Greene, CEO</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${ORG.name}</p>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">${ORG.email} | ${ORG.phone}</p>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">${ORG.website.replace('https://', '')}</p>
      </div>
    </div>

    <!-- Institutional Footer -->
    <div style="background-color: #f1f5f9; border-radius: 0 0 8px 8px; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
        ${ORG.name} | Operated by ${ORG.operator}<br />
        ${ORG.address}<br />
        <a href="${ORG.website}" style="color: #64748b; text-decoration: underline;">${ORG.website.replace('https://', '')}</a>
      </p>
    </div>

  </div>
</body>
</html>`;

  const text = `Dear ${studentName},

Your enrollment in the Barber Apprenticeship Program has been confirmed.

STUDENT DASHBOARD
Login: ${dashboardUrl}
Email: ${studentEmail}

REQUIRED: MILADY RISE CERTIFICATION
Complete the Milady RISE Client Well-Being and Safety Certification (provided at no cost).

1. Visit: https://www.miladytraining.com/bundles/client-well-being-safety-certification
2. Click "Enroll Now" and create an account with ${studentEmail}
3. Enter promo code at checkout: efhcti-rise295
4. Complete all three courses: Domestic Violence Awareness, Human Trafficking Awareness, Infection Control
5. Download your certificate upon completion

NEXT STEPS
1. Log in to your student dashboard
2. Complete the RISE certification (required before OJT placement)
3. Download the mobile app for on-the-go access (optional)
4. Begin your apprenticeship training modules

Elizabeth Greene, CEO
${ORG.name}
${ORG.email} | ${ORG.phone}
${ORG.website.replace('https://', '')}`;

  return { subject, html, text };
}
