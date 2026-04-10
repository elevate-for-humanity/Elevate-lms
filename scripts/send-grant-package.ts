/**
 * Sends the EmployIndy RFP 2026-003 grant package to elevate4humanityedu@gmail.com
 * via SendGrid. Each document is sent as a separate email with the full
 * company header and document content in the HTML body.
 *
 * Usage: pnpm tsx scripts/send-grant-package.ts
 */

import fs from 'fs';
import path from 'path';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const TO_EMAIL = 'elevate4humanityedu@gmail.com';
const FROM_EMAIL = 'noreply@elevateforhumanity.org';
const FROM_NAME = 'Elevate for Humanity';

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY is not set in .env.local');
  process.exit(1);
}

const PACKAGE_DIR = path.join(
  process.cwd(),
  'docs/grants/employindy-2026-003-package'
);

const DOCUMENTS = [
  {
    file: '00-cover-letter.md',
    subject: 'EmployIndy RFP 2026-003 — Cover Letter | Elevate for Humanity',
  },
  {
    file: '01-table-of-contents.md',
    subject: 'EmployIndy RFP 2026-003 — Table of Contents | Elevate for Humanity',
  },
  {
    file: '02-proposal-narrative.md',
    subject: 'EmployIndy RFP 2026-003 — Proposal Narrative (All Sections) | Elevate for Humanity',
  },
  {
    file: '03-wioa-14-elements-plan.md',
    subject: 'EmployIndy RFP 2026-003 — WIOA 14 Service Elements Plan | Elevate for Humanity',
  },
  {
    file: '04-projected-performance-outcomes.md',
    subject: 'EmployIndy RFP 2026-003 — Projected Performance Outcomes | Elevate for Humanity',
  },
  {
    file: '05-budget-template.md',
    subject: 'EmployIndy RFP 2026-003 — Budget Template & Narrative | Elevate for Humanity',
  },
  {
    file: '06-mou-warren-central.md',
    subject: 'EmployIndy RFP 2026-003 — MOU: Elevate for Humanity & Warren Central High School',
  },
  {
    file: '07-org-chart.md',
    subject: 'EmployIndy RFP 2026-003 — Organizational Chart | Elevate for Humanity',
  },
];

function markdownToHtml(markdown: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; }
  .header { background: #1a3a5c; color: white; padding: 20px 24px; margin-bottom: 32px; border-radius: 4px; }
  .header h1 { margin: 0 0 4px 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px; }
  .header p { margin: 2px 0; font-size: 12px; opacity: 0.85; }
  .header a { color: #90cdf4; text-decoration: none; }
  h1 { color: #1a3a5c; font-size: 22px; border-bottom: 2px solid #1a3a5c; padding-bottom: 8px; }
  h2 { color: #1a3a5c; font-size: 18px; margin-top: 32px; }
  h3 { color: #2d5a8e; font-size: 15px; }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; }
  th { background: #1a3a5c; color: white; padding: 8px 12px; text-align: left; font-size: 13px; }
  td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  tr:nth-child(even) td { background: #f7fafc; }
  pre, code { background: #f1f5f9; padding: 12px; border-radius: 4px; font-size: 12px; overflow-x: auto; white-space: pre-wrap; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 2px solid #1a3a5c; font-size: 11px; color: #666; }
  strong { color: #1a3a5c; }
  ul, ol { padding-left: 24px; }
  li { margin-bottom: 4px; }
  blockquote { border-left: 4px solid #1a3a5c; margin: 0; padding-left: 16px; color: #444; }
</style>
</head>
<body>
<div class="header">
  <h1>ELEVATE FOR HUMANITY</h1>
  <p>DOL Registered Apprenticeship Sponsor &nbsp;|&nbsp; ETPL Provider &nbsp;|&nbsp; WIOA/WRG/JRI Approved</p>
  <p>WorkOne Partner &nbsp;|&nbsp; EmployIndy Partner &nbsp;|&nbsp; SAM.gov Registered (CAGE: 0Q856)</p>
  <p>ByBlack Certified &nbsp;|&nbsp; IMM Certified &nbsp;|&nbsp; CareerSafe OSHA Provider</p>
  <p><a href="https://www.elevateforhumanity.org">www.elevateforhumanity.org</a> &nbsp;|&nbsp; elevate4humanityedu@gmail.com &nbsp;|&nbsp; Indianapolis, Indiana</p>
</div>
<div class="content">
${markdown
  .replace(/^---[\s\S]*?---\n/, '') // strip front matter header block
  .replace(/^#{1} (.+)$/gm, '<h1>$1</h1>')
  .replace(/^#{2} (.+)$/gm, '<h2>$1</h2>')
  .replace(/^#{3} (.+)$/gm, '<h3>$1</h3>')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/^---$/gm, '<hr>')
  .replace(/^- (.+)$/gm, '<li>$1</li>')
  .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
  .replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```\w*\n?/, '').replace(/```$/, '');
    return `<pre><code>${code}</code></pre>`;
  })
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  .replace(/\n\n/g, '</p><p>')
  .replace(/^(?!<[h|u|o|l|p|d|t|b|i|a|c|s|h])/gm, '')
}
</div>
<div class="footer">
  Elevate for Humanity &nbsp;|&nbsp; www.elevateforhumanity.org &nbsp;|&nbsp; Indianapolis, Indiana<br>
  DOL RAP Provider ID 206251 &nbsp;|&nbsp; SAM.gov CAGE: 0Q856 &nbsp;|&nbsp; IMM Certified &nbsp;|&nbsp; ByBlack Certified<br>
  RFP 2026-003 — WIOA In-School Youth Service Provision &nbsp;|&nbsp; Due April 24, 2026
</div>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      reply_to: { email: 'elevate4humanityedu@gmail.com' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`  ❌ SendGrid error: ${error}`);
    return false;
  }
  return true;
}

async function main() {
  console.log(`\n📧 Sending EmployIndy RFP 2026-003 package to ${TO_EMAIL}\n`);
  console.log(`   ${DOCUMENTS.length} documents total\n`);

  let sent = 0;
  let failed = 0;

  for (const doc of DOCUMENTS) {
    const filePath = path.join(PACKAGE_DIR, doc.file);

    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  File not found: ${doc.file} — skipping`);
      failed++;
      continue;
    }

    const markdown = fs.readFileSync(filePath, 'utf-8');
    const html = markdownToHtml(markdown);

    process.stdout.write(`  Sending: ${doc.file} ... `);
    const success = await sendEmail(TO_EMAIL, doc.subject, html);

    if (success) {
      console.log('✅ sent');
      sent++;
    } else {
      console.log('❌ failed');
      failed++;
    }

    // Small delay between sends to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`✅ Sent:   ${sent}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`─────────────────────────────────\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
