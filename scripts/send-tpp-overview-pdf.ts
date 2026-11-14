#!/usr/bin/env tsx
/**
 * Generates the FSSA SNAP E&T Program Overview & Capability Statement PDF
 * and sends it as Document 1 of 2 to Elizabeth Greene.
 *
 * Usage:
 *   pnpm tsx scripts/send-tpp-overview-pdf.ts
 *   pnpm tsx scripts/send-tpp-overview-pdf.ts --dry-run
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join('=').trim();
  }
}

const API_KEY  = process.env.SENDGRID_API_KEY;
const DRY_RUN  = process.argv.includes('--dry-run');
const TODAY    = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const DATESTAMP = new Date().toISOString().slice(0, 10);

if (!API_KEY && !DRY_RUN) { console.error('SENDGRID_API_KEY not set.'); process.exit(1); }

async function generatePdf(): Promise<Buffer> {
  const { generateTppOverviewPdf } = await import('../lib/documents/generate-tpp-overview-pdf');
  return Buffer.from(await generateTppOverviewPdf());
}

function sendEmail(pdf: Buffer): Promise<void> {
  const html = `
<p>Elizabeth,</p>
<p>Attached is <strong>Document 1 of 2: FSSA SNAP E&amp;T Program Overview &amp; Capability Statement</strong> — ${TODAY}.</p>
<p>This document contains 9 detailed sections:</p>
<ol>
  <li><strong>Section 1 — Organization Profile</strong>: Legal identity, all certifications, 4 facility locations (addresses, rents, program use, transit access), Certiport CATC, DOL Apprenticeship RAPIDS #2025-IN-132301, SAM.gov CAGE 0Q856, ETPL, WIOA/WRG/JRI status</li>
  <li><strong>Section 2 — Mission, Vision &amp; Target Population</strong>: Detailed SNAP participant breakdown (150 participants by category — mandatory, ABAWD, voluntary, returning citizens, veterans, disabilities, LEP, disconnected youth, housing-unstable), 9-step enrollment process, projected outcomes table, geographic service area with IndyGo transit access for all 4 locations</li>
  <li><strong>Section 3 — Full Program Catalog</strong>: All 35+ credential programs with duration, cost, funding sources, and employer demand data</li>
  <li><strong>Section 4 — Jobs Aligned With Programs</strong>: BLS wage data, career ladders, employer hiring partners by program track</li>
  <li><strong>Section 5 — Supportive Services Plan</strong>: 7 services with policies, reimbursement rates, and 7 CFR 273.7(d)(4) compliance documentation</li>
  <li><strong>Section 6 — All Partners &amp; Vendors</strong>: Workforce agencies, employer partners, program holders, curriculum vendors — all with MOU status</li>
  <li><strong>Section 7 — Full Staff</strong>: 10 positions including Naomi Jordan (Director of Healthcare Administration) and dedicated SNAP E&amp;T Case Manager — full bios, responsibilities, qualifications, salaries, E&amp;T FTE allocations</li>
  <li><strong>Section 8 — Compliance &amp; Regulatory Standing</strong>: All active certifications, insurance, data privacy policy, background check policy, FERPA compliance</li>
  <li><strong>Section 9 — FSSA SNAP E&amp;T Budget (Allowable Costs Only)</strong>: 150 participants, 4 facility locations with correct rents, personnel with defensible FTE allocations, training materials, supportive services, non-federal match documented, cost per participant $5,469, federal share requested ~$394,829</li>
</ol>
<p><strong>Document 2 of 2</strong> (TPP Application Questionnaire) is in a separate email with subject line beginning [DOCUMENT 2 OF 2].</p>
<p>Please review carefully before submitting to FSSA. Reply with any corrections.</p>
<p>— Elevate for Humanity LMS</p>`;

  const payload = JSON.stringify({
    personalizations: [{ to: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }] }],
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
    reply_to: { email: 'elevate4humanityedu@gmail.com' },
    subject: `[DOCUMENT 1 OF 2] FSSA SNAP E&T Program Overview & Capability Statement — Elevate for Humanity — ${TODAY}`,
    content: [{ type: 'text/html', value: html }],
    attachments: [{
      content: pdf.toString('base64'),
      type: 'application/pdf',
      filename: `Elevate-FSSA-Program-Overview-Capability-Statement-${DATESTAMP}.pdf`,
      disposition: 'attachment',
    }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.sendgrid.com', path: '/v3/mail/send', method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, res => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve();
      else { let body = ''; res.on('data', d => body += d); res.on('end', () => reject(new Error(`SendGrid ${res.statusCode}: ${body}`))); }
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  console.log('Generating FSSA Program Overview & Capability Statement PDF...');
  const pdf = await generatePdf();
  console.log(`✅ PDF generated — ${Math.round(pdf.length / 1024)} KB`);

  if (DRY_RUN) {
    fs.writeFileSync(path.join(process.cwd(), 'public', 'tpp-overview-preview.pdf'), pdf);
    console.log('\n[DRY RUN] PDF saved to ./public/tpp-overview-preview.pdf');
    console.log('Run without --dry-run to send.');
    return;
  }

  console.log('\nSending [DOCUMENT 1 OF 2] to elevate4humanityedu@gmail.com...');
  await sendEmail(pdf);
  console.log('✅ Sent — Subject: [DOCUMENT 1 OF 2] FSSA SNAP E&T Program Overview & Capability Statement');
})();
