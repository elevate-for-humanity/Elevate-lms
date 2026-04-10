/**
 * Generates professional branded PDFs for the EmployIndy RFP 2026-003 grant package
 * and sends each as an email attachment to elevate4humanityedu@gmail.com via SendGrid.
 *
 * Usage: pnpm tsx scripts/send-grant-package-pdf.ts
 */

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const TO_EMAIL = 'elevate4humanityedu@gmail.com';
const FROM_EMAIL = 'noreply@elevateforhumanity.org';
const FROM_NAME = 'Elevate for Humanity';

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY is not set');
  process.exit(1);
}

const PACKAGE_DIR = path.join(
  process.cwd(),
  'docs/grants/employindy-2026-003-package'
);

const OUT_DIR = path.join(process.cwd(), 'docs/grants/employindy-2026-003-pdfs');

const DOCUMENTS = [
  { file: '00-cover-letter.md',               title: 'Cover Letter',                          subject: 'RFP 2026-003 — Cover Letter' },
  { file: '01-table-of-contents.md',           title: 'Table of Contents',                     subject: 'RFP 2026-003 — Table of Contents' },
  { file: '02-proposal-narrative.md',          title: 'Proposal Narrative',                    subject: 'RFP 2026-003 — Proposal Narrative' },
  { file: '03-wioa-14-elements-plan.md',       title: 'WIOA 14 Service Elements Plan',         subject: 'RFP 2026-003 — WIOA 14 Service Elements Plan' },
  { file: '04-projected-performance-outcomes.md', title: 'Projected Performance Outcomes',     subject: 'RFP 2026-003 — Projected Performance Outcomes' },
  { file: '05-budget-template.md',             title: 'Budget Template & Narrative',           subject: 'RFP 2026-003 — Budget Template & Narrative' },
  { file: '06-mou-warren-central.md',          title: 'MOU — Warren Central High School',      subject: 'RFP 2026-003 — MOU: Warren Central High School' },
  { file: '07-org-chart.md',                   title: 'Organizational Chart',                  subject: 'RFP 2026-003 — Organizational Chart' },
];

