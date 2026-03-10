#!/usr/bin/env node
/**
 * Sends the full manual contact / phone call list to Elizabeth Greene
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) { console.error('SENDGRID_API_KEY not set'); process.exit(1); }

const logoBase64 = fs.readFileSync(
  path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg')
).toString('base64');

const SECTIONS = [
  {
    title: 'CNA Clinical Partners — Phone Follow-Up',
    color: '#dc2626',
    contacts: [
      { org: 'Greenwood Village South',       name: 'Jordan Morrow (ED)',    phone: '317-859-4441',   note: 'Ask for Jordan Morrow or Director of Nursing' },
      { org: 'Greenwood Village South',       name: 'Alexa Ulrey RN (DON)',  phone: '317-859-4441',   note: 'Ask for Alexa Ulrey, Director of Nursing' },
      { org: 'Bloom at Eagle Creek',          name: 'Administration',        phone: '—',              note: 'admin@bloomateaglecreek.com — email sent' },
      { org: 'Bloom at Willow',               name: 'Administration',        phone: '—',              note: 'admin@bloomatwillow.com — email sent' },
      { org: 'Hooverwood Living',             name: 'Leadership Team',       phone: '—',              note: 'info@hooverwood.org — email sent, follow up by phone' },
    ],
  },
  {
    title: 'Healthcare — Phlebotomy & Medical Assistant',
    color: '#7c3aed',
    contacts: [
      { org: 'Indiana University Health',     name: 'Workforce Development', phone: '(317) 962-2000', note: 'Ask for Workforce Development or HR Partnerships' },
      { org: 'Community Health Network',      name: 'HR / Workforce Dev',    phone: '(317) 621-6262', note: 'Ask for HR or Workforce Development' },
      { org: 'Ascension St. Vincent',         name: 'HR / Education',        phone: '(317) 338-2345', note: 'Ask for HR or Education Partnerships' },
      { org: 'Labcorp',                       name: 'Regional Recruiting',   phone: '(800) 845-6167', note: 'Ask for Regional Recruiting or Workforce Partnerships' },
      { org: 'Quest Diagnostics',             name: 'Regional HR',           phone: '(866) 697-8378', note: 'Ask for Regional HR or Training Partnerships' },
      { org: 'American Health Network',       name: 'HR / Practice Ops',     phone: '—',              note: 'Contact form: ahni.com — ask for HR or Practice Operations' },
    ],
  },
  {
    title: 'HVAC — Contractors & Employers',
    color: '#d97706',
    contacts: [
      { org: 'Plumbers & Steamfitters Local 440', name: 'Training Coordinator', phone: '(317) 872-1622', note: 'Ask for Training Coordinator or Apprenticeship Director' },
      { org: 'Williams Comfort Air',           name: 'Service Manager / HR',  phone: '(317) 268-5900', note: 'Ask for Service Manager or HR' },
      { org: 'Service Plus Heating & Cooling', name: 'Service Manager / HR',  phone: '(317) 434-2627', note: 'Ask for Service Manager or HR' },
      { org: 'Peterman Brothers',              name: 'Service Manager / HR',  phone: '(317) 859-4270', note: 'Ask for Service Manager or HR' },
      { org: 'Godby Heating Plumbing Elec.',   name: 'Service Manager',       phone: '(317) 870-8400', note: 'Ask for Service Manager — mention apprenticeship training' },
      { org: 'R.T. Moore Company',             name: 'HR / Workforce Dev',    phone: '(317) 823-1500', note: 'Ask for HR or Workforce Development' },
      { org: 'One Hour Heating & Air',         name: 'Service Manager',       phone: '(317) 742-6699', note: 'Ask for Service Manager' },
      { org: 'GEMCO Constructors',             name: 'HR / Project Manager',  phone: '(317) 423-0200', note: 'Ask for HR or Project Manager' },
    ],
  },
  {
    title: 'HVAC — Distributors (Branch Manager)',
    color: '#059669',
    contacts: [
      { org: 'Johnstone Supply Indianapolis',  name: 'Branch Manager',        phone: '(317) 926-5186', note: '1050 E 30th St — ask for Branch Manager' },
      { org: 'Ferguson Indianapolis',          name: 'Branch Manager',        phone: '(317) 334-1700', note: '8230 Zionsville Rd — ask for Branch Manager' },
      { org: 'R.E. Michel Company',            name: 'Branch Manager',        phone: '(317) 293-8060', note: '6641 Guion Rd — ask for Branch Manager' },
      { org: 'United Refrigeration',           name: 'Branch Manager',        phone: '(317) 872-9233', note: '5150 W 84th St — ask for Branch Manager' },
      { org: 'Gemaire Distributors',           name: 'Branch Manager',        phone: '(317) 291-3535', note: '4020 Industrial Blvd — ask for Branch Manager' },
    ],
  },
  {
    title: 'CDL / Transportation',
    color: '#1d4ed8',
    contacts: [
      { org: 'Knight Transportation',          name: 'Recruiting',            phone: '(317) 486-1770', note: '3875 Plainfield Rd — ask for Recruiting or Workforce Partnerships' },
      { org: 'CPC Logistics',                  name: 'Recruiting',            phone: '(317) 779-1098', note: '7301 Georgetown Rd — ask for Recruiting Manager' },
      { org: 'Wayne Transports',               name: 'HR / Recruiting',       phone: '—',              note: 'Contact form: waynetransports.com' },
      { org: 'Buske Logistics',                name: 'HR / Recruiting',       phone: '—',              note: 'Contact form: buske.com' },
      { org: 'Schneider National',             name: 'Driver Recruiting',     phone: '(800) 558-6767', note: 'Contact form: schneiderjobs.com/contact' },
      { org: 'Roehl Transport',                name: 'Driver Recruiting',     phone: '(715) 591-7050', note: 'Contact form: roehl.jobs/contact-us' },
      { org: 'J.B. Hunt Transport',            name: 'Driver Recruiting',     phone: '(800) 777-4968', note: 'Contact form: jbhunt.com/contact-us' },
      { org: 'Indiana DWD',                    name: 'Workforce Programs',    phone: '(317) 232-6702', note: 'Contact form: in.gov/dwd — CDL training funding' },
    ],
  },
  {
    title: 'Construction — Contractors & Apprenticeship',
    color: '#0f172a',
    contacts: [
      { org: 'Messer Construction',            name: 'Workforce Dev / HR',    phone: '(317) 576-9250', note: 'Contact form: messer.com — ask for Workforce Development' },
      { org: 'IEC Indy',                       name: 'Apprenticeship Dir.',   phone: '(317) 562-1102', note: 'Contact form: iec-indy.org — ask for Apprenticeship Director' },
      { org: 'Bricklayers Local 4',            name: 'Training Coordinator',  phone: '(800) 322-2830', note: 'Ask for Training Coordinator' },
      { org: 'Indiana State Bldg Trades',      name: 'Executive Director',    phone: '—',              note: 'Contact form: isbctc.org' },
    ],
  },
  {
    title: 'Manufacturing',
    color: '#475569',
    contacts: [
      { org: 'Allison Transmission',           name: 'Workforce Dev / HR',    phone: '(317) 242-5000', note: 'Contact form: allisontransmission.com/contact' },
      { org: 'Rolls-Royce North America',      name: 'Workforce Dev / HR',    phone: '—',              note: 'Contact form: rolls-royce.com/contact.aspx' },
      { org: 'Eli Lilly and Company',          name: 'Workforce Dev / HR',    phone: '—',              note: 'Contact form: lilly.com/contact' },
    ],
  },
];

const CALL_SCRIPT = `CALL SCRIPT (use for all calls):
"Hi, my name is Elizabeth Greene and I am the Executive Director of Elevate for Humanity.
We are a workforce training and credential organization based in Indianapolis.
I sent an email recently about a potential partnership and wanted to follow up.
Could I speak with [Director of Nursing / Service Manager / Branch Manager / HR Partnerships]?"

If asked what it is about:
"We train individuals for [CNA / HVAC / CDL / Medical Assistant / Phlebotomy] careers
and are building employer partnerships so our graduates can go directly into jobs.
We are also a DOL sponsor and work with WorkOne and Job Ready Indy."`;

function buildHtml() {
  let sectionsHtml = '';

  for (const section of SECTIONS) {
    const rows = section.contacts.map(c => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px;font-size:13px;font-weight:600;color:#1e293b;">${c.org}</td>
        <td style="padding:10px 12px;font-size:13px;color:#475569;">${c.name}</td>
        <td style="padding:10px 12px;font-size:13px;color:#1e293b;font-weight:600;">${c.phone}</td>
        <td style="padding:10px 12px;font-size:13px;color:#64748b;">${c.note}</td>
      </tr>`).join('');

    sectionsHtml += `
      <tr>
        <td colspan="4" style="padding:16px 12px 8px;background:#f8fafc;">
          <span style="display:inline-block;background:${section.color};color:white;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:4px;">${section.title}</span>
        </td>
      </tr>
      ${rows}`;
  }

  const total = SECTIONS.reduce((sum, s) => sum + s.contacts.length, 0);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
<tr><td align="center">
<table width="900" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">

  <tr><td style="background:#1e293b;padding:24px 32px;text-align:center;">
    <img src="cid:elevate_logo" alt="Elevate for Humanity" width="60" style="display:block;margin:0 auto 8px;">
    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">Full Phone Call List</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">All manual contacts requiring phone or form outreach — Elevate for Humanity</p>
  </td></tr>

  <tr><td style="padding:24px 32px;background:#f0fdf4;border-bottom:1px solid #e2e8f0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;">
          <p style="margin:0;font-size:32px;font-weight:800;color:#16a34a;">${total}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Total Contacts</p>
        </td>
        <td style="text-align:center;">
          <p style="margin:0;font-size:32px;font-weight:800;color:#dc2626;">${SECTIONS.length}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Industries</p>
        </td>
        <td style="text-align:center;">
          <p style="margin:0;font-size:32px;font-weight:800;color:#1d4ed8;">34</p>
          <p style="margin:4px 0 0;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Emails Already Sent</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:24px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Organization</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Contact</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Phone</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Notes</th>
        </tr>
      </thead>
      <tbody>${sectionsHtml}</tbody>
    </table>
  </td></tr>

  <tr><td style="padding:0 32px 24px;">
    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:16px 20px;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#854d0e;">Call Script</p>
      <p style="margin:0;font-size:13px;color:#713f12;line-height:1.7;white-space:pre-line;">${CALL_SCRIPT}</p>
    </div>
  </td></tr>

  <tr><td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;">
    <p style="margin:0;font-size:12px;color:#64748b;">
      Elevate for Humanity &nbsp;|&nbsp;
      <a href="mailto:elevate4humanityedu@gmail.com" style="color:#dc2626;">elevate4humanityedu@gmail.com</a> &nbsp;|&nbsp;
      317-314-3537
    </p>
  </td></tr>

</table></td></tr></table></body></html>`;
}

const total = SECTIONS.reduce((sum, s) => sum + s.contacts.length, 0);

const payload = JSON.stringify({
  personalizations: [{ to: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }] }],
  from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
  reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
  subject: `Full Phone Call List — ${total} Contacts | Elevate for Humanity`,
  content: [
    {
      type: 'text/plain',
      value: SECTIONS.map(s =>
        `\n${s.title.toUpperCase()}\n` +
        s.contacts.map(c => `  ${c.org} | ${c.name} | ${c.phone} | ${c.note}`).join('\n')
      ).join('\n') + '\n\n' + CALL_SCRIPT,
    },
    { type: 'text/html', value: buildHtml() },
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
      console.log(`✅ Call list delivered to elevate4humanityedu@gmail.com`);
      console.log(`   ${total} contacts across ${SECTIONS.length} industries`);
      console.log(`   Timestamp: ${new Date().toISOString()}`);
    } else {
      console.log(`❌ Failed (${res.statusCode}): ${d}`);
    }
  });
});
req.on('error', console.error);
req.write(payload);
req.end();
