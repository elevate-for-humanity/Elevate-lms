#!/usr/bin/env node
/**
 * Onboarding invitation to Anita Bell — CNA Program RN-BSN
 * CC: Elizabeth Greene
 * Includes: role responsibilities, MOU pay structure, step-by-step signup link
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) { console.error('SENDGRID_API_KEY not set'); process.exit(1); }

const SIGNUP_URL = 'https://www.elevateforhumanity.org/signup';
const ONBOARDING_URL = 'https://www.elevateforhumanity.org/shop/onboarding';
const PAYROLL_URL = 'https://www.elevateforhumanity.org/shop/dashboard';

const logoBase64 = fs.readFileSync(
  path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg')
).toString('base64');

// ─── Plain text version ───────────────────────────────────────────────────────
const plainText = `
Dear Anita,

My name is Elizabeth Greene, Executive Director of Elevate for Humanity | Workforce Credential Institute. We are a DOL-registered workforce training organization based in Indianapolis, Indiana, and we are excited to welcome you as our RN-BSN Program Lead for the Certified Nursing Assistant (CNA) Training Program.

This email contains everything you need to get started. Please read it carefully — there are action steps at the bottom.

─────────────────────────────────────────────
YOUR ROLE: RN-BSN — CNA Program Lead
─────────────────────────────────────────────

As the clinical lead over our CNA program, your responsibilities include:

1. CLINICAL OVERSIGHT
   • Supervise and sign off on all clinical skills competencies for enrolled students
   • Ensure all clinical training meets Indiana State Department of Health (ISDH) standards
   • Maintain accurate clinical hours logs for each student (minimum 75 clinical hours required for ISDH certification)

2. CURRICULUM & INSTRUCTION
   • Deliver or oversee classroom instruction aligned to the ISDH-approved CNA curriculum
   • Coordinate with Elevate staff on scheduling, cohort size (up to 30 students), and lab access
   • Administer and document skills checkoffs (bed bath, vital signs, transfers, catheter care, etc.)

3. CREDENTIALING SUPPORT
   • Prepare students for the Prometric CNA State Exam (written + skills)
   • Submit clinical documentation to Elevate's credentialing team for ISDH filing
   • Maintain your own RN-BSN licensure and provide a copy to Elevate for our records

4. COMPLIANCE & REPORTING
   • Report any student clinical incidents to Elizabeth Greene within 24 hours
   • Maintain HIPAA compliance at all clinical sites
   • Complete monthly progress reports via the Elevate portal

5. PAYROLL & COMPENSATION
   • You will be compensated as a Program Holder / Clinical Partner
   • Pay is processed through the Elevate platform on a per-cohort basis

─────────────────────────────────────────────
YOUR COMPENSATION — MOU STRUCTURE
─────────────────────────────────────────────

Elevate operates on a 1/3 revenue-share model after credential partner fees and testing costs are deducted.

Here is how it works with real numbers:

  Student tuition per cohort:     $2,500 per student
  Cohort size:                    Up to 30 students
  Gross cohort revenue:           $75,000

  Deductions (per cohort):
    — Prometric exam fees:        $105 × 30 = $3,150
    — ISDH filing fees:           $50 × 30  = $1,500
    — Credential partner fees:    ~$500 (BadgeCert digital badges)
    — Platform & admin:           ~$2,000
  Total deductions:               ~$7,150

  Net distributable revenue:      $75,000 − $7,150 = $67,850

  YOUR 1/3 SHARE:                 $67,850 ÷ 3 = ~$22,617 per cohort

  Elevate retains 2/3 to cover:
    — Instructor support
    — Marketing & enrollment
    — DOL/ETPL compliance
    — Facilities & equipment
    — Administrative overhead

Payment is issued within 14 days of cohort completion and credential submission.
A formal MOU will be sent to your email for e-signature before your first cohort begins.

─────────────────────────────────────────────
ABOUT ELEVATE FOR HUMANITY
─────────────────────────────────────────────

Elevate for Humanity is a workforce development organization that provides:
  • DOL-registered apprenticeship programs
  • ETPL-listed training (Indiana WorkOne eligible)
  • Industry-recognized credentials (EPA 608, OSHA 10, CNA, CDL, and more)
  • Funding navigation for students (Pell, WIOA, JRI, Job Ready Indy)
  • Digital credentialing and employer placement support

We are fully credentialed and operate in compliance with Indiana DWD, ISDH, and federal DOL standards.

─────────────────────────────────────────────
YOUR ACTION STEPS — COMPLETE IN ORDER
─────────────────────────────────────────────

STEP 1 — Create your account
  Go to: ${SIGNUP_URL}
  Use your email: anitabell85@gmail.com
  Select role: "Program Partner / Instructor"
  Complete your profile (name, credentials, RN-BSN license number)

STEP 2 — Complete onboarding
  After signup, go to: ${ONBOARDING_URL}
  Upload the following documents:
    □ Copy of your Indiana RN-BSN license
    □ Copy of your NPI number
    □ Government-issued photo ID
    □ Signed W-9 form (for payroll)
    □ Any current CPR/BLS certification

STEP 3 — Set up payroll
  After onboarding, go to: ${PAYROLL_URL}
  Navigate to "Payroll & Banking" and enter your direct deposit information.
  This is required before your first cohort payment can be issued.

STEP 4 — Review and sign the MOU
  Once your account is active, Elizabeth will send you the formal Memorandum of Understanding
  for e-signature. This document governs your role, compensation, and clinical responsibilities.

STEP 5 — Confirm your start date
  Reply to this email with your availability for an onboarding call with Elizabeth.
  Target first cohort start: TBD based on clinical site confirmation.

─────────────────────────────────────────────
QUESTIONS?
─────────────────────────────────────────────

Contact Elizabeth Greene directly:
  Email: elevate4humanityedu@gmail.com
  Phone: 317-314-3537
  Website: www.elevateforhumanity.org

We are thrilled to have you on the Elevate team, Anita. Your clinical expertise is exactly what our CNA students need to succeed and earn their credentials.

Welcome aboard.

Best regards,
Elizabeth Greene
Executive Director
Elevate for Humanity | Workforce Credential Institute
www.elevateforhumanity.org
elevate4humanityedu@gmail.com
317-314-3537
`.trim();

// ─── HTML version ─────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;max-width:620px;">

  <!-- HEADER -->
  <tr><td style="background:#1e293b;padding:28px 32px;text-align:center;">
    <img src="cid:elevate_logo" alt="Elevate for Humanity" width="64" style="display:block;margin:0 auto 10px;">
    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px;">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">Workforce Credential Institute &nbsp;|&nbsp; DOL Sponsor &nbsp;|&nbsp; ETPL Listed</p>
  </td></tr>

  <!-- WELCOME BANNER -->
  <tr><td style="background:#dc2626;padding:16px 32px;text-align:center;">
    <p style="margin:0;color:#ffffff;font-size:16px;font-weight:700;">Welcome, Anita — CNA Program RN-BSN Lead</p>
  </td></tr>

  <!-- BODY -->
  <tr><td style="padding:32px;">

    <p style="margin:0 0 20px;">Dear Anita,</p>
    <p style="margin:0 0 20px;line-height:1.7;">My name is <strong>Elizabeth Greene</strong>, Executive Director of <strong>Elevate for Humanity | Workforce Credential Institute</strong>. We are a DOL-registered workforce training organization based in Indianapolis, Indiana, and we are excited to welcome you as our <strong>RN-BSN Program Lead</strong> for the Certified Nursing Assistant (CNA) Training Program.</p>
    <p style="margin:0 0 28px;line-height:1.7;">This email contains everything you need to get started. Please read it carefully — your action steps are at the bottom.</p>

    <!-- ROLE SECTION -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="background:#f1f5f9;border-left:4px solid #dc2626;padding:16px 20px;border-radius:0 6px 6px 0;">
        <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1e293b;">YOUR ROLE: RN-BSN — CNA Program Lead</p>

        <p style="margin:0 0 8px;font-weight:700;color:#dc2626;">1. Clinical Oversight</p>
        <ul style="margin:0 0 14px;padding-left:20px;line-height:1.8;">
          <li>Supervise and sign off on all clinical skills competencies for enrolled students</li>
          <li>Ensure all clinical training meets Indiana State Department of Health (ISDH) standards</li>
          <li>Maintain accurate clinical hours logs (minimum 75 clinical hours required for ISDH certification)</li>
        </ul>

        <p style="margin:0 0 8px;font-weight:700;color:#dc2626;">2. Curriculum &amp; Instruction</p>
        <ul style="margin:0 0 14px;padding-left:20px;line-height:1.8;">
          <li>Deliver or oversee classroom instruction aligned to the ISDH-approved CNA curriculum</li>
          <li>Coordinate with Elevate staff on scheduling, cohort size (up to 30 students), and lab access</li>
          <li>Administer and document skills checkoffs (bed bath, vital signs, transfers, catheter care, etc.)</li>
        </ul>

        <p style="margin:0 0 8px;font-weight:700;color:#dc2626;">3. Credentialing Support</p>
        <ul style="margin:0 0 14px;padding-left:20px;line-height:1.8;">
          <li>Prepare students for the Prometric CNA State Exam (written + skills)</li>
          <li>Submit clinical documentation to Elevate's credentialing team for ISDH filing</li>
          <li>Maintain your own RN-BSN licensure and provide a copy to Elevate for our records</li>
        </ul>

        <p style="margin:0 0 8px;font-weight:700;color:#dc2626;">4. Compliance &amp; Reporting</p>
        <ul style="margin:0 0 14px;padding-left:20px;line-height:1.8;">
          <li>Report any student clinical incidents to Elizabeth Greene within 24 hours</li>
          <li>Maintain HIPAA compliance at all clinical sites</li>
          <li>Complete monthly progress reports via the Elevate portal</li>
        </ul>
      </td></tr>
    </table>

    <!-- MOU / PAY SECTION -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="background:#fff7ed;border-left:4px solid #f97316;padding:16px 20px;border-radius:0 6px 6px 0;">
        <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1e293b;">YOUR COMPENSATION — MOU STRUCTURE</p>
        <p style="margin:0 0 12px;line-height:1.7;">Elevate operates on a <strong>1/3 revenue-share model</strong> after credential partner fees and testing costs are deducted. Here is how it works with real numbers:</p>

        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin-bottom:14px;">
          <tr style="background:#1e293b;color:#fff;">
            <td style="padding:10px 14px;font-weight:700;border-radius:4px 0 0 0;">Item</td>
            <td style="padding:10px 14px;font-weight:700;text-align:right;border-radius:0 4px 0 0;">Amount</td>
          </tr>
          <tr style="background:#f8fafc;"><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;">Student tuition (per student)</td><td style="padding:8px 14px;text-align:right;border-bottom:1px solid #e2e8f0;">$2,500</td></tr>
          <tr><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;">Cohort size</td><td style="padding:8px 14px;text-align:right;border-bottom:1px solid #e2e8f0;">Up to 30 students</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;font-weight:700;">Gross cohort revenue</td><td style="padding:8px 14px;text-align:right;border-bottom:1px solid #e2e8f0;font-weight:700;">$75,000</td></tr>
          <tr><td colspan="2" style="padding:8px 14px;font-weight:700;color:#dc2626;border-bottom:1px solid #e2e8f0;">Deductions</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px 14px;padding-left:24px;border-bottom:1px solid #e2e8f0;">Prometric exam fees ($105 × 30)</td><td style="padding:8px 14px;text-align:right;border-bottom:1px solid #e2e8f0;">−$3,150</td></tr>
          <tr><td style="padding:8px 14px;padding-left:24px;border-bottom:1px solid #e2e8f0;">ISDH filing fees ($50 × 30)</td><td style="padding:8px 14px;text-align:right;border-bottom:1px solid #e2e8f0;">−$1,500</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px 14px;padding-left:24px;border-bottom:1px solid #e2e8f0;">Credential partner fees (BadgeCert)</td><td style="padding:8px 14px;text-align:right;border-bottom:1px solid #e2e8f0;">−$500</td></tr>
          <tr><td style="padding:8px 14px;padding-left:24px;border-bottom:1px solid #e2e8f0;">Platform &amp; admin</td><td style="padding:8px 14px;text-align:right;border-bottom:1px solid #e2e8f0;">−$2,000</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;font-weight:700;">Net distributable revenue</td><td style="padding:8px 14px;text-align:right;border-bottom:1px solid #e2e8f0;font-weight:700;">$67,850</td></tr>
          <tr style="background:#dcfce7;"><td style="padding:10px 14px;font-weight:700;color:#166534;border-radius:0 0 0 4px;">YOUR 1/3 SHARE (per cohort)</td><td style="padding:10px 14px;text-align:right;font-weight:700;color:#166534;font-size:16px;border-radius:0 0 4px 0;">~$22,617</td></tr>
        </table>

        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">Payment is issued within 14 days of cohort completion and credential submission. A formal MOU will be sent for e-signature before your first cohort begins.</p>
      </td></tr>
    </table>

    <!-- ABOUT ELEVATE -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="background:#f1f5f9;border-left:4px solid #1e293b;padding:16px 20px;border-radius:0 6px 6px 0;">
        <p style="margin:0 0 10px;font-size:15px;font-weight:700;">About Elevate for Humanity</p>
        <ul style="margin:0;padding-left:20px;line-height:1.9;font-size:14px;">
          <li>DOL-registered apprenticeship programs</li>
          <li>ETPL-listed training (Indiana WorkOne eligible)</li>
          <li>Industry-recognized credentials: EPA 608, OSHA 10, CNA, CDL, and more</li>
          <li>Funding navigation for students (Pell, WIOA, JRI, Job Ready Indy)</li>
          <li>Digital credentialing and employer placement support</li>
        </ul>
      </td></tr>
    </table>

    <!-- ACTION STEPS -->
    <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#dc2626;">YOUR ACTION STEPS — Complete in Order</p>

    <!-- Step 1 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td width="44" valign="top" style="padding-top:2px;">
          <div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">1</div>
        </td>
        <td style="padding-left:12px;">
          <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Create Your Account</p>
          <p style="margin:0 0 8px;line-height:1.7;font-size:14px;">Go to the signup page and create your account using <strong>anitabell85@gmail.com</strong>. Select <strong>"Program Partner / Instructor"</strong> as your role and complete your profile with your name, credentials, and RN-BSN license number.</p>
          <a href="${SIGNUP_URL}" style="display:inline-block;background:#dc2626;color:#ffffff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Create Your Account →</a>
        </td>
      </tr>
    </table>

    <!-- Step 2 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td width="44" valign="top" style="padding-top:2px;">
          <div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">2</div>
        </td>
        <td style="padding-left:12px;">
          <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Complete Onboarding &amp; Upload Documents</p>
          <p style="margin:0 0 8px;line-height:1.7;font-size:14px;">After signup, go to your onboarding portal and upload the following:</p>
          <ul style="margin:0 0 8px;padding-left:20px;font-size:14px;line-height:1.9;">
            <li>Copy of your Indiana RN-BSN license</li>
            <li>NPI number</li>
            <li>Government-issued photo ID</li>
            <li>Signed W-9 form (for payroll — <a href="https://www.irs.gov/pub/irs-pdf/fw9.pdf" style="color:#dc2626;">download here</a>)</li>
            <li>Current CPR/BLS certification</li>
          </ul>
          <a href="${ONBOARDING_URL}" style="display:inline-block;background:#1e293b;color:#ffffff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Go to Onboarding Portal →</a>
        </td>
      </tr>
    </table>

    <!-- Step 3 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td width="44" valign="top" style="padding-top:2px;">
          <div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">3</div>
        </td>
        <td style="padding-left:12px;">
          <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Set Up Payroll &amp; Direct Deposit</p>
          <p style="margin:0 0 8px;line-height:1.7;font-size:14px;">After onboarding, go to your dashboard and navigate to <strong>"Payroll &amp; Banking"</strong> to enter your direct deposit information. This must be completed before your first cohort payment can be issued.</p>
          <a href="${PAYROLL_URL}" style="display:inline-block;background:#1e293b;color:#ffffff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Go to Dashboard →</a>
        </td>
      </tr>
    </table>

    <!-- Step 4 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td width="44" valign="top" style="padding-top:2px;">
          <div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">4</div>
        </td>
        <td style="padding-left:12px;">
          <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Review &amp; Sign the MOU</p>
          <p style="margin:0;line-height:1.7;font-size:14px;">Once your account is active, Elizabeth will send you the formal Memorandum of Understanding for e-signature. This document governs your role, compensation, and clinical responsibilities.</p>
        </td>
      </tr>
    </table>

    <!-- Step 5 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td width="44" valign="top" style="padding-top:2px;">
          <div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">5</div>
        </td>
        <td style="padding-left:12px;">
          <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Confirm Your Start Date</p>
          <p style="margin:0;line-height:1.7;font-size:14px;">Reply to this email with your availability for an onboarding call with Elizabeth. Target first cohort start is TBD based on clinical site confirmation.</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 6px;line-height:1.7;">We are thrilled to have you on the Elevate team, Anita. Your clinical expertise is exactly what our CNA students need to succeed and earn their credentials.</p>
    <p style="margin:0 0 28px;font-weight:700;">Welcome aboard.</p>

    <p style="margin:0;line-height:1.8;">Best regards,<br>
    <strong>Elizabeth Greene</strong><br>
    Executive Director<br>
    Elevate for Humanity | Workforce Credential Institute<br>
    <a href="https://www.elevateforhumanity.org" style="color:#dc2626;">www.elevateforhumanity.org</a><br>
    elevate4humanityedu@gmail.com &nbsp;|&nbsp; 317-314-3537</p>

  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.8;">
      Elevate for Humanity | Workforce Credential Institute<br>
      Indianapolis, Indiana &nbsp;|&nbsp; DOL Sponsor &nbsp;|&nbsp; ETPL Listed &nbsp;|&nbsp; WorkOne Partner<br>
      <a href="https://www.elevateforhumanity.org" style="color:#dc2626;">www.elevateforhumanity.org</a>
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

// ─── Send ─────────────────────────────────────────────────────────────────────
const payload = JSON.stringify({
  personalizations: [{
    to: [{ email: 'anitabell85@gmail.com', name: 'Anita Bell' }],
    cc: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }],
  }],
  from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
  reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
  subject: 'Welcome to Elevate for Humanity — CNA Program Onboarding & Next Steps',
  content: [
    { type: 'text/plain', value: plainText },
    { type: 'text/html',  value: html },
  ],
  attachments: [{
    content: logoBase64,
    filename: 'Elevate_for_Humanity_logo.jpg',
    type: 'image/jpeg',
    disposition: 'inline',
    content_id: 'elevate_logo',
  }],
});

const req = https.request({
  hostname: 'api.sendgrid.com',
  path: '/v3/mail/send',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
}, res => {
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => {
    if (res.statusCode === 202) {
      console.log('✅ Onboarding email delivered to anitabell85@gmail.com');
      console.log('   CC: elevate4humanityedu@gmail.com (Elizabeth)');
      console.log('   Timestamp:', new Date().toISOString());
    } else {
      console.error('❌ Failed (' + res.statusCode + '):', d);
      process.exit(1);
    }
  });
});
req.on('error', e => { console.error(e); process.exit(1); });
req.write(payload);
req.end();
