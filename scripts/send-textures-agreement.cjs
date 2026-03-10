#!/usr/bin/env node
/**
 * Sends the Textures Institute Partnership Agreement to:
 *   - Jozanna George (Jozannageorge@outlook.com)
 *   - Arthur Harris (arthurncarole@aol.com)
 *   - Elizabeth Greene (elevate4humanityedu@gmail.com) — copy
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM = { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' };
const REPLY_TO = { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' };

const DOC_PATH = '/tmp/Textures_Institute_Partnership_Agreement.docx';

if (!fs.existsSync(DOC_PATH)) {
  console.error('❌ Agreement not found at', DOC_PATH);
  console.error('   Run: node scripts/generate-textures-agreement.cjs first');
  process.exit(1);
}

const docBuffer = fs.readFileSync(DOC_PATH);
const docBase64 = docBuffer.toString('base64');
const FILENAME = 'Textures_Institute_Partnership_Agreement.docx';

function sendEmail(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.sendgrid.com',
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          reject(new Error(`SendGrid ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const attachment = {
  content: docBase64,
  filename: FILENAME,
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  disposition: 'attachment',
};

// ─── Email to Jozanna ────────────────────────────────────────────────────────

const jozannaEmail = {
  from: FROM,
  reply_to: REPLY_TO,
  personalizations: [{ to: [{ email: 'Jozannageorge@outlook.com', name: 'Jozanna George' }] }],
  subject: 'Textures Institute — Partnership Agreement with Elevate for Humanity',
  attachments: [attachment],
  content: [{
    type: 'text/html',
    value: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
        <tr>
          <td style="background:linear-gradient(135deg,#ea580c 0%,#dc2626 100%);padding:30px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:bold">Partnership Agreement</h1>
            <p style="color:#fecaca;margin:8px 0 0;font-size:14px">Textures Institute of Cosmetology × Elevate for Humanity</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="color:#334155;font-size:16px;line-height:1.7;margin:0 0 16px">Hi Jozanna,</p>
            <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px">
              Attached is the Partnership Agreement between <strong>Textures Institute of Cosmetology</strong> and
              <strong>Elevate for Humanity</strong>. This agreement covers the training site relationship,
              credential pathways, and program delivery terms we discussed.
            </p>
            <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px">
              <strong>Next steps:</strong>
            </p>
            <ol style="color:#334155;font-size:15px;line-height:1.9;margin:0 0 20px;padding-left:20px">
              <li>Review the agreement and let us know if you have any questions.</li>
              <li>Forward a copy to <strong>Arthur Harris</strong> (arthurncarole@aol.com) — he is listed as the
                  Authorized Representative for Textures Institute and will need to sign as well.</li>
              <li>Once both parties have reviewed, we will arrange signatures and return executed copies to everyone.</li>
            </ol>
            <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 24px">
              Reply to this email or reach Elizabeth directly at
              <a href="mailto:elevate4humanityedu@gmail.com" style="color:#dc2626">elevate4humanityedu@gmail.com</a>
              with any questions.
            </p>
            <p style="color:#334155;font-size:15px;line-height:1.7;margin:0">
              Thank you for partnering with us — we look forward to building this program together.
            </p>
            <p style="color:#334155;font-size:15px;line-height:1.7;margin:16px 0 0">
              Warm regards,<br>
              <strong>Elizabeth Greene</strong><br>
              Elevate for Humanity
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="color:#64748b;font-size:13px;margin:0">
              Elevate for Humanity | Indianapolis, IN |
              <a href="https://www.elevateforhumanity.org" style="color:#ea580c;text-decoration:none">elevateforhumanity.org</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }],
};

// ─── Email to Arthur ─────────────────────────────────────────────────────────

const arthurEmail = {
  from: FROM,
  reply_to: REPLY_TO,
  personalizations: [{ to: [{ email: 'arthurncarole@aol.com', name: 'Arthur Harris' }] }],
  subject: 'Textures Institute — Partnership Agreement with Elevate for Humanity',
  attachments: [attachment],
  content: [{
    type: 'text/html',
    value: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
        <tr>
          <td style="background:linear-gradient(135deg,#ea580c 0%,#dc2626 100%);padding:30px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:bold">Partnership Agreement</h1>
            <p style="color:#fecaca;margin:8px 0 0;font-size:14px">Textures Institute of Cosmetology × Elevate for Humanity</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="color:#334155;font-size:16px;line-height:1.7;margin:0 0 16px">Hi Arthur,</p>
            <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px">
              My name is Elizabeth Greene with <strong>Elevate for Humanity</strong>. Attached is the
              Partnership Agreement between <strong>Textures Institute of Cosmetology</strong> and Elevate for Humanity.
            </p>
            <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px">
              You are listed as the <strong>Authorized Representative</strong> for Textures Institute in this agreement.
              This document covers the training site relationship, credential pathways (Cosmetology licensure,
              OSHA 10-Hour, ACT WorkKeys/NCRC), and program delivery terms.
            </p>
            <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px">
              <strong>Next steps:</strong>
            </p>
            <ol style="color:#334155;font-size:15px;line-height:1.9;margin:0 0 20px;padding-left:20px">
              <li>Review the attached agreement at your convenience.</li>
              <li>Reply to this email with any questions or requested changes.</li>
              <li>Once both parties are aligned, we will arrange signatures and send executed copies to you,
                  Jozanna George, and Elevate for Humanity.</li>
            </ol>
            <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 24px">
              You can reach me directly at
              <a href="mailto:elevate4humanityedu@gmail.com" style="color:#dc2626">elevate4humanityedu@gmail.com</a>.
              We are excited about this partnership and look forward to connecting with you.
            </p>
            <p style="color:#334155;font-size:15px;line-height:1.7;margin:0">
              Respectfully,<br>
              <strong>Elizabeth Greene</strong><br>
              Elevate for Humanity<br>
              Indianapolis, IN
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="color:#64748b;font-size:13px;margin:0">
              Elevate for Humanity | Indianapolis, IN |
              <a href="https://www.elevateforhumanity.org" style="color:#ea580c;text-decoration:none">elevateforhumanity.org</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }],
};

// ─── Copy to Elizabeth ────────────────────────────────────────────────────────

const elizabethEmail = {
  from: FROM,
  reply_to: REPLY_TO,
  personalizations: [{ to: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }] }],
  subject: '[COPY] Textures Institute Agreement — Sent to Jozanna & Arthur',
  attachments: [attachment],
  content: [{
    type: 'text/html',
    value: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
        <tr>
          <td style="background:#1e293b;padding:24px 30px">
            <h1 style="color:#fff;margin:0;font-size:18px;font-weight:bold">Delivery Confirmation — Textures Institute Agreement</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px">
            <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px">Hi Elizabeth,</p>
            <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px">
              The Textures Institute Partnership Agreement has been sent to both parties. Here is a copy for your records.
            </p>
            <table width="100%" cellpadding="10" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;margin:0 0 20px">
              <tr style="background:#f8fafc">
                <td style="font-size:13px;font-weight:bold;color:#64748b;width:40%">Recipient</td>
                <td style="font-size:13px;font-weight:bold;color:#64748b">Email</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#334155;border-top:1px solid #e2e8f0">Jozanna George</td>
                <td style="font-size:14px;color:#334155;border-top:1px solid #e2e8f0">Jozannageorge@outlook.com</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#334155;border-top:1px solid #e2e8f0">Arthur Harris</td>
                <td style="font-size:14px;color:#334155;border-top:1px solid #e2e8f0">arthurncarole@aol.com</td>
              </tr>
            </table>
            <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0">
              Jozanna's email asks her to forward to Arthur if needed. Arthur's email introduces you and explains his role as Authorized Representative.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }],
};

// ─── Send all three ───────────────────────────────────────────────────────────

async function main() {
  console.log('Sending Textures Institute agreement...\n');

  try {
    await sendEmail(jozannaEmail);
    console.log('✅ Sent to Jozanna George (Jozannageorge@outlook.com)');
  } catch (err) {
    console.error('❌ Jozanna:', err.message);
  }

  try {
    await sendEmail(arthurEmail);
    console.log('✅ Sent to Arthur Harris (arthurncarole@aol.com)');
  } catch (err) {
    console.error('❌ Arthur:', err.message);
  }

  try {
    await sendEmail(elizabethEmail);
    console.log('✅ Copy sent to Elizabeth Greene (elevate4humanityedu@gmail.com)');
  } catch (err) {
    console.error('❌ Elizabeth copy:', err.message);
  }

  console.log('\nDone.');
}

main();
