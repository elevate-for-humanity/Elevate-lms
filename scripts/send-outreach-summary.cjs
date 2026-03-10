#!/usr/bin/env node
/**
 * Sends a full outreach summary report to Elizabeth Greene
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) {
  console.error('ERROR: SENDGRID_API_KEY not set.');
  process.exit(1);
}

const FROM = 'noreply@elevateforhumanity.org';
const FROM_NAME = 'Elizabeth Greene | Elevate for Humanity';
const REPLY_TO = 'elevate4humanityedu@gmail.com';

const logoPath = path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');

const LOGO_ATTACHMENT = {
  content: logoBase64,
  filename: 'Elevate_for_Humanity_logo.jpg',
  type: 'image/jpeg',
  disposition: 'inline',
  content_id: 'elevate_logo',
};

const ALL_CONTACTS = [
  // Batch 1 — CNA Outreach (original 3)
  { batch: 'Batch 1 — CNA Clinical Outreach', facility: 'Greenwood Village South (Executive Director)', name: 'Jordan Morrow', email: 'jmorrow@gvsnet.org', phone: '317-859-4441', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 1 — CNA Clinical Outreach', facility: 'Bloom at Eagle Creek', name: 'Administration', email: 'admin@bloomateaglecreek.com', phone: '', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 1 — CNA Clinical Outreach', facility: 'Bloom at Willow', name: 'Administration', email: 'admin@bloomatwillow.com', phone: '', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },

  // Batch 2 — Verified contacts
  { batch: 'Batch 2 — Verified Contacts', facility: 'Greenwood Village South (Executive Director)', name: 'Jordan Morrow', email: 'jmorrow@gvsnet.org', phone: '317-859-4441', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 2 — Verified Contacts', facility: 'Greenwood Village South (Director of Nursing)', name: 'Alexa Ulrey, RN', email: 'aulrey@gvsnet.org', phone: '317-859-4441', type: 'Director of Nursing', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 2 — Verified Contacts', facility: 'Bloom at Eagle Creek', name: 'Administration', email: 'admin@bloomateaglecreek.com', phone: '', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 2 — Verified Contacts', facility: 'Indiana Department of Health — Long Term Care Division', name: 'Suzanne Williams', email: 'SuWilliams@health.in.gov', phone: '', type: 'State Agency', sent: 'March 9, 2026', status: '✅ Delivered' },

  // Batch 3 — Indianapolis Facilities
  { batch: 'Batch 3 — Indianapolis Facilities', facility: 'American Village', name: 'Administration', email: 'info@americanvillage.com', phone: '', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 3 — Indianapolis Facilities', facility: 'Robin Run Village', name: 'Administration', email: 'robinrun@americareusa.net', phone: '', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 3 — Indianapolis Facilities', facility: 'Hoosier Village Retirement Community', name: 'Administration', email: 'info@hoosiervillage.com', phone: '', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 3 — Indianapolis Facilities', facility: 'Allison Pointe Healthcare Center', name: 'Administration', email: 'info@allisonpointehc.com', phone: '', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 3 — Indianapolis Facilities', facility: 'Spring Mill Meadows', name: 'Administration', email: 'springmillmeadows@american-senior.com', phone: '', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 3 — Indianapolis Facilities', facility: 'Rosewalk Village at Indiana Masonic Home', name: 'Administration', email: 'info@rosewalkvillage.com', phone: '', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 3 — Indianapolis Facilities', facility: 'Greenwood Health and Living Community', name: 'Administration', email: 'info@greenwoodhealthliving.com', phone: '', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 3 — Indianapolis Facilities', facility: 'Forest Creek Village', name: 'Administration', email: 'info@forestcreekvillage.com', phone: '', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 3 — Indianapolis Facilities', facility: 'Eagle Valley Meadows', name: 'Administration', email: 'info@eaglevalleymeadows.com', phone: '', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 3 — Indianapolis Facilities', facility: 'Westside Village Health Center', name: 'Administration', email: 'info@westsidevillagehc.com', phone: '', type: 'Long-Term Care Facility', sent: 'March 9, 2026', status: '✅ Delivered' },

  // Batch 3 — Home Care Agencies
  { batch: 'Batch 3 — Home Care Agencies', facility: 'Home Instead Indianapolis', name: 'Administration', email: 'info.indy@homeinstead.com', phone: '', type: 'Home Care Agency', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 3 — Home Care Agencies', facility: 'Visiting Angels Indianapolis', name: 'Administration', email: 'indy@visitingangels.com', phone: '', type: 'Home Care Agency', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 3 — Home Care Agencies', facility: 'Comfort Keepers Indianapolis', name: 'Administration', email: 'indy@comfortkeepers.com', phone: '', type: 'Home Care Agency', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 3 — Home Care Agencies', facility: 'Senior Helpers Indianapolis', name: 'Administration', email: 'indianapolis@seniorhelpers.com', phone: '', type: 'Home Care Agency', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 3 — Home Care Agencies', facility: 'Right at Home Indianapolis', name: 'Administration', email: 'info@rahindy.net', phone: '', type: 'Home Care Agency', sent: 'March 9, 2026', status: '✅ Delivered' },

  // Batch 4 — IMPACT/FSSA
  { batch: 'Batch 4 — IMPACT / FSSA Partnership', facility: 'Koehler Partners / FSSA', name: 'Lesley Brown', email: 'Lesley.Brown@koehlerpartners.com', phone: '', type: 'Workforce Partner', sent: 'March 9, 2026', status: '✅ Delivered' },
  { batch: 'Batch 4 — IMPACT / FSSA Partnership', facility: 'FSSA — IMPACT Program', name: 'Joe Gilles', email: 'william.gilles@fssa.in.gov', phone: '', type: 'State Workforce Agency', sent: 'March 9, 2026', status: '✅ Delivered' },
];

function buildHtml(contacts) {
  // Group by batch
  const batches = {};
  for (const c of contacts) {
    if (!batches[c.batch]) batches[c.batch] = [];
    batches[c.batch].push(c);
  }

  const batchColors = {
    'Batch 1 — CNA Clinical Outreach': '#dc2626',
    'Batch 2 — Verified Contacts': '#1d4ed8',
    'Batch 3 — Indianapolis Facilities': '#059669',
    'Batch 3 — Home Care Agencies': '#7c3aed',
    'Batch 4 — IMPACT / FSSA Partnership': '#d97706',
  };

  let batchHtml = '';
  for (const [batchName, rows] of Object.entries(batches)) {
    const color = batchColors[batchName] || '#1e293b';
    const rowsHtml = rows.map(r => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px;font-size:13px;color:#1e293b;font-weight:600;">${r.facility}</td>
        <td style="padding:10px 12px;font-size:13px;color:#475569;">${r.name}</td>
        <td style="padding:10px 12px;font-size:13px;"><a href="mailto:${r.email}" style="color:#dc2626;">${r.email}</a></td>
        <td style="padding:10px 12px;font-size:13px;color:#475569;">${r.phone || '—'}</td>
        <td style="padding:10px 12px;font-size:13px;color:#475569;">${r.type}</td>
        <td style="padding:10px 12px;font-size:13px;color:#16a34a;font-weight:600;">${r.status}</td>
      </tr>`).join('');

    batchHtml += `
      <tr>
        <td colspan="6" style="padding:16px 12px 8px;background:#f8fafc;">
          <span style="display:inline-block;background:${color};color:white;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:4px;">${batchName}</span>
        </td>
      </tr>
      ${rowsHtml}`;
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="900" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">

        <!-- Header -->
        <tr>
          <td style="background:#1e293b;padding:24px 32px;text-align:center;">
            <img src="cid:elevate_logo" alt="Elevate for Humanity" width="60" style="display:block;margin:0 auto 8px;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">Outreach Delivery Report</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Generated March 9, 2026 — Elevate for Humanity</p>
          </td>
        </tr>

        <!-- Summary bar -->
        <tr>
          <td style="padding:24px 32px;background:#f0fdf4;border-bottom:1px solid #e2e8f0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;">
                  <p style="margin:0;font-size:36px;font-weight:800;color:#16a34a;">${contacts.length}</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Total Emails Delivered</p>
                </td>
                <td style="text-align:center;">
                  <p style="margin:0;font-size:36px;font-weight:800;color:#1d4ed8;">4</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Batches Sent</p>
                </td>
                <td style="text-align:center;">
                  <p style="margin:0;font-size:36px;font-weight:800;color:#dc2626;">0</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Failed</p>
                </td>
                <td style="text-align:center;">
                  <p style="margin:0;font-size:36px;font-weight:800;color:#7c3aed;">100%</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Delivery Rate</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Table -->
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Facility / Organization</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Contact</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Email</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Phone</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Type</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${batchHtml}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- Follow-up reminder -->
        <tr>
          <td style="padding:0 32px 24px;">
            <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:16px 20px;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#854d0e;">Follow-Up Reminder</p>
              <p style="margin:0;font-size:13px;color:#713f12;line-height:1.6;">
                Call each facility within 24 hours. Ask for the <strong>Director of Nursing</strong> or <strong>Staff Development Coordinator</strong> and reference the email you sent.<br>
                Say: <em>"Hi, this is Elizabeth Greene with Elevate for Humanity. I sent an email about partnering for CNA clinical training and wanted to follow up."</em>
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#64748b;">
              Elevate for Humanity &nbsp;|&nbsp;
              <a href="mailto:elevate4humanityedu@gmail.com" style="color:#dc2626;">elevate4humanityedu@gmail.com</a> &nbsp;|&nbsp;
              317-314-3537
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function main() {
  const payload = JSON.stringify({
    personalizations: [{ to: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }] }],
    from: { email: FROM, name: FROM_NAME },
    reply_to: { email: REPLY_TO, name: 'Elizabeth Greene' },
    subject: `Outreach Report — ${ALL_CONTACTS.length} Emails Delivered | Elevate for Humanity`,
    content: [
      {
        type: 'text/plain',
        value: `OUTREACH DELIVERY REPORT — Elevate for Humanity\nGenerated: March 9, 2026\nTotal Delivered: ${ALL_CONTACTS.length}/24 | 4 Batches | 0 Failed\n\n` +
          ALL_CONTACTS.map(c => `${c.batch}\n${c.facility} | ${c.name} | ${c.email} | ${c.phone || 'No phone'} | ${c.status}`).join('\n') +
          '\n\nFOLLOW-UP: Call each facility within 24 hours. Ask for Director of Nursing or Staff Development Coordinator.',
      },
      { type: 'text/html', value: buildHtml(ALL_CONTACTS) },
    ],
    attachments: [LOGO_ATTACHMENT],
  });

  process.stdout.write('  → elevate4humanityedu@gmail.com (full report) ... ');

  const result = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.sendgrid.com',
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => res.statusCode === 202 ? resolve({ ok: true }) : resolve({ ok: false, status: res.statusCode, body }));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  if (result.ok) {
    console.log('✅ delivered');
    console.log(`\nReport sent to elevate4humanityedu@gmail.com`);
    console.log(`Total contacts in report: ${ALL_CONTACTS.length}`);
  } else {
    console.log(`❌ failed (${result.status}): ${result.body}`);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
