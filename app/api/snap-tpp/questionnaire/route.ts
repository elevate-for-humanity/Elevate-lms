import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/sendgrid';
import { safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const INTERNAL_NOTIFY = 'info@elevateforhumanity.org';

const QUESTIONS: Record<number, string> = {
  1:  'Are you a direct job training provider?',
  2:  'How long is the average training?',
  3:  'Are you actively engaged with employers who are hiring individuals who complete training through your agency?',
  4:  'What are your funding sources?',
  5:  'Approximately how many individuals per year participate in training through your organization?',
  6:  'Does your program include job readiness / "soft skills" training?',
  7:  'What percentage of participants are completing the training?',
  8:  'What percentage of training completers are obtaining employment within 60/90 days after completion?',
  9:  'What is the average beginning wage of program graduates?',
  10: 'Do you currently track employment rates with your participants?',
  11: 'Do you remain involved with participants after they have finished their training / obtained employment?',
  12: 'Do you currently provide any kind of supportive services for participants in your program?',
  13: 'Would you be able to estimate how many of your participants are eligible for SNAP?',
  14: 'Is your agency capable of accounting for federal funding separate from all other funding sources?',
  15: 'Is your agency capable of providing no less than weekly feedback for each SNAP E&T participant to the SNAP agency?',
  16: 'Is your agency financially stable and able to cover 100% of your expenses without E&T funding?',
  17: 'Do you understand that a Third-Party Partnership is a reimbursement of 50% of approved, incurred costs — not upfront funding?',
  18: 'Do you understand that you cannot bill for services without an executed contract with the State of Indiana?',
  19: 'How would becoming a SNAP Third Party Partner benefit your organization and those you serve?',
};

const FOLLOW_UPS: Record<string, string> = {
  q1_followup: 'Fields of certification / direct services and training partners',
  q12_followup: 'Description of supportive services provided',
};

function buildEmailHtml(params: {
  agencyName: string;
  contactName: string;
  contactTitle: string;
  date: string;
  answers: Record<string, string>;
}): string {
  const { agencyName, contactName, contactTitle, date, answers } = params;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const questionRows = Object.entries(QUESTIONS).map(([num, question]) => {
    const key = `q${num}`;
    const answer = answers[key] || '—';
    const followupKey = `${key}_followup`;
    const followupLabel = FOLLOW_UPS[followupKey];
    const followupAnswer = answers[followupKey];

    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;vertical-align:top;width:32px;color:#2563eb;font-weight:700;font-size:13px;">${num}.</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
          <p style="margin:0 0 6px 0;font-size:13px;color:#475569;font-weight:600;">${question}</p>
          <p style="margin:0;font-size:14px;color:#0f172a;">${answer}</p>
          ${followupLabel && followupAnswer ? `
            <p style="margin:8px 0 4px 0;font-size:12px;color:#64748b;font-style:italic;">${followupLabel}:</p>
            <p style="margin:0;font-size:14px;color:#0f172a;">${followupAnswer}</p>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
  <tr><td>
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td style="background:#0f172a;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <img src="https://www.elevateforhumanity.org/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
                     alt="Elevate for Humanity" height="52" style="display:block;height:52px;width:auto;" />
              </td>
              <td style="text-align:right;vertical-align:middle;">
                <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                  Elevate for Humanity Career &amp; Technical Institute<br>
                  8888 Keystone Crossing, Suite 1300<br>
                  Indianapolis, IN 46240<br>
                  (317) 314-3757 | info@elevateforhumanity.org
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Title bar -->
      <tr>
        <td style="background:#1e3a5f;padding:16px 32px;">
          <p style="margin:0;color:#ffffff;font-size:16px;font-weight:700;letter-spacing:0.3px;">
            SNAP E&amp;T Third Party Partnership — Questionnaire for Potential Partners
          </p>
          <p style="margin:4px 0 0 0;color:#93c5fd;font-size:12px;">
            Indiana FSSA / Division of Family Resources — IMPACT Program
          </p>
        </td>
      </tr>

      <!-- Addressed to -->
      <tr>
        <td style="padding:20px 32px;background:#eff6ff;border-bottom:1px solid #bfdbfe;">
          <p style="margin:0;font-size:12px;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Submitted To</p>
          <p style="margin:0;font-size:14px;color:#1e3a5f;line-height:1.7;">
            <strong>William "Joe" Gilles, BSBA</strong><br>
            IMPACT Business Solutions Manager<br>
            Marion South Office<br>
            3834 Madison Ave., Indianapolis, IN 46227<br>
            Office: 463-261-6072<br>
            <a href="https://www.in.gov/fssa/dfr/impact-job-training/" style="color:#2563eb;">in.gov/fssa/dfr/impact-job-training</a>
          </p>
        </td>
      </tr>

      <!-- Submitter info -->
      <tr>
        <td style="padding:20px 32px;border-bottom:2px solid #e2e8f0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:33%;padding-right:16px;">
                <p style="margin:0 0 2px 0;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Agency Name</p>
                <p style="margin:0;font-size:14px;color:#0f172a;font-weight:600;">${agencyName}</p>
              </td>
              <td style="width:33%;padding-right:16px;">
                <p style="margin:0 0 2px 0;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Completed By</p>
                <p style="margin:0;font-size:14px;color:#0f172a;">${contactName}</p>
                <p style="margin:0;font-size:12px;color:#475569;">${contactTitle}</p>
              </td>
              <td style="width:33%;">
                <p style="margin:0 0 2px 0;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Date</p>
                <p style="margin:0;font-size:14px;color:#0f172a;">${formattedDate}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Questions -->
      <tr>
        <td style="padding:0 32px 8px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
            ${questionRows}
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#64748b;text-align:center;line-height:1.6;">
            Elevate for Humanity Career &amp; Technical Institute &nbsp;|&nbsp;
            8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240 &nbsp;|&nbsp;
            (317) 314-3757 &nbsp;|&nbsp;
            <a href="https://www.elevateforhumanity.org" style="color:#2563eb;">elevateforhumanity.org</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { agencyName, contactName, contactTitle, date, email, answers } = body;

    if (!agencyName || !contactName || !contactTitle || !date || !email) {
      return NextResponse.json({ error: 'All header fields are required.' }, { status: 400 });
    }

    const html = buildEmailHtml({ agencyName, contactName, contactTitle, date, answers: answers ?? {} });

    const subject = `SNAP E&T TPP Questionnaire — ${agencyName} — ${new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

    // Send copy to the submitter
    await sendEmail({
      to: email,
      subject,
      html,
      from: 'Elevate for Humanity <info@elevateforhumanity.org>',
      replyTo: 'info@elevateforhumanity.org',
    });

    // Send internal copy for review and forwarding to DFR
    await sendEmail({
      to: INTERNAL_NOTIFY,
      subject: `[Internal] ${subject}`,
      html,
      from: 'Elevate for Humanity <info@elevateforhumanity.org>',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to send questionnaire email');
  }
}
