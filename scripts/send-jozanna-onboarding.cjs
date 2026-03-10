#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) { console.error('SENDGRID_API_KEY not set'); process.exit(1); }

const SIGNUP_URL  = 'https://www.elevateforhumanity.org/signup';
const APPLY_URL   = 'https://www.elevateforhumanity.org/partners/programs/beauty-barbering/apply';
const ONBOARD_URL = 'https://www.elevateforhumanity.org/shop/onboarding';
const PAYROLL_URL = 'https://www.elevateforhumanity.org/shop/dashboard';

const logoBase64 = fs.readFileSync(
  path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg')
).toString('base64');

const plain = [
  'Dear Jozanna,',
  '',
  'My name is Elizabeth Greene, Executive Director of Elevate for Humanity | Workforce Credential Institute.',
  'We are a DOL-registered workforce training organization based in Indianapolis, Indiana.',
  '',
  'We are excited to bring you on as our Program Holder over the Beauty and Barbering programs.',
  'Your background as a multi-licensed beauty professional — Nail Technician, Nail Instructor,',
  'and Esthetician — along with your work at Textures Institute of Cosmetology and your',
  'enrollment operations experience with Elevate makes you the ideal lead for these programs.',
  '',
  'This email contains your program application link, onboarding steps, and payroll setup.',
  '',
  '─────────────────────────────────────────────',
  'YOUR ROLE: Program Holder — Beauty & Barbering',
  '─────────────────────────────────────────────',
  '',
  '1. PROGRAM OVERSIGHT',
  '   - Oversee all Beauty and Barbering program operations at Elevate',
  '   - Manage curriculum delivery for Nail Technology, Esthetics, and Barbering courses',
  '   - Coordinate with Textures Institute of Cosmetology on shared resources and enrollment',
  '   - Supervise instructors and ensure program quality standards are met',
  '',
  '2. ENROLLMENT & STUDENT MANAGEMENT',
  '   - Manage enrollment operations for Beauty and Barbering cohorts',
  '   - Guide students through funding options (WIOA, Pell, Job Ready Indy)',
  '   - Track student progress and attendance through the Elevate portal',
  '   - Support students in preparing for state board exams',
  '',
  '3. CREDENTIALING SUPPORT',
  '   - Prepare students for Indiana State Board licensing exams:',
  '       Nail Technology, Esthetics, Cosmetology, Barbering',
  '   - Submit completion documentation to Elevate credentialing team',
  '   - Maintain your own Indiana licenses (Nail Tech, Nail Instructor, Esthetician)',
  '   - Provide copies of all active licenses to Elevate for our records',
  '',
  '4. COMPLIANCE & REPORTING',
  '   - Complete monthly progress reports via the Elevate portal',
  '   - Ensure all instruction meets Indiana Professional Licensing Agency (IPLA) standards',
  '   - Maintain required clock hours documentation for each student',
  '',
  '─────────────────────────────────────────────',
  'YOUR COMPENSATION — MOU STRUCTURE',
  '─────────────────────────────────────────────',
  '',
  'Elevate operates on a 1/3 revenue-share model after credential partner fees and testing costs.',
  '',
  'Example — Nail Technology Program (per cohort):',
  '',
  '  Student tuition (per student):  $2,000',
  '  Cohort size:                    Up to 20 students',
  '  Gross cohort revenue:           $40,000',
  '',
  '  Deductions:',
  '    State board exam fees:        ~$1,500',
  '    Credential partner fees:      ~$500',
  '    Platform & admin:             ~$1,500',
  '  Total deductions:               ~$3,500',
  '',
  '  Net distributable revenue:      $36,500',
  '  YOUR 1/3 SHARE:                 ~$12,167 per cohort',
  '',
  'Payment issued within 14 days of cohort completion.',
  'A formal MOU will be sent for e-signature before your first cohort begins.',
  '',
  '─────────────────────────────────────────────',
  'YOUR ACTION STEPS — COMPLETE IN ORDER',
  '─────────────────────────────────────────────',
  '',
  'STEP 1 — Submit your Program Holder Application',
  '  ' + APPLY_URL,
  '',
  'STEP 2 — Create your account',
  '  ' + SIGNUP_URL,
  '  Use: Jozannageorge@outlook.com',
  '  Select role: Program Partner / Instructor',
  '',
  'STEP 3 — Complete onboarding & upload documents',
  '  ' + ONBOARD_URL,
  '  Upload:',
  '    - Government-issued photo ID',
  '    - Signed W-9 form (for payroll)',
  '    - Indiana Nail Technician license',
  '    - Indiana Nail Instructor license',
  '    - Indiana Esthetician license',
  '    - Any additional cosmetology or barbering licenses',
  '',
  'STEP 4 — Set up payroll & direct deposit',
  '  ' + PAYROLL_URL,
  '  Navigate to Payroll & Banking and enter your direct deposit information.',
  '',
  'STEP 5 — Review and sign the MOU',
  '  Elizabeth will send the MOU for e-signature once your account is active.',
  '',
  'STEP 6 — Confirm your start date',
  '  Reply to this email with your availability for an onboarding call with Elizabeth.',
  '',
  'Best regards,',
  'Elizabeth Greene',
  'Executive Director',
  'Elevate for Humanity | Workforce Credential Institute',
  'elevate4humanityedu@gmail.com | 317-314-3537',
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
    <p style="margin:0;color:#fff;font-size:16px;font-weight:700;">Welcome, Jozanna &#8212; Beauty &amp; Barbering Program Holder</p>
  </td></tr>

  <tr><td style="padding:32px;">
    <p style="margin:0 0 16px;">Dear Jozanna,</p>
    <p style="margin:0 0 16px;line-height:1.7;">My name is <strong>Elizabeth Greene</strong>, Executive Director of <strong>Elevate for Humanity | Workforce Credential Institute</strong>. We are excited to bring you on as our <strong>Program Holder over the Beauty and Barbering programs</strong>.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#f1f5f9;border-left:4px solid #1e293b;padding:14px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0;font-size:14px;line-height:1.8;font-style:italic;color:#475569;">Jozanna is a multi-licensed beauty professional holding Nail Technician, Nail Instructor, and Esthetician licenses. She oversees the nail program at Textures Institute of Cosmetology and manages enrollment operations for Elevate for Humanity.</p>
    </td></tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#f1f5f9;border-left:4px solid #dc2626;padding:16px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 12px;font-size:15px;font-weight:700;">YOUR ROLE: Program Holder &#8212; Beauty &amp; Barbering</p>

      <p style="margin:0 0 6px;font-weight:700;color:#dc2626;">1. Program Oversight</p>
      <ul style="margin:0 0 12px;padding-left:20px;line-height:1.9;font-size:14px;">
        <li>Oversee all Beauty and Barbering program operations at Elevate</li>
        <li>Manage curriculum delivery for Nail Technology, Esthetics, and Barbering courses</li>
        <li>Coordinate with Textures Institute of Cosmetology on shared resources and enrollment</li>
        <li>Supervise instructors and ensure program quality standards are met</li>
      </ul>

      <p style="margin:0 0 6px;font-weight:700;color:#dc2626;">2. Enrollment &amp; Student Management</p>
      <ul style="margin:0 0 12px;padding-left:20px;line-height:1.9;font-size:14px;">
        <li>Manage enrollment operations for Beauty and Barbering cohorts</li>
        <li>Guide students through funding options (WIOA, Pell, Job Ready Indy)</li>
        <li>Track student progress and attendance through the Elevate portal</li>
        <li>Support students in preparing for state board exams</li>
      </ul>

      <p style="margin:0 0 6px;font-weight:700;color:#dc2626;">3. Credentialing Support</p>
      <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin-bottom:10px;">
        <tr style="background:#e2e8f0;"><td style="padding:8px 12px;font-weight:700;">Program</td><td style="padding:8px 12px;font-weight:700;">License / Credential</td></tr>
        <tr style="background:#f8fafc;"><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Nail Technology</td><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Indiana State Board — Nail Tech License</td></tr>
        <tr><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Esthetics</td><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Indiana State Board — Esthetician License</td></tr>
        <tr style="background:#f8fafc;"><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Cosmetology</td><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Indiana State Board — Cosmetology License</td></tr>
        <tr><td style="padding:7px 12px;">Barbering</td><td style="padding:7px 12px;">Indiana State Board — Barber License</td></tr>
      </table>

      <p style="margin:0 0 6px;font-weight:700;color:#dc2626;">4. Compliance &amp; Reporting</p>
      <ul style="margin:0;padding-left:20px;line-height:1.9;font-size:14px;">
        <li>Complete monthly progress reports via the Elevate portal</li>
        <li>Ensure all instruction meets Indiana Professional Licensing Agency (IPLA) standards</li>
        <li>Maintain required clock hours documentation for each student</li>
      </ul>
    </td></tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#fff7ed;border-left:4px solid #f97316;padding:16px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 10px;font-size:15px;font-weight:700;">YOUR COMPENSATION &#8212; MOU STRUCTURE</p>
      <p style="margin:0 0 10px;font-size:14px;line-height:1.7;"><strong>1/3 revenue-share</strong> after credential partner fees and testing costs are deducted.</p>
      <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin-bottom:10px;">
        <tr style="background:#1e293b;color:#fff;"><td style="padding:8px 12px;font-weight:700;">Item</td><td style="padding:8px 12px;font-weight:700;text-align:right;">Amount</td></tr>
        <tr style="background:#f8fafc;"><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Tuition per student</td><td style="padding:7px 12px;text-align:right;border-bottom:1px solid #e2e8f0;">$2,000</td></tr>
        <tr><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Cohort size</td><td style="padding:7px 12px;text-align:right;border-bottom:1px solid #e2e8f0;">Up to 20 students</td></tr>
        <tr style="background:#f8fafc;"><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;font-weight:700;">Gross revenue</td><td style="padding:7px 12px;text-align:right;border-bottom:1px solid #e2e8f0;font-weight:700;">$40,000</td></tr>
        <tr><td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">Total deductions</td><td style="padding:7px 12px;text-align:right;border-bottom:1px solid #e2e8f0;">&#8722;$3,500</td></tr>
        <tr style="background:#dcfce7;"><td style="padding:9px 12px;font-weight:700;color:#166534;">YOUR 1/3 SHARE (per cohort)</td><td style="padding:9px 12px;text-align:right;font-weight:700;color:#166534;font-size:15px;">~$12,167</td></tr>
      </table>
      <p style="margin:0;font-size:12px;color:#64748b;">Payment issued within 14 days of cohort completion. MOU sent for e-signature before first cohort.</p>
    </td></tr></table>

    <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#dc2626;">YOUR ACTION STEPS &#8212; Complete in Order</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;">1</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 4px;font-weight:700;font-size:15px;">Submit Your Program Holder Application</p>
        <p style="margin:0 0 8px;font-size:14px;line-height:1.7;">Register as the official Beauty &amp; Barbering Program Holder at Elevate.</p>
        <a href="${APPLY_URL}" style="display:inline-block;background:#dc2626;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Apply Now &#8594;</a>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;">2</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 4px;font-weight:700;font-size:15px;">Create Your Account</p>
        <p style="margin:0 0 8px;font-size:14px;line-height:1.7;">Sign up using <strong>Jozannageorge@outlook.com</strong> and select <strong>Program Partner / Instructor</strong>.</p>
        <a href="${SIGNUP_URL}" style="display:inline-block;background:#1e293b;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Create Account &#8594;</a>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;">3</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 4px;font-weight:700;font-size:15px;">Complete Onboarding &amp; Upload Documents</p>
        <ul style="margin:0 0 8px;padding-left:20px;font-size:14px;line-height:1.9;">
          <li>Government-issued photo ID</li>
          <li>Signed W-9 form (for payroll)</li>
          <li>Indiana Nail Technician license</li>
          <li>Indiana Nail Instructor license</li>
          <li>Indiana Esthetician license</li>
          <li>Any additional cosmetology or barbering licenses</li>
        </ul>
        <a href="${ONBOARD_URL}" style="display:inline-block;background:#1e293b;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Go to Onboarding &#8594;</a>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;">4</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 4px;font-weight:700;font-size:15px;">Set Up Payroll &amp; Direct Deposit</p>
        <p style="margin:0 0 8px;font-size:14px;line-height:1.7;">Navigate to <strong>Payroll &amp; Banking</strong> in your dashboard and enter your direct deposit information.</p>
        <a href="${PAYROLL_URL}" style="display:inline-block;background:#1e293b;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Go to Dashboard &#8594;</a>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;">5</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 4px;font-weight:700;font-size:15px;">Review &amp; Sign the MOU</p>
        <p style="margin:0;font-size:14px;line-height:1.7;">Elizabeth will send the Memorandum of Understanding for e-signature once your account is active.</p>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;">6</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 4px;font-weight:700;font-size:15px;">Confirm Your Start Date</p>
        <p style="margin:0;font-size:14px;line-height:1.7;">Reply to this email with your availability for an onboarding call with Elizabeth.</p>
      </td>
    </tr></table>

    <p style="margin:0 0 6px;line-height:1.7;">We are excited to have you leading the Beauty and Barbering programs, Jozanna.</p>
    <p style="margin:0 0 28px;font-weight:700;">Welcome aboard.</p>
    <p style="margin:0;line-height:1.8;">Best regards,<br><strong>Elizabeth Greene</strong><br>Executive Director<br>Elevate for Humanity | Workforce Credential Institute<br>
    <a href="https://www.elevateforhumanity.org" style="color:#dc2626;">www.elevateforhumanity.org</a><br>
    elevate4humanityedu@gmail.com &nbsp;|&nbsp; 317-314-3537</p>
  </td></tr>

  <tr><td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.8;">Elevate for Humanity | Workforce Credential Institute<br>
    Indianapolis, Indiana &nbsp;|&nbsp; DOL Sponsor &nbsp;|&nbsp; ETPL Listed &nbsp;|&nbsp; WorkOne Partner<br>
    <a href="https://www.elevateforhumanity.org" style="color:#dc2626;">www.elevateforhumanity.org</a></p>
  </td></tr>

</table></td></tr></table>
</body></html>`;

  const payload = JSON.stringify({
    personalizations: [{
      to: [{ email: 'Jozannageorge@outlook.com', name: 'Jozanna George' }],
      cc: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }],
    }],
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
    reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
    subject: 'Welcome to Elevate for Humanity — Beauty & Barbering Program Holder Onboarding',
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
        console.log('✅ Onboarding email delivered to Jozannageorge@outlook.com');
        console.log('   CC: elevate4humanityedu@gmail.com');
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
