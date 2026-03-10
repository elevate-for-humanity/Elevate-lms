#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) { console.error('SENDGRID_API_KEY not set'); process.exit(1); }

const SIGNUP_URL  = 'https://www.elevateforhumanity.org/signup';
const ONBOARD_URL = 'https://www.elevateforhumanity.org/shop/onboarding';
const PAYROLL_URL = 'https://www.elevateforhumanity.org/shop/dashboard';

const logoBase64 = fs.readFileSync(
  path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg')
).toString('base64');

const plain = [
  'Dear Alberta,',
  '',
  'My name is Elizabeth Greene, Executive Director of Elevate for Humanity | Workforce Credential Institute.',
  'We are a DOL-registered workforce training organization based in Indianapolis, Indiana.',
  '',
  'We are excited to officially onboard you as our Testing Center Coordinator and Exam Proctor',
  'over the Elevate for Humanity Workforce Credential Testing Center and Training Room.',
  '',
  'This email contains your onboarding steps, responsibilities, and payroll setup instructions.',
  '',
  '─────────────────────────────────────────────',
  'YOUR ROLE: Testing Center Coordinator & Exam Proctor',
  '─────────────────────────────────────────────',
  '',
  'Alberta Davis serves as Testing Center Coordinator and Exam Proctor at Elevate for Humanity\'s',
  'Workforce Credential Testing Center in Indianapolis. She supports the administration of',
  'industry-recognized certification exams and workforce assessments for individuals, employers,',
  'schools, and workforce development partners.',
  '',
  '1. TESTING CENTER COORDINATION',
  '   - Coordinate testing appointments for all certification exams administered at Elevate',
  '   - Prepare testing stations before each session (equipment check, materials, seating)',
  '   - Assist candidates through the check-in and identity verification process',
  '   - Ensure each testing session begins on time and runs smoothly',
  '   - Maintain the testing room schedule and communicate with program staff',
  '',
  '2. EXAM PROCTORING',
  '   - Monitor in-person and live remote testing sessions',
  '   - Enforce compliance with certification provider policies (Prometric, Certiport, etc.)',
  '   - Maintain exam security standards throughout every session',
  '   - Document any testing incidents and report to Elizabeth Greene within 24 hours',
  '   - Verify candidate identities and eligibility before each exam',
  '',
  '3. PARTNER & COMMUNITY TESTING EVENTS',
  '   - Assist with onsite testing events for partner organizations and workforce programs',
  '   - Help expand access to credential testing opportunities across the Indianapolis community',
  '   - Coordinate with employers, schools, and workforce partners on group testing sessions',
  '',
  '4. TRAINING ROOM OVERSIGHT',
  '   - Maintain a secure, organized, and professional testing and training environment',
  '   - Ensure the training room is properly set up for each cohort and class session',
  '   - Manage room supplies, equipment, and technology (computers, projectors, testing software)',
  '   - Report any facility or equipment issues to administration promptly',
  '',
  '5. COMPLIANCE & REPORTING',
  '   - Complete monthly activity reports via the Elevate portal',
  '   - Maintain all required proctor certifications and training',
  '   - Ensure all testing activity complies with ISDH, DOL, and certification provider standards',
  '',
  '─────────────────────────────────────────────',
  'YOUR COMPENSATION — STAFF STRUCTURE',
  '─────────────────────────────────────────────',
  '',
  'As a staff member, your compensation is based on hours worked and testing sessions proctored.',
  'A formal offer letter and compensation schedule will be provided by Elizabeth Greene.',
  '',
  'Payroll is processed through the Elevate platform on a bi-weekly basis.',
  'Direct deposit is required — setup instructions are in Step 3 below.',
  '',
  '─────────────────────────────────────────────',
  'YOUR ACTION STEPS — COMPLETE IN ORDER',
  '─────────────────────────────────────────────',
  '',
  'STEP 1 — Create your staff account',
  '  ' + SIGNUP_URL,
  '  Use: Cldamd.davis@gmail.com',
  '  Select role: Staff',
  '  Complete your profile with your full name and contact information',
  '',
  'STEP 2 — Complete onboarding & upload documents',
  '  ' + ONBOARD_URL,
  '  Upload:',
  '    - Government-issued photo ID',
  '    - Signed W-9 form (for payroll)',
  '    - Any proctor certifications you currently hold',
  '    - Emergency contact information',
  '',
  'STEP 3 — Set up payroll & direct deposit',
  '  ' + PAYROLL_URL,
  '  Navigate to Payroll & Banking and enter your direct deposit information.',
  '  Required before your first payroll can be issued.',
  '',
  'STEP 4 — Review and sign your staff agreement',
  '  Elizabeth will send your formal staff agreement and offer letter for e-signature',
  '  once your account is active.',
  '',
  'STEP 5 — Confirm your start date',
  '  Reply to this email with your availability for an onboarding orientation with Elizabeth.',
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
  'We are glad to have you officially on the Elevate team, Alberta.',
  'Your dedication to maintaining a professional testing environment makes a real difference',
  'for every candidate who walks through our doors.',
  '',
  'Welcome aboard.',
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
    <p style="margin:0;color:#fff;font-size:16px;font-weight:700;">Welcome, Alberta &#8212; Testing Center Coordinator &amp; Exam Proctor</p>
  </td></tr>

  <tr><td style="padding:32px;">
    <p style="margin:0 0 16px;">Dear Alberta,</p>
    <p style="margin:0 0 20px;line-height:1.7;">My name is <strong>Elizabeth Greene</strong>, Executive Director of <strong>Elevate for Humanity | Workforce Credential Institute</strong>. We are excited to officially onboard you as our <strong>Testing Center Coordinator and Exam Proctor</strong> over the Elevate for Humanity Workforce Credential Testing Center and Training Room.</p>

    <!-- BIO CALLOUT -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#f1f5f9;border-left:4px solid #1e293b;padding:16px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0;font-size:14px;line-height:1.8;font-style:italic;color:#475569;">
        Alberta Davis serves as Testing Center Coordinator and Exam Proctor at Elevate for Humanity&#8217;s Workforce Credential Testing Center in Indianapolis. She supports the administration of industry-recognized certification exams and workforce assessments for individuals, employers, schools, and workforce development partners.
      </p>
    </td></tr></table>

    <!-- RESPONSIBILITIES -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#f1f5f9;border-left:4px solid #dc2626;padding:16px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 14px;font-size:15px;font-weight:700;">YOUR RESPONSIBILITIES</p>

      <p style="margin:0 0 6px;font-weight:700;color:#dc2626;">1. Testing Center Coordination</p>
      <ul style="margin:0 0 14px;padding-left:20px;line-height:1.9;font-size:14px;">
        <li>Coordinate testing appointments for all certification exams administered at Elevate</li>
        <li>Prepare testing stations before each session (equipment, materials, seating)</li>
        <li>Assist candidates through check-in and identity verification</li>
        <li>Ensure each testing session begins on time and runs smoothly</li>
        <li>Maintain the testing room schedule and communicate with program staff</li>
      </ul>

      <p style="margin:0 0 6px;font-weight:700;color:#dc2626;">2. Exam Proctoring</p>
      <ul style="margin:0 0 14px;padding-left:20px;line-height:1.9;font-size:14px;">
        <li>Monitor in-person and live remote testing sessions</li>
        <li>Enforce compliance with certification provider policies (Prometric, Certiport, etc.)</li>
        <li>Maintain exam security standards throughout every session</li>
        <li>Document any testing incidents and report to Elizabeth Greene within 24 hours</li>
        <li>Verify candidate identities and eligibility before each exam</li>
      </ul>

      <p style="margin:0 0 6px;font-weight:700;color:#dc2626;">3. Partner &amp; Community Testing Events</p>
      <ul style="margin:0 0 14px;padding-left:20px;line-height:1.9;font-size:14px;">
        <li>Assist with onsite testing events for partner organizations and workforce programs</li>
        <li>Help expand access to credential testing across the Indianapolis community</li>
        <li>Coordinate with employers, schools, and workforce partners on group testing sessions</li>
      </ul>

      <p style="margin:0 0 6px;font-weight:700;color:#dc2626;">4. Training Room Oversight</p>
      <ul style="margin:0 0 14px;padding-left:20px;line-height:1.9;font-size:14px;">
        <li>Maintain a secure, organized, and professional testing and training environment</li>
        <li>Ensure the training room is properly set up for each cohort and class session</li>
        <li>Manage room supplies, equipment, and technology (computers, projectors, testing software)</li>
        <li>Report any facility or equipment issues to administration promptly</li>
      </ul>

      <p style="margin:0 0 6px;font-weight:700;color:#dc2626;">5. Compliance &amp; Reporting</p>
      <ul style="margin:0;padding-left:20px;line-height:1.9;font-size:14px;">
        <li>Complete monthly activity reports via the Elevate portal</li>
        <li>Maintain all required proctor certifications and training</li>
        <li>Ensure all testing activity complies with ISDH, DOL, and certification provider standards</li>
      </ul>
    </td></tr></table>

    <!-- COMPENSATION -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#fff7ed;border-left:4px solid #f97316;padding:16px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 10px;font-size:15px;font-weight:700;">YOUR COMPENSATION &#8212; STAFF STRUCTURE</p>
      <p style="margin:0 0 10px;font-size:14px;line-height:1.7;">As a staff member, your compensation is based on hours worked and testing sessions proctored. A formal offer letter and compensation schedule will be provided by Elizabeth Greene.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;">Payroll is processed through the Elevate platform on a <strong>bi-weekly basis</strong>. Direct deposit is required &#8212; setup instructions are in Step 3 below.</p>
    </td></tr></table>

    <!-- STEPS -->
    <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#dc2626;">YOUR ACTION STEPS &#8212; Complete in Order</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">1</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Create Your Staff Account</p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.7;">Sign up using <strong>Cldamd.davis@gmail.com</strong> and select <strong>Staff</strong> as your role. Complete your profile with your full name and contact information.</p>
        <a href="${SIGNUP_URL}" style="display:inline-block;background:#dc2626;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Create Staff Account &#8594;</a>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">2</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Complete Onboarding &amp; Upload Documents</p>
        <ul style="margin:0 0 10px;padding-left:20px;font-size:14px;line-height:1.9;">
          <li>Government-issued photo ID</li>
          <li>Signed W-9 form (for payroll &#8212; <a href="https://www.irs.gov/pub/irs-pdf/fw9.pdf" style="color:#dc2626;">download here</a>)</li>
          <li>Any proctor certifications you currently hold</li>
          <li>Emergency contact information</li>
        </ul>
        <a href="${ONBOARD_URL}" style="display:inline-block;background:#1e293b;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Go to Onboarding &#8594;</a>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">3</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Set Up Payroll &amp; Direct Deposit</p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.7;">Go to your dashboard, navigate to <strong>Payroll &amp; Banking</strong>, and enter your direct deposit information. Required before your first payroll can be issued.</p>
        <a href="${PAYROLL_URL}" style="display:inline-block;background:#1e293b;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Go to Dashboard &#8594;</a>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">4</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Review &amp; Sign Your Staff Agreement</p>
        <p style="margin:0;font-size:14px;line-height:1.7;">Elizabeth will send your formal staff agreement and offer letter for e-signature once your account is active.</p>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">5</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Confirm Your Start Date</p>
        <p style="margin:0;font-size:14px;line-height:1.7;">Reply to this email with your availability for an onboarding orientation with Elizabeth.</p>
      </td>
    </tr></table>

    <p style="margin:0 0 6px;line-height:1.7;">We are glad to have you officially on the Elevate team, Alberta. Your dedication to maintaining a professional testing environment makes a real difference for every candidate who walks through our doors.</p>
    <p style="margin:0 0 28px;font-weight:700;">Welcome aboard.</p>

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
    to: [{ email: 'Cldamd.davis@gmail.com', name: 'Alberta Davis' }],
    cc: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }],
  }],
  from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
  reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
  subject: 'Welcome to Elevate for Humanity — Testing Center Coordinator Onboarding',
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
      console.log('✅ Delivered to Cldamd.davis@gmail.com (Alberta Davis)');
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
