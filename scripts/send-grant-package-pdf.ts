/**
 * Generates professional government-style branded PDFs for EmployIndy RFP 2026-003
 * and sends each as an email attachment to elevate4humanityedu@gmail.com.
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

if (!SENDGRID_API_KEY) { console.error('❌ SENDGRID_API_KEY not set'); process.exit(1); }

const PACKAGE_DIR = path.join(process.cwd(), 'docs/grants/employindy-2026-003-package');
const OUT_DIR     = path.join(process.cwd(), 'docs/grants/employindy-2026-003-pdfs');
const LOGO_PATH   = path.join(process.cwd(), 'public/images/Elevate_for_Humanity_logo_81bf0fab.jpg');
const LOGO_B64    = fs.existsSync(LOGO_PATH)
  ? `data:image/jpeg;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`
  : '';

const DOCUMENTS = [
  { file: '00-cover-letter.md',                         title: 'Cover Letter',                           subject: 'RFP 2026-003 — Cover Letter' },
  { file: '01-table-of-contents.md',                    title: 'Table of Contents',                      subject: 'RFP 2026-003 — Table of Contents' },
  { file: '02-proposal-narrative.md',                   title: 'Proposal Narrative',                     subject: 'RFP 2026-003 — Proposal Narrative' },
  { file: '03-wioa-14-elements-plan.md',                title: 'WIOA 14 Service Elements Plan',          subject: 'RFP 2026-003 — WIOA 14 Service Elements Plan' },
  { file: '04-projected-performance-outcomes.md',       title: 'Projected Performance Outcomes',         subject: 'RFP 2026-003 — Projected Performance Outcomes' },
  { file: '05-budget-template.md',                      title: 'Budget Template & Narrative',            subject: 'RFP 2026-003 — Budget Template & Narrative' },
  { file: '06-mou-warren-central.md',                   title: 'MOU — Warren Central High School',       subject: 'RFP 2026-003 — MOU: Warren Central High School' },
  { file: '07-org-chart.md',                            title: 'Organizational Chart',                   subject: 'RFP 2026-003 — Organizational Chart' },
  { file: '08-letter-of-recognition-warren-central.md', title: 'Letter of Recognition — Warren Central', subject: 'RFP 2026-003 — Letter of Recognition: Warren Central' },
];

function mdToBody(md: string): string {
  let s = md.replace(/^---[\s\S]*?---\n/, '').trim();
  s = s.replace(/```[\s\S]*?```/g, m => {
    const code = m.replace(/```\w*\n?/, '').replace(/\n?```$/, '');
    return `<pre>${code.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`;
  });
  s = s.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  s = s.replace(/^### (.+)$/gm,  '<h3>$1</h3>');
  s = s.replace(/^## (.+)$/gm,   '<h2>$1</h2>');
  s = s.replace(/^# (.+)$/gm,    '<h1>$1</h1>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g,     '<em>$1</em>');
  s = s.replace(/^---$/gm, '<hr>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/(^\|.+\|\n)+/gm, block => {
    const rows = block.trim().split('\n').filter(r => !/^\|[-| :]+\|$/.test(r));
    if (!rows.length) return block;
    const cells = (row: string, tag: string) =>
      '<tr>' + row.split('|').filter((_,i,a) => i>0 && i<a.length-1)
        .map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
    return `<table><thead>${cells(rows[0],'th')}</thead><tbody>${rows.slice(1).map(r=>cells(r,'td')).join('')}</tbody></table>`;
  });
  s = s.replace(/(^- .+\n?)+/gm, block =>
    `<ul>${block.trim().split('\n').map(l=>`<li>${l.replace(/^- /,'')}</li>`).join('')}</ul>`);
  s = s.replace(/(^\d+\. .+\n?)+/gm, block =>
    `<ol>${block.trim().split('\n').map(l=>`<li>${l.replace(/^\d+\. /,'')}</li>`).join('')}</ol>`);
  s = s.split(/\n{2,}/).map(b => {
    b = b.trim();
    if (!b) return '';
    if (/^<[huptodblicaes]/i.test(b)) return b;
    return `<p>${b.replace(/\n/g,' ')}</p>`;
  }).join('\n');
  return s;
}

function buildHtml(md: string, title: string, num: number, total: number): string {
  const body = mdToBody(md);
  const logoTag = LOGO_B64 ? `<img src="${LOGO_B64}" class="logo" alt="Elevate for Humanity">` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Times New Roman',Times,serif;font-size:10.5pt;color:#111;line-height:1.6;background:white}
  .letterhead{display:flex;align-items:center;gap:14px;padding-bottom:10pt;border-bottom:2pt solid #111;margin-bottom:6pt}
  .logo{height:60px;width:auto;flex-shrink:0}
  .org-name{font-family:Arial,sans-serif;font-size:13.5pt;font-weight:bold;letter-spacing:.8px;text-transform:uppercase;color:#111}
  .org-creds{font-family:Arial,sans-serif;font-size:7pt;color:#333;margin-top:3px;line-height:1.6}
  .doc-block{margin:8pt 0 14pt;padding-bottom:6pt;border-bottom:1pt solid #111}
  .doc-block .lbl{font-family:Arial,sans-serif;font-size:7.5pt;color:#555;text-transform:uppercase;letter-spacing:.4px}
  .doc-block .ttl{font-family:Arial,sans-serif;font-size:12pt;font-weight:bold;color:#111;margin-top:2pt}
  .doc-block .meta{font-family:Arial,sans-serif;font-size:7.5pt;color:#555;margin-top:2pt}
  h1{font-family:Arial,sans-serif;font-size:12.5pt;font-weight:bold;border-bottom:1.5pt solid #111;padding-bottom:3pt;margin:16pt 0 8pt;page-break-after:avoid}
  h2{font-family:Arial,sans-serif;font-size:11pt;font-weight:bold;border-bottom:.75pt solid #111;padding-bottom:2pt;margin:13pt 0 6pt;page-break-after:avoid}
  h3{font-family:Arial,sans-serif;font-size:10pt;font-weight:bold;margin:10pt 0 4pt;page-break-after:avoid}
  h4{font-family:Arial,sans-serif;font-size:9.5pt;font-weight:bold;margin:8pt 0 3pt;page-break-after:avoid}
  p{margin:0 0 7pt;text-align:justify}
  strong{font-weight:bold}
  em{font-style:italic}
  a{color:#111;text-decoration:none}
  hr{border:none;border-top:.75pt solid #111;margin:12pt 0}
  table{width:100%;border-collapse:collapse;margin:8pt 0 10pt;font-family:Arial,sans-serif;font-size:9pt;page-break-inside:avoid}
  thead th{font-weight:bold;font-size:8.5pt;text-align:left;padding:5pt 7pt;border-top:1.5pt solid #111;border-bottom:1.5pt solid #111;background:white}
  tbody td{padding:4pt 7pt;border-bottom:.5pt solid #111;vertical-align:top}
  tbody tr:last-child td{border-bottom:1.5pt solid #111}
  ul,ol{padding-left:18pt;margin:4pt 0 8pt}
  li{margin-bottom:3pt}
  pre{font-family:'Courier New',monospace;font-size:8.5pt;border:.75pt solid #111;padding:8pt 10pt;margin:8pt 0;white-space:pre-wrap;word-break:break-word;page-break-inside:avoid}
  table,pre,ul,ol{page-break-inside:avoid}
  tr{page-break-inside:avoid}
  </style></head><body>
  <div class="letterhead">
    ${logoTag}
    <div>
      <div class="org-name">Elevate for Humanity</div>
      <div class="org-creds">
        DOL Registered Apprenticeship Sponsor &nbsp;·&nbsp; ETPL Provider &nbsp;·&nbsp; WIOA / WRG / JRI Approved &nbsp;·&nbsp; WorkOne Partner &nbsp;·&nbsp; EmployIndy Partner<br>
        SAM.gov Registered (CAGE: 0Q856) &nbsp;·&nbsp; IMM Certified &nbsp;·&nbsp; ByBlack Certified &nbsp;·&nbsp; CareerSafe OSHA Provider &nbsp;·&nbsp; Certiport CATC<br>
        www.elevateforhumanity.org &nbsp;·&nbsp; elevate4humanityedu@gmail.com &nbsp;·&nbsp; Indianapolis, Indiana
      </div>
    </div>
  </div>
  <div class="doc-block">
    <div class="lbl">EmployIndy RFP 2026-003 &nbsp;·&nbsp; WIOA In-School Youth Service Provision &nbsp;·&nbsp; Document ${num} of ${total}</div>
    <div class="ttl">${title}</div>
    <div class="meta">Submission Deadline: April 24, 2026, 11:59 PM &nbsp;·&nbsp; Submit at: employindy.org/contract-opportunities</div>
  </div>
  ${body}
  </body></html>`;
}

async function generatePdf(html: string, outPath: string): Promise<void> {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.85in', right: '0.9in', bottom: '0.75in', left: '0.9in' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="width:100%;font-family:Arial,sans-serif;font-size:7pt;color:#555;display:flex;justify-content:space-between;padding:0 0.9in;margin-top:4px"><span>Elevate for Humanity &nbsp;·&nbsp; www.elevateforhumanity.org &nbsp;·&nbsp; CAGE: 0Q856 &nbsp;·&nbsp; RFP 2026-003</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
  });
  await browser.close();
}

async function sendEmail(to: string, subject: string, pdfPath: string, filename: string): Promise<boolean> {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      reply_to: { email: 'elevate4humanityedu@gmail.com' },
      subject: `Elevate for Humanity | ${subject}`,
      content: [{ type: 'text/html', value: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px"><div style="border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:14px"><div style="font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px">Elevate for Humanity</div><div style="font-size:10px;color:#555;margin-top:2px">www.elevateforhumanity.org &nbsp;·&nbsp; Indianapolis, Indiana &nbsp;·&nbsp; CAGE: 0Q856</div></div><p style="font-size:12px;margin:0 0 10px">Attached: <strong>${subject}</strong></p><p style="font-size:12px;margin:0 0 10px">EmployIndy RFP 2026-003 — WIOA In-School Youth Service Provision</p><p style="font-size:10px;color:#666;margin:0">Deadline: April 24, 2026, 11:59PM</p></div>` }],
      attachments: [{ content: fs.readFileSync(pdfPath).toString('base64'), filename, type: 'application/pdf', disposition: 'attachment' }],
    }),
  });
  if (!res.ok) { console.error(`\n  ❌ ${await res.text()}`); return false; }
  return true;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`\n📄 Generating professional PDFs → ${TO_EMAIL}\n   ${DOCUMENTS.length} documents\n`);
  let sent = 0, failed = 0;
  for (let i = 0; i < DOCUMENTS.length; i++) {
    const doc = DOCUMENTS[i];
    const srcPath = path.join(PACKAGE_DIR, doc.file);
    if (!fs.existsSync(srcPath)) { console.log(`  ⚠️  Not found: ${doc.file}`); failed++; continue; }
    const pdfFilename = doc.file.replace('.md', '.pdf');
    const pdfPath = path.join(OUT_DIR, pdfFilename);
    process.stdout.write(`  [${i+1}/${DOCUMENTS.length}] ${doc.title}\n         PDF ... `);
    try {
      await generatePdf(buildHtml(fs.readFileSync(srcPath,'utf-8'), doc.title, i+1, DOCUMENTS.length), pdfPath);
      console.log('✅');
    } catch(e:any) { console.log(`❌ ${e.message}`); failed++; continue; }
    process.stdout.write(`         Email ... `);
    const ok = await sendEmail(TO_EMAIL, doc.subject, pdfPath, pdfFilename);
    console.log(ok ? '✅' : '❌');
    if (ok) sent++; else failed++;
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(`\n─────────────────────────────────\n✅ Sent: ${sent}  ❌ Failed: ${failed}\n─────────────────────────────────\n📁 docs/grants/employindy-2026-003-pdfs/\n`);
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