function markdownToHtml(markdown: string, title: string): string {
  // Strip the header block (between first --- and second ---)
  const content = markdown.replace(/^---[\s\S]*?---\n/, '');

  // Convert markdown to HTML
  let html = content
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr class="divider">')
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/, '').replace(/\n?```$/, '');
      return `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (line) => {
      const cells = line.split('|').filter((c) => c.trim() !== '');
      return '<tr>' + cells.map((c) => `<td>${c.trim()}</td>`).join('') + '</tr>';
    })
    .replace(/^(\|[-| :]+\|)$/gm, '') // remove separator rows
    // Wrap consecutive <tr> in <table>
    .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, (match) => {
      // Make first row a header row
      const rows = match.trim().split('\n').filter(Boolean);
      if (rows.length === 0) return match;
      const header = rows[0].replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
      const body = rows.slice(1).join('\n');
      return `<table><thead>${header}</thead><tbody>${body}</tbody></table>`;
    })
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, '<ul>$&</ul>')
    // Paragraphs
    .split('\n\n')
    .map((block) => {
      if (block.match(/^<[h|u|o|t|p|d|b|i|c|s|h]/)) return block;
      if (block.trim() === '') return '';
      return `<p>${block.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { margin: 0; size: letter; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    color: #111;
    line-height: 1.65;
    margin: 0;
    padding: 0;
    background: white;
  }

  /* ── Header ── */
  .page-header {
    padding: 32px 56px 0 56px;
    border-bottom: 2px solid #111;
    padding-bottom: 12px;
    margin-bottom: 4px;
  }
  .header-org {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 15pt;
    font-weight: bold;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #111;
    margin: 0 0 4px 0;
  }
  .header-creds {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 7.5pt;
    color: #444;
    margin: 0 0 2px 0;
    letter-spacing: 0.2px;
  }
  .header-contact {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 8pt;
    color: #222;
    margin: 4px 0 0 0;
  }

  /* ── Document subtitle ── */
  .doc-subtitle {
    padding: 6px 56px 10px 56px;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 8.5pt;
    color: #333;
    border-bottom: 1px solid #111;
    margin-bottom: 0;
  }

  /* ── Content ── */
  .content {
    padding: 24px 56px 60px 56px;
  }

  h1 {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14pt;
    font-weight: bold;
    color: #111;
    border-bottom: 1.5px solid #111;
    padding-bottom: 5px;
    margin: 20px 0 10px 0;
  }
  h2 {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11.5pt;
    font-weight: bold;
    color: #111;
    margin: 22px 0 6px 0;
    border-bottom: 1px solid #ccc;
    padding-bottom: 3px;
  }
  h3 {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10.5pt;
    font-weight: bold;
    color: #222;
    margin: 16px 0 4px 0;
  }
  h4 {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    font-weight: bold;
    color: #333;
    margin: 12px 0 3px 0;
  }
  p { margin: 0 0 9px 0; }
  strong { font-weight: bold; color: #111; }
  em { font-style: italic; }
  a { color: #111; text-decoration: underline; }

  hr.divider {
    border: none;
    border-top: 1px solid #111;
    margin: 18px 0;
  }

  /* ── Tables ── */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-size: 9.5pt;
    font-family: Arial, Helvetica, sans-serif;
  }
  thead th {
    background: white;
    border-top: 1.5px solid #111;
    border-bottom: 1.5px solid #111;
    padding: 6px 10px;
    text-align: left;
    font-weight: bold;
    font-size: 9pt;
    color: #111;
  }
  tbody td {
    padding: 5px 10px;
    border-bottom: 1px solid #111;
    vertical-align: top;
  }
  tbody tr:last-child td { border-bottom: 1.5px solid #111; }

  /* ── Code / pre ── */
  pre {
    background: white;
    border: 1px solid #ccc;
    padding: 10px 14px;
    font-size: 8.5pt;
    font-family: 'Courier New', monospace;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 10px 0;
  }

  /* ── Lists ── */
  ul { padding-left: 20px; margin: 6px 0 10px 0; }
  li { margin-bottom: 3px; }

  /* ── Page break control ── */
  table { page-break-inside: avoid; }
  pre { page-break-inside: avoid; }
  h1, h2, h3, h4 { page-break-after: avoid; }
  tr { page-break-inside: avoid; }
  ul { page-break-inside: avoid; }

  /* ── Footer ── */
  .page-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #111;
    padding: 5px 56px;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 7.5pt;
    color: #666;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>

<div class="page-header">
  <div class="header-org">Elevate for Humanity</div>
  <div class="header-creds">DOL Registered Apprenticeship Sponsor &nbsp;·&nbsp; ETPL Provider &nbsp;·&nbsp; WIOA / WRG / JRI Approved &nbsp;·&nbsp; WorkOne Partner &nbsp;·&nbsp; EmployIndy Partner &nbsp;·&nbsp; SAM.gov CAGE: 0Q856 &nbsp;·&nbsp; IMM Certified &nbsp;·&nbsp; ByBlack Certified</div>
  <div class="header-contact">www.elevateforhumanity.org &nbsp;·&nbsp; elevate4humanityedu@gmail.com &nbsp;·&nbsp; Indianapolis, Indiana</div>
</div>

<div class="doc-subtitle">
  EmployIndy RFP 2026-003 — WIOA In-School Youth Service Provision &nbsp;·&nbsp; <strong>${title}</strong> &nbsp;·&nbsp; Submission Deadline: April 24, 2026
</div>

<div class="content">
${html}
</div>

<div class="page-footer">
  <span>Elevate for Humanity &nbsp;·&nbsp; www.elevateforhumanity.org &nbsp;·&nbsp; Indianapolis, Indiana &nbsp;·&nbsp; CAGE: 0Q856</span>
  <span>RFP 2026-003 &nbsp;·&nbsp; ${title}</span>
</div>

</body>
</html>`;
}

async function generatePdf(htmlContent: string, outputPath: string): Promise<void> {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'Letter',
    margin: { top: '0', right: '0', bottom: '40px', left: '0' },
    printBackground: true,
  });
  await browser.close();
}

