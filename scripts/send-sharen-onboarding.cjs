#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) { console.error('SENDGRID_API_KEY not set'); process.exit(1); }

const SIGNUP_URL  = 'https://www.elevateforhumanity.org/signup';
const APPLY_URL   = 'https://www.elevateforhumanity.org/partners/programs/information-technology/apply';
const ONBOARD_URL = 'https://www.elevateforhumanity.org/shop/onboarding';
const PAYROLL_URL = 'https://www.elevateforhumanity.org/shop/dashboard';

const logoBase64 = fs.readFileSync(
  path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg')
).toString('base64');

const plain = [
  'Dear Sharen,',
  '',
  'My name is Elizabeth Greene, Executive Director of Elevate for Humanity | Workforce Credential Institute.',
  'We are a DOL-registered workforce training organization based in Indianapolis, Indiana.',
  '',
  'We are excited to bring you on as our Program Partner over the Information Technology,',
  'CPR, and Clinical Informatics programs.',
  '',
  'This email contains your partnership application link, onboarding steps, and payroll setup instructions.',
  '',
  '─────────────────────────────────────────────',
  'YOUR ROLE: Program Partner — IT, CPR & Clinical Informatics',
  '─────────────────────────────────────────────',
  '',
  '1. PROGRAM DELIVERY',
  '   - Deliver or oversee instruction for IT, CPR, and Clinical Informatics courses',
  '   - Coordinate curriculum aligned to industry-recognized credentials',
  '   - Manage cohort scheduling and student progress tracking',
  '',
  '2. CREDENTIALING SUPPORT',
  '   - Guide students toward credentials:',
  '       IT:                CompTIA A+, CompTIA IT Fundamentals, Google IT Support',
  '       CPR:               American Heart Association BLS/CPR Certification',
  '       Clinical Informatics: EHR Specialist, Health IT certifications',
  '   - Submit completion documentation to Elevate credentialing team',
  '   - Coordinate with testing centers for proctored exams',
  '',
  '3. COMPLIANCE & REPORTING',
  '   - Complete monthly progress reports via the Elevate portal',
  '   - Maintain all required licenses and certifications (CPR instructor cert, IT credentials)',
  '   - Ensure HIPAA compliance for all clinical informatics instruction',
  '',
  '─────────────────────────────────────────────',
  'YOUR COMPENSATION — MOU STRUCTURE',
  '─────────────────────────────────────────────',
  '',
  'Elevate operates on a 1/3 revenue-share model after credential partner fees and testing costs are deducted.',
  '',
  'Example with real numbers (IT Program):',
  '',
  '  Student tuition (per student):  $1,800',
  '  Cohort size:                    Up to 25 students',
  '  Gross cohort revenue:           $45,000',
  '',
  '  Deductions (per cohort):',
  '    Exam/testing fees (CompTIA):  ~$2,500',
  '    Credential partner fees:      ~$500',
  '    Platform & admin:             ~$1,500',
  '  Total deductions:               ~$4,500',
  '',
  '  Net distributable revenue:      $40,500',
  '  YOUR 1/3 SHARE:                 ~$13,500 per cohort',
  '',
  'Example with real numbers (CPR Program):',
  '',
  '  Student tuition (per student):  $75',
  '  Class size:                     Up to 20 students',
  '  Gross class revenue:            $1,500',
  '',
  '  Deductions:',
  '    AHA materials & cards:        ~$200',
  '    Platform & admin:             ~$100',
  '  Total deductions:               ~$300',
  '',
  '  Net distributable revenue:      $1,200',
  '  YOUR 1/3 SHARE:                 ~$400 per class',
  '',
  'Payment is issued within 14 days of cohort/class completion.',
  'A formal MOU will be sent for e-signature before your first cohort begins.',
  '',
  '─────────────────────────────────────────────',
  'YOUR ACTION STEPS — COMPLETE IN ORDER',
  '─────────────────────────────────────────────',
  '',
  'STEP 1 — Submit your Partnership Application',
  '  ' + APPLY_URL,
  '',
  'STEP 2 — Create your account',
  '  ' + SIGNUP_URL,
  '  Use: sharen710@gmail.com',
  '  Select role: Program Partner / Instructor',
  '',
  'STEP 3 — Complete onboarding & upload documents',
  '  ' + ONBOARD_URL,
  '  Upload:',
  '    - Government-issued photo ID',
  '    - Signed W-9 form (for payroll)',
  '    - CPR Instructor certification (AHA or equivalent)',
  '    - Any IT certifications (CompTIA, Google, Microsoft, etc.)',
  '    - Business entity documents (if applicable)',
  '',
  'STEP 4 — Set up payroll & direct deposit',
  '  ' + PAYROLL_URL,
  '  Navigate to Payroll & Banking and enter your direct deposit information.',
  '  Required before your first cohort payment can be issued.',
  '',
  'STEP 5 — Review and sign the MOU',
  '  Elizabeth will send the MOU for e-signature once your account is active.',
  '',
  'STEP 6 — Confirm your start date',
  '  Reply to this email with your availability for an onboarding call with Elizabeth.',
  '',
  '─────────────────────────────────────────────',
  'QUESTIONS?',
  '─────────────────────────────────────────────',
  '',
  'Elizabeth Greene',
  'elevate4humanityedu@gmail.com',
  '317-314-3537',
  'www.elevateforhumanity.org',
  '',
  'We look forward to partnering with you, Sharen. Welcome to the Elevate team.',
  '',
  'Best regards,',
  'Elizabeth Greene',
  'Executive Director',
  'Elevate for Humanity | Workforce Credential Institute',
].join('\n');

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;max-width:620px;">

  <tr><td style="background:#1e293b;padding:28px 32px;text-align:center;">
    <img src="cid:elevate_logo" alt="Elevate for Humanity" width="64" style="display:block;margin:0 auto 10px;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">Workforce Credential Institute &nbsp;|&nbsp; DOL Sponsor &nbsp;|&nbsp; ETPL Listed</p>
  </td></tr>

  <tr><td style="background:#dc2626;padding:16px 32px;text-align:center;">
    <p style="margin:0;color:#fff;font-size:16px;font-weight:700;">Welcome, Sharen &#8212; IT, CPR &amp; Clinical Informatics Program Partner</p>
  </td></tr>

  <tr><td style="padding:32px;">
    <p style="margin:0 0 16px;">Dear Sharen,</p>
    <p style="margin:0 0 20px;line-height:1.7;">My name is <strong>Elizabeth Greene</strong>, Executive Director of <strong>Elevate for Humanity | Workforce Credential Institute</strong>. We are a DOL-registered workforce training organization based in Indianapolis, Indiana, and we are excited to bring you on as our <strong>Program Partner over the Information Technology, CPR, and Clinical Informatics programs</strong>.</p>

    <!-- ROLE -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#f1f5f9;border-left:4px solid #dc2626;padding:16px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 12px;font-size:15px;font-weight:700;">YOUR ROLE: Program Partner &#8212; IT, CPR &amp; Clinical Informatics</p>

      <p style="margin:0 0 6px;font-weight:700;color:#dc2626;">1. Program Delivery</p>
      <ul style="margin:0 0 12px;padding-left:20px;line-height:1.9;font-size:14px;">
        <li>Deliver or oversee instruction for IT, CPR, and Clinical Informatics courses</li>
        <li>Coordinate curriculum aligned to industry-recognized credentials</li>
        <li>Manage cohort scheduling and student progress tracking</li>
      </ul>

      <p style="margin:0 0 6px;font-weight:700;color:#dc2626;">2. Credentialing Support</p>
      <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin-bottom:12px;">
        <tr style="background:#e2e8f0;"><td style="padding:8px 12px;font-weight:700;">Program</td><td style="padding:8px 12px;font-weight:700;">Credentials</td></tr>
        <tr style="background:#f8fafc;"><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:700;">Information Technology</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">CompTIA A+, CompTIA ITF+, Google IT Support</td></tr>
        <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:700;">CPR</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">AHA BLS/CPR Certification</td></tr>
        <tr style="background:#f8fafc;"><td style="padding:8px 12px;font-weight:700;">Clinical Informatics</td><td style="padding:8px 12px;">EHR Specialist, Health IT Certifications</td></tr>
      </table>
      <ul style="margin:0 0 12px;padding-left:20px;line-height:1.9;font-size:14px;">
        <li>Submit completion documentation to Elevate&#8217;s credentialing team</li>
        <li>Coordinate with testing centers for proctored exams</li>
      </ul>

      <p style="margin:0 0 6px;font-weight:700;color:#dc2626;">3. Compliance &amp; Reporting</p>
      <ul style="margin:0;padding-left:20px;line-height:1.9;font-size:14px;">
        <li>Complete monthly progress reports via the Elevate portal</li>
        <li>Maintain CPR Instructor certification (AHA or equivalent) and IT credentials</li>
        <li>Ensure HIPAA compliance for all clinical informatics instruction</li>
      </ul>
    </td></tr></table>

    <!-- MOU -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#fff7ed;border-left:4px solid #f97316;padding:16px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 12px;font-size:15px;font-weight:700;">YOUR COMPENSATION &#8212; MOU STRUCTURE</p>
      <p style="margin:0 0 12px;line-height:1.7;font-size:14px;">Elevate operates on a <strong>1/3 revenue-share model</strong> after credential partner fees and testing costs are deducted. Here are two examples:</p>

      <p style="margin:0 0 8px;font-weight:700;font-size:13px;color:#1e293b;">IT Program (per cohort)</p>
      <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin-bottom:16px;">
        <tr style="background:#1e293b;color:#fff;"><td style="padding:8px 12px;font-weight:700;">Item</td><td style="padding:8px 12px;font-weight:700;text-align:right;">Amount</td></tr>
        <tr style="background:#f8fafc;"><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Tuition per student</td><td style="padding:7px 12px;text-align:right;border-bottom:1px solid #e2e8f0;">$1,800</td></tr>
        <tr><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Cohort size</td><td style="padding:7px 12px;text-align:right;border-bottom:1px solid #e2e8f0;">25 students</td></tr>
        <tr style="background:#f8fafc;"><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Gross revenue</td><td style="padding:7px 12px;text-align:right;border-bottom:1px solid #e2e8f0;font-weight:700;">$45,000</td></tr>
        <tr><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Total deductions (exams, fees, admin)</td><td style="padding:7px 12px;text-align:right;border-bottom:1px solid #e2e8f0;">&#8722;$4,500</td></tr>
        <tr style="background:#dcfce7;"><td style="padding:8px 12px;font-weight:700;color:#166534;">YOUR 1/3 SHARE</td><td style="padding:8px 12px;text-align:right;font-weight:700;color:#166534;">~$13,500</td></tr>
      </table>

      <p style="margin:0 0 8px;font-weight:700;font-size:13px;color:#1e293b;">CPR Class (per class)</p>
      <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin-bottom:12px;">
        <tr style="background:#1e293b;color:#fff;"><td style="padding:8px 12px;font-weight:700;">Item</td><td style="padding:8px 12px;font-weight:700;text-align:right;">Amount</td></tr>
        <tr style="background:#f8fafc;"><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Tuition per student</td><td style="padding:7px 12px;text-align:right;border-bottom:1px solid #e2e8f0;">$75</td></tr>
        <tr><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Class size</td><td style="padding:7px 12px;text-align:right;border-bottom:1px solid #e2e8f0;">20 students</td></tr>
        <tr style="background:#f8fafc;"><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Gross revenue</td><td style="padding:7px 12px;text-align:right;border-bottom:1px solid #e2e8f0;font-weight:700;">$1,500</td></tr>
        <tr><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Total deductions (AHA materials, admin)</td><td style="padding:7px 12px;text-align:right;border-bottom:1px solid #e2e8f0;">&#8722;$300</td></tr>
        <tr style="background:#dcfce7;"><td style="padding:8px 12px;font-weight:700;color:#166534;">YOUR 1/3 SHARE</td><td style="padding:8px 12px;text-align:right;font-weight:700;color:#166534;">~$400</td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:#64748b;">Payment issued within 14 days of cohort/class completion. MOU sent for e-signature before first cohort.</p>
    </td></tr></table>

    <!-- STEPS -->
    <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#dc2626;">YOUR ACTION STEPS &#8212; Complete in Order</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">1</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Submit Your Partnership Application</p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.7;">Complete the IT, CPR &amp; Clinical Informatics program partner application. This registers you as an official Elevate program partner.</p>
        <a href="${APPLY_URL}" style="display:inline-block;background:#dc2626;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Apply Now &#8594;</a>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">2</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Create Your Account</p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.7;">Sign up using <strong>sharen710@gmail.com</strong> and select <strong>Program Partner / Instructor</strong> as your role.</p>
        <a href="${SIGNUP_URL}" style="display:inline-block;background:#1e293b;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Create Account &#8594;</a>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">3</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Complete Onboarding &amp; Upload Documents</p>
        <ul style="margin:0 0 10px;padding-left:20px;font-size:14px;line-height:1.9;">
          <li>Government-issued photo ID</li>
          <li>Signed W-9 form (for payroll)</li>
          <li>CPR Instructor certification (AHA or equivalent)</li>
          <li>IT certifications (CompTIA, Google, Microsoft, etc.)</li>
          <li>Business entity documents (if applicable)</li>
        </ul>
        <a href="${ONBOARD_URL}" style="display:inline-block;background:#1e293b;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Go to Onboarding &#8594;</a>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">4</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Set Up Payroll &amp; Direct Deposit</p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.7;">Go to your dashboard, navigate to <strong>Payroll &amp; Banking</strong>, and enter your direct deposit information. Required before your first cohort payment.</p>
        <a href="${PAYROLL_URL}" style="display:inline-block;background:#1e293b;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Go to Dashboard &#8594;</a>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">5</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Review &amp; Sign the MOU</p>
        <p style="margin:0;font-size:14px;line-height:1.7;">Elizabeth will send the formal Memorandum of Understanding for e-signature once your account is active.</p>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">6</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Confirm Your Start Date</p>
        <p style="margin:0;font-size:14px;line-height:1.7;">Reply to this email with your availability for an onboarding call with Elizabeth.</p>
      </td>
    </tr></table>

    <p style="margin:0 0 6px;line-height:1.7;">We look forward to partnering with you, Sharen.</p>
    <p style="margin:0 0 28px;font-weight:700;">Welcome to the Elevate team.</p>

    <p style="margin:0;line-height:1.8;">Best regards,<br>
    <strong>Elizabeth Greene</strong><br>
    Executive Director<br>
    Elevate for Humanity | Workforce Credential Institute<br>
    <a href="https://www.elevateforhumanity.org" style="color:#dc2626;">www.elevateforhumanity.org</a><br>
    elevate4humanityedu@gmail.com &nbsp;|&nbsp; 317-314-3537</p>
  </td></tr>

  <tr><td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.8;">
      Elevate for Humanity | Workforce Credential Institute<br>
      Indianapolis, Indiana &nbsp;|&nbsp; DOL Sponsor &nbsp;|&nbsp; ETPL Listed &nbsp;|&nbsp; WorkOne Partner<br>
      <a href="https://www.elevateforhumanity.org" style="color:#dc2626;">www.elevateforhumanity.org</a>
    </p>
  </td></tr>

</table></td></tr></table>
</body></html>`;

const payload = JSON.stringify({
  personalizations: [{
    to: [{ email: 'sharen710@gmail.com', name: 'Sharen Douglas-Brown' }],
    cc: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }],
  }],
  from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
  reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
  subject: 'Welcome to Elevate for Humanity — IT, CPR & Clinical Informatics Program Partner Onboarding',
  content: [
    { type: 'text/plain', value: plain },
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
      console.log('✅ Delivered to sharen710@gmail.com (Sharen Douglas-Brown)');
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
