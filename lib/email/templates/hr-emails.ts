/**
 * HR / Hiring Email Templates
 * Fired automatically at each step of the hiring and onboarding pipeline.
 *
 * Steps:
 *   1. application_received   — candidate submits application
 *   2. thank_you_applying     — same-day thank you, sets expectations
 *   3. next_steps             — after review, invite to competency test
 *   4. interview_scheduled    — Zoom link + date/time
 *   5. welcome_aboard         — offer accepted, position confirmed
 *   6. hire_letter            — formal offer letter with pay/start date
 *   7. onboarding_start       — day-before onboarding reminder with checklist
 */

const BRAND = {
  primary: '#1E3A5F',
  accent: '#DC2626',
  orange: '#F97316',
  light: '#F8FAFC',
  text: '#1E293B',
  muted: '#64748B',
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
const FROM = 'Elevate for Humanity HR <hr@elevateforhumanity.org>';
const REPLY_TO = 'hr@elevateforhumanity.org';

function layout(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <!-- Header -->
    <div style="background:${BRAND.primary};padding:28px 32px;text-align:center">
      <img src="${BASE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" height="60" style="display:block;margin:0 auto 12px" />
      <p style="color:#94a3b8;font-size:13px;margin:0">Workforce Development · Career Training · Indianapolis, IN</p>
    </div>
    <!-- Body -->
    <div style="padding:32px;color:${BRAND.text};font-size:15px;line-height:1.7">
      ${body}
    </div>
    <!-- Footer -->
    <div style="background:${BRAND.light};border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;color:${BRAND.muted};font-size:12px">
      <p style="margin:0 0 4px">Elevate for Humanity Career &amp; Technical Institute</p>
      <p style="margin:0 0 4px">8888 Keystone Crossing Suite 1300 · Indianapolis, IN 46240</p>
      <p style="margin:0">(317) 314-3757 · <a href="mailto:hr@elevateforhumanity.org" style="color:${BRAND.primary}">hr@elevateforhumanity.org</a></p>
    </div>
  </div>
</body>
</html>`;
}

function btn(text: string, href: string, color = BRAND.accent) {
  return `<p style="text-align:center;margin:24px 0">
    <a href="${href}" style="display:inline-block;padding:13px 32px;background:${color};color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px">${text}</a>
  </p>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />`;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface HrEmailParams {
  firstName: string;
  lastName?: string;
  email: string;
  position?: string;
  department?: string;
  startDate?: string;
  payRate?: string;
  payType?: string;           // 'hourly' | 'salary'
  payMethod?: string;         // 'direct_deposit' | 'pay_card' | 'check'
  interviewDate?: string;
  interviewTime?: string;
  zoomLink?: string;
  testLink?: string;
  onboardingLink?: string;
  managerName?: string;
  applicationId?: string;
}

export const hrEmailTemplates = {

  // ── 1. Application Received ───────────────────────────────────────────────
  application_received: (p: HrEmailParams) => ({
    from: FROM,
    replyTo: REPLY_TO,
    subject: `We received your application — ${p.position ?? 'Elevate for Humanity'}`,
    html: layout(`
      <h2 style="color:${BRAND.primary};margin-top:0">Application Received</h2>
      <p>Hi ${p.firstName},</p>
      <p>Thank you for applying to <strong>${p.position ?? 'a position'}</strong> at Elevate for Humanity. We've received your application and our HR team will review it shortly.</p>
      <div style="background:${BRAND.light};border-left:4px solid ${BRAND.primary};padding:16px 20px;border-radius:0 6px 6px 0;margin:20px 0">
        <p style="margin:0 0 8px;font-weight:bold">What happens next:</p>
        <ol style="margin:0;padding-left:20px">
          <li>HR reviews your application (1–2 business days)</li>
          <li>Qualified candidates receive a competency assessment link</li>
          <li>Top scorers are invited to a video interview</li>
          <li>Offers are extended within 5–7 business days of interview</li>
        </ol>
      </div>
      <p>If you have questions, reply to this email or call <strong>(317) 314-3757</strong>.</p>
      <p>We appreciate your interest in joining our mission.</p>
      <p style="margin-bottom:0">Warm regards,<br><strong>Elevate for Humanity HR Team</strong></p>
    `),
  }),

  // ── 2. Thank You for Applying ─────────────────────────────────────────────
  thank_you_applying: (p: HrEmailParams) => ({
    from: FROM,
    replyTo: REPLY_TO,
    subject: `Thank you for applying, ${p.firstName}`,
    html: layout(`
      <h2 style="color:${BRAND.primary};margin-top:0">Thank You for Applying</h2>
      <p>Hi ${p.firstName},</p>
      <p>We wanted to take a moment to personally thank you for your interest in joining the Elevate for Humanity team. Our work — connecting people to funded workforce training and career pathways — depends on dedicated people like you.</p>
      <p>Your application for <strong>${p.position ?? 'this position'}</strong> has been logged and is in our review queue. We read every application carefully.</p>
      ${divider()}
      <p style="color:${BRAND.muted};font-size:14px">Application Reference: <strong>${p.applicationId ?? 'Pending'}</strong></p>
      <p style="margin-bottom:0">Thank you again,<br><strong>Elizabeth Greene</strong><br>Founder &amp; CEO, Elevate for Humanity</p>
    `),
  }),

  // ── 3. Next Steps (Competency Test Invite) ────────────────────────────────
  next_steps: (p: HrEmailParams) => ({
    from: FROM,
    replyTo: REPLY_TO,
    subject: `Next steps for your application — ${p.position ?? 'Elevate for Humanity'}`,
    html: layout(`
      <h2 style="color:${BRAND.primary};margin-top:0">You're Moving Forward!</h2>
      <p>Hi ${p.firstName},</p>
      <p>Great news — after reviewing your application for <strong>${p.position ?? 'this position'}</strong>, we'd like to invite you to complete a short competency assessment.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0">
        <p style="margin:0 0 8px;font-weight:bold;color:#15803d">About the Assessment</p>
        <ul style="margin:0;padding-left:20px;color:#166534">
          <li>Takes approximately 20–30 minutes</li>
          <li>Tests role-relevant knowledge and situational judgment</li>
          <li>No preparation needed — answer honestly</li>
          <li>Results are reviewed by our hiring team, not auto-rejected</li>
        </ul>
      </div>
      ${btn('Start Competency Assessment', p.testLink ?? `${BASE_URL}/careers/assessment`)}
      <p style="text-align:center;color:${BRAND.muted};font-size:13px;margin-top:-12px">Link expires in 7 days</p>
      <p>After completing the assessment, our team will reach out within 2 business days to schedule your interview.</p>
      <p style="margin-bottom:0">Best,<br><strong>Elevate for Humanity HR Team</strong></p>
    `),
  }),

  // ── 4. Interview Scheduled ────────────────────────────────────────────────
  interview_scheduled: (p: HrEmailParams) => ({
    from: FROM,
    replyTo: REPLY_TO,
    subject: `Interview Scheduled — ${p.position ?? 'Elevate for Humanity'} · ${p.interviewDate ?? ''}`,
    html: layout(`
      <h2 style="color:${BRAND.primary};margin-top:0">Your Interview is Confirmed</h2>
      <p>Hi ${p.firstName},</p>
      <p>Your video interview for <strong>${p.position ?? 'this position'}</strong> has been scheduled. Here are your details:</p>
      <div style="background:${BRAND.light};border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:${BRAND.muted};width:120px">Date</td><td style="padding:6px 0;font-weight:bold">${p.interviewDate ?? 'TBD'}</td></tr>
          <tr><td style="padding:6px 0;color:${BRAND.muted}">Time</td><td style="padding:6px 0;font-weight:bold">${p.interviewTime ?? 'TBD'} (Eastern)</td></tr>
          <tr><td style="padding:6px 0;color:${BRAND.muted}">Format</td><td style="padding:6px 0;font-weight:bold">Video Interview (Zoom)</td></tr>
          <tr><td style="padding:6px 0;color:${BRAND.muted}">Position</td><td style="padding:6px 0;font-weight:bold">${p.position ?? 'TBD'}</td></tr>
          ${p.managerName ? `<tr><td style="padding:6px 0;color:${BRAND.muted}">Interviewer</td><td style="padding:6px 0;font-weight:bold">${p.managerName}</td></tr>` : ''}
        </table>
      </div>
      ${btn('Join Zoom Interview', p.zoomLink ?? '#', BRAND.primary)}
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="margin:0 0 8px;font-weight:bold;color:#92400e">Tips for your interview:</p>
        <ul style="margin:0;padding-left:20px;color:#78350f;font-size:14px">
          <li>Test your camera and microphone 10 minutes before</li>
          <li>Have a copy of your resume handy</li>
          <li>Be ready to discuss your experience with workforce development or training</li>
          <li>Questions? Reply to this email</li>
        </ul>
      </div>
      <p style="margin-bottom:0">See you soon,<br><strong>Elevate for Humanity HR Team</strong></p>
    `),
  }),

  // ── 5. Welcome Aboard ─────────────────────────────────────────────────────
  welcome_aboard: (p: HrEmailParams) => ({
    from: FROM,
    replyTo: REPLY_TO,
    subject: `Welcome to the team, ${p.firstName}! 🎉`,
    html: layout(`
      <div style="text-align:center;padding:8px 0 24px">
        <div style="font-size:48px">🎉</div>
        <h2 style="color:${BRAND.primary};margin:8px 0 0">Welcome Aboard!</h2>
      </div>
      <p>Hi ${p.firstName},</p>
      <p>We are thrilled to welcome you to the Elevate for Humanity team! You've been selected for the <strong>${p.position ?? 'position'}</strong>${p.department ? ` in our <strong>${p.department}</strong> department` : ''}, and we couldn't be more excited to have you join our mission.</p>
      <p>Your official start date is <strong>${p.startDate ?? 'TBD'}</strong>. Before then, you'll receive your formal offer letter and onboarding instructions.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0">
        <p style="margin:0 0 8px;font-weight:bold;color:#15803d">Your next steps:</p>
        <ol style="margin:0;padding-left:20px;color:#166534">
          <li>Watch for your formal offer letter (arriving separately)</li>
          <li>Complete your W-9 and direct deposit / pay card setup</li>
          <li>Complete online onboarding before your start date</li>
          <li>Attend new employee orientation on your first day</li>
        </ol>
      </div>
      ${btn('Start Onboarding', p.onboardingLink ?? `${BASE_URL}/onboarding/staff`, BRAND.accent)}
      <p>If you have any questions before your start date, don't hesitate to reach out. We're here to make your transition as smooth as possible.</p>
      <p style="margin-bottom:0">With excitement,<br><strong>Elizabeth Greene</strong><br>Founder &amp; CEO, Elevate for Humanity</p>
    `),
  }),

  // ── 6. Hire Letter (Formal Offer) ─────────────────────────────────────────
  hire_letter: (p: HrEmailParams) => ({
    from: FROM,
    replyTo: REPLY_TO,
    subject: `Offer Letter — ${p.position ?? 'Position'} at Elevate for Humanity`,
    html: layout(`
      <h2 style="color:${BRAND.primary};margin-top:0">Formal Offer of Employment</h2>
      <p style="color:${BRAND.muted};font-size:13px">Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      <p>Dear ${p.firstName}${p.lastName ? ' ' + p.lastName : ''},</p>
      <p>On behalf of Elevate for Humanity Career &amp; Technical Institute, I am pleased to formally offer you the position of <strong>${p.position ?? 'Staff Member'}</strong>${p.department ? ` within our <strong>${p.department}</strong> department` : ''}.</p>
      <div style="background:${BRAND.light};border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
        <p style="margin:0 0 12px;font-weight:bold;color:${BRAND.primary}">Offer Details</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 0;color:${BRAND.muted}">Position</td><td style="padding:8px 0;font-weight:600">${p.position ?? '—'}</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 0;color:${BRAND.muted}">Start Date</td><td style="padding:8px 0;font-weight:600">${p.startDate ?? 'To be confirmed'}</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 0;color:${BRAND.muted}">Compensation</td><td style="padding:8px 0;font-weight:600">${p.payRate ?? 'Per agreement'} ${p.payType === 'hourly' ? '/hour' : p.payType === 'salary' ? '/year' : ''}</td></tr>
          <tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 0;color:${BRAND.muted}">Pay Method</td><td style="padding:8px 0;font-weight:600">${p.payMethod === 'direct_deposit' ? 'Direct Deposit' : p.payMethod === 'pay_card' ? 'Elevate Pay Card (Visa)' : p.payMethod === 'check' ? 'Paper Check' : 'To be selected'}</td></tr>
          <tr><td style="padding:8px 0;color:${BRAND.muted}">Employment Type</td><td style="padding:8px 0;font-weight:600">At-Will Employment</td></tr>
        </table>
      </div>
      <p>This offer is contingent upon successful completion of your onboarding requirements, including identity verification, W-9 submission, and acknowledgment of the Employee Handbook.</p>
      <p>To accept this offer, please complete your onboarding portal within <strong>5 business days</strong>.</p>
      ${btn('Accept Offer & Start Onboarding', p.onboardingLink ?? `${BASE_URL}/onboarding/staff`)}
      <p>We look forward to having you on the team. Please don't hesitate to contact HR with any questions.</p>
      <p style="margin-bottom:0">Sincerely,<br><strong>Elizabeth Greene</strong><br>Founder &amp; CEO<br>Elevate for Humanity Career &amp; Technical Institute</p>
      ${divider()}
      <p style="font-size:12px;color:${BRAND.muted}">This offer letter does not constitute a contract of employment. Employment at Elevate for Humanity is at-will and may be terminated by either party at any time.</p>
    `),
  }),

  // ── 7. Onboarding Start ───────────────────────────────────────────────────
  onboarding_start: (p: HrEmailParams) => ({
    from: FROM,
    replyTo: REPLY_TO,
    subject: `Your onboarding starts tomorrow — here's your checklist`,
    html: layout(`
      <h2 style="color:${BRAND.primary};margin-top:0">You Start Tomorrow!</h2>
      <p>Hi ${p.firstName},</p>
      <p>We're so excited for your first day as <strong>${p.position ?? 'a team member'}</strong> at Elevate for Humanity. Here's everything you need to know before you arrive.</p>
      <div style="background:${BRAND.light};border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
        <p style="margin:0 0 12px;font-weight:bold">Pre-Start Checklist</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${[
            ['Complete W-9 form', 'Required for payroll'],
            ['Set up pay method', 'Direct deposit, pay card, or check'],
            ['Read Employee Handbook', 'Acknowledge in the portal'],
            ['Complete skills assessment', 'Identifies your training needs'],
            ['Watch orientation video', 'About 15 minutes'],
          ].map(([task, note]) => `
          <tr style="border-bottom:1px solid #f1f5f9">
            <td style="padding:10px 0">
              <span style="display:inline-block;width:18px;height:18px;border:2px solid #cbd5e1;border-radius:4px;margin-right:10px;vertical-align:middle"></span>
              <strong>${task}</strong>
            </td>
            <td style="padding:10px 0;color:${BRAND.muted};font-size:13px">${note}</td>
          </tr>`).join('')}
        </table>
      </div>
      ${btn('Open Onboarding Portal', p.onboardingLink ?? `${BASE_URL}/onboarding/staff`, BRAND.primary)}
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="margin:0;font-size:14px;color:#1e40af"><strong>First Day Info:</strong> Report to 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240. Bring a valid government-issued ID. Orientation begins at 9:00 AM.</p>
      </div>
      <p>See you tomorrow!</p>
      <p style="margin-bottom:0">Warmly,<br><strong>Elevate for Humanity HR Team</strong></p>
    `),
  }),

};

export type HrEmailStep = keyof typeof hrEmailTemplates;