async function sendEmailWithAttachment(
  to: string,
  subject: string,
  pdfPath: string,
  filename: string
): Promise<boolean> {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString('base64');

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
      subject: `Elevate for Humanity | ${subject}`,
      content: [
        {
          type: 'text/html',
          value: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <div style="background:#1a3a5c;color:white;padding:16px 20px;border-radius:4px 4px 0 0;">
                <h2 style="margin:0;font-size:16px;">ELEVATE FOR HUMANITY</h2>
                <p style="margin:4px 0 0;font-size:11px;opacity:0.85;">www.elevateforhumanity.org &nbsp;|&nbsp; Indianapolis, Indiana</p>
              </div>
              <div style="border:1px solid #e2e8f0;border-top:none;padding:20px;border-radius:0 0 4px 4px;">
                <p style="margin:0 0 12px;">Please find attached: <strong>${subject}</strong></p>
                <p style="margin:0 0 12px;">This document is part of Elevate for Humanity's proposal submission for <strong>EmployIndy RFP 2026-003 — WIOA In-School Youth Service Provision</strong>.</p>
                <p style="margin:0 0 4px;font-size:11px;color:#666;">Submission deadline: April 24, 2026, 11:59PM</p>
                <p style="margin:0;font-size:11px;color:#666;">Submit at: <a href="https://employindy.org/contract-opportunities">employindy.org/contract-opportunities</a></p>
              </div>
              <p style="font-size:10px;color:#999;margin-top:16px;">
                Elevate for Humanity &nbsp;|&nbsp; DOL RAP Provider ID 206251 &nbsp;|&nbsp; CAGE: 0Q856 &nbsp;|&nbsp; IMM Certified &nbsp;|&nbsp; ByBlack Certified
              </p>
            </div>
          `,
        },
      ],
      attachments: [
        {
          content: pdfBase64,
          filename,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
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
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\n📄 Generating PDFs and sending to ${TO_EMAIL}\n`);
  console.log(`   ${DOCUMENTS.length} documents\n`);

  const browser_check = await puppeteer.launch({ args: ['--no-sandbox'] });
  await browser_check.close();

  let sent = 0;
  let failed = 0;

  for (const doc of DOCUMENTS) {
    const filePath = path.join(PACKAGE_DIR, doc.file);
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  Not found: ${doc.file} — skipping`);
      failed++;
      continue;
    }

    const pdfFilename = doc.file.replace('.md', '.pdf');
    const pdfPath = path.join(OUT_DIR, pdfFilename);

    process.stdout.write(`  [1/2] Generating PDF: ${pdfFilename} ... `);
    try {
      const markdown = fs.readFileSync(filePath, 'utf-8');
      const html = markdownToHtml(markdown, doc.title);
      await generatePdf(html, pdfPath);
      console.log('✅');
    } catch (err: any) {
      console.log(`❌ ${err.message}`);
      failed++;
      continue;
    }

    process.stdout.write(`  [2/2] Sending email: ${doc.subject} ... `);
    const success = await sendEmailWithAttachment(
      TO_EMAIL,
      doc.subject,
      pdfPath,
      pdfFilename
    );

    if (success) {
      console.log('✅ sent');
      sent++;
    } else {
      console.log('❌ failed');
      failed++;
    }

    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`✅ Sent:   ${sent}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`─────────────────────────────────`);
  console.log(`\n📁 PDFs saved to: docs/grants/employindy-2026-003-pdfs/\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
