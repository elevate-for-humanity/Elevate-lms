/**
 * Email sent when an application is held at pending_workone status.
 * Tells the applicant what WorkOne is, what to bring, and where to go.
 */

import { sendEmail } from './sendgrid';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

interface WorkOneHoldEmailParams {
  firstName: string;
  lastName: string;
  email: string;
  programName: string;
  referenceNumber?: string;
}

export async function sendWorkOneHoldEmail(params: WorkOneHoldEmailParams) {
  const { firstName, lastName, email, programName, referenceNumber } = params;

  const refLine = referenceNumber
    ? `<p style="margin:0 0 8px">Reference number: <strong>${referenceNumber}</strong></p>`
    : '';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">

        <!-- Header -->
        <tr>
          <td style="background:#1e293b;padding:28px 32px">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700">Elevate for Humanity</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Career &amp; Technical Institute</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <h1 style="margin:0 0 16px;font-size:22px;color:#1e293b">Next Step: Visit WorkOne</h1>

            <p style="margin:0 0 16px;color:#475569;line-height:1.6">
              Hi ${firstName},
            </p>
            <p style="margin:0 0 16px;color:#475569;line-height:1.6">
              Thank you for applying to <strong>${programName}</strong> at Elevate for Humanity.
              Based on your application, you may qualify for <strong>WorkOne / WIOA funding</strong>,
              which can cover your training costs at no charge to you.
            </p>

            ${refLine}

            <!-- What is WorkOne -->
            <div style="background:#f0f9ff;border-left:4px solid #0ea5e9;border-radius:6px;padding:16px 20px;margin:0 0 24px">
              <p style="margin:0 0 8px;font-weight:700;color:#0c4a6e;font-size:14px">What is WorkOne?</p>
              <p style="margin:0;color:#0c4a6e;font-size:13px;line-height:1.6">
                WorkOne is Indiana's workforce development agency. They administer WIOA (Workforce Innovation
                and Opportunity Act) funding that pays for approved training programs like ours.
                A WorkOne case manager will review your eligibility and, if approved, authorize funding
                directly to Elevate for Humanity.
              </p>
            </div>

            <!-- What to bring -->
            <p style="margin:0 0 10px;font-weight:700;color:#1e293b;font-size:15px">What to bring to WorkOne:</p>
            <ul style="margin:0 0 24px;padding-left:20px;color:#475569;line-height:2;font-size:14px">
              <li>Government-issued photo ID (driver's license or state ID)</li>
              <li>Social Security card or proof of SSN</li>
              <li>Proof of Indiana residency (utility bill, lease, or bank statement)</li>
              <li>Most recent tax return or proof of income (pay stubs, benefits letter)</li>
              <li>Selective Service registration (if applicable)</li>
              <li>This email or your application reference number</li>
            </ul>

            <!-- What to say -->
            <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:6px;padding:16px 20px;margin:0 0 24px">
              <p style="margin:0 0 8px;font-weight:700;color:#14532d;font-size:14px">What to tell them:</p>
              <p style="margin:0;color:#14532d;font-size:13px;line-height:1.6">
                "I applied to Elevate for Humanity's <strong>${programName}</strong> program and I'd like
                to apply for WIOA Title I Adult or Dislocated Worker funding to cover my training costs."
              </p>
            </div>

            <!-- Find WorkOne -->
            <p style="margin:0 0 10px;font-weight:700;color:#1e293b;font-size:15px">Find your nearest WorkOne:</p>
            <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6">
              Visit
              <a href="https://www.in.gov/dwd/workone/" style="color:#1d4ed8">in.gov/dwd/workone</a>
              to find the WorkOne center nearest you. Indianapolis-area applicants can visit
              <strong>WorkOne Indy</strong> at 2955 N. Meridian St., Indianapolis, IN 46208.
            </p>

            <!-- After WorkOne -->
            <p style="margin:0 0 10px;font-weight:700;color:#1e293b;font-size:15px">After your WorkOne visit:</p>
            <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6">
              Once WorkOne approves your funding, they will contact us directly. We will then finalize
              your enrollment and send you a start date. You can track your checklist at any time by
              logging in to your learner portal.
            </p>

            <a href="${SITE_URL}/apply/pending-workone"
               style="display:inline-block;background:#1e293b;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none">
              View My WorkOne Checklist
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0">
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">
              Questions? Call <strong>(317) 314-3757</strong> or reply to this email.<br>
              Elizabeth Greene — Director, Elevate for Humanity Career &amp; Technical Institute<br>
              <a href="${SITE_URL}" style="color:#94a3b8">${SITE_URL}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${firstName} ${lastName},

Thank you for applying to ${programName} at Elevate for Humanity.
${referenceNumber ? `Reference number: ${referenceNumber}\n` : ''}
Based on your application, you may qualify for WorkOne / WIOA funding, which can cover your training costs.

NEXT STEP: Visit your nearest WorkOne center.

WHAT TO BRING:
- Government-issued photo ID
- Social Security card or proof of SSN
- Proof of Indiana residency
- Most recent tax return or proof of income
- This email or your reference number

WHAT TO SAY:
"I applied to Elevate for Humanity's ${programName} program and I'd like to apply for WIOA Title I Adult or Dislocated Worker funding."

FIND WORKONE: https://www.in.gov/dwd/workone/
Indianapolis: WorkOne Indy, 2955 N. Meridian St., Indianapolis, IN 46208

After WorkOne approves your funding, they will contact us and we will finalize your enrollment.

View your checklist: ${SITE_URL}/apply/pending-workone

Questions? Call (317) 314-3757 or reply to this email.
Elizabeth Greene — Director, Elevate for Humanity Career & Technical Institute`;

  return sendEmail({
    to: email,
    subject: `Next step for your ${programName} application — Visit WorkOne`,
    html,
    text,
    replyTo: 'elevate4humanityedu@gmail.com',
  });
}
