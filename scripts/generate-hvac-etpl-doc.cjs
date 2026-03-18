/**
 * Generates HVAC ETPL listing summary + updated curriculum as a .docx
 * and sends it to elevate4humanityedu@gmail.com via SendGrid.
 *
 * Run: node scripts/generate-hvac-etpl-doc.cjs
 */

'use strict';

const path = require('path');
const fs   = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, HeadingLevel,
  convertInchesToTwip,
} = require('docx');

// ── Brand colours ──────────────────────────────────────────────────
const DARK = '1E293B';
const RED  = 'DC2626';
const GRAY = '6B7280';
const LIGHT = 'F8FAFC';

// ── Helpers ────────────────────────────────────────────────────────
function heading(text, level = 1) {
  const sizes = { 1: 32, 2: 26, 3: 24 };
  const colors = { 1: DARK, 2: RED, 3: DARK };
  return new Paragraph({
    spacing: { before: level === 1 ? 320 : 240, after: 120 },
    children: [new TextRun({
      text,
      bold: true,
      size: sizes[level] ?? 24,
      color: colors[level] ?? DARK,
      font: 'Arial',
    })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({
      text,
      size: 22,
      color: opts.color ?? DARK,
      bold: opts.bold ?? false,
      font: 'Arial',
    })],
  });
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22, color: DARK, font: 'Arial' })],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' } },
    children: [],
  });
}

function labelValue(label, value) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22, color: DARK, font: 'Arial' }),
      new TextRun({ text: value, size: 22, color: GRAY, font: 'Arial' }),
    ],
  });
}

function tableRow(cells, isHeader = false) {
  return new TableRow({
    tableHeader: isHeader,
    children: cells.map(({ text, width }) => new TableCell({
      width: { size: width ?? 2500, type: WidthType.DXA },
      shading: isHeader ? { fill: DARK } : undefined,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({
          text,
          bold: isHeader,
          size: isHeader ? 20 : 20,
          color: isHeader ? 'FFFFFF' : DARK,
          font: 'Arial',
        })],
      })],
    })),
  });
}

// ── RTI hours (WIOA-fundable only — excludes OJT weeks 10-12) ──────
// Weeks 1–9 @ 20 hrs/week = 180 RTI hours
const RTI_WEEKS        = 9;
const RTI_HOURS        = 180;   // 9 weeks × 20 hrs
const OJT_WEEKS        = '2–4';
const TOTAL_WEEKS      = '12–20';
const COST_PER_HOUR    = (5000 / RTI_HOURS).toFixed(2);  // $27.78/hr RTI only

// ── Document ───────────────────────────────────────────────────────
async function buildDoc() {
  const sections = [];

  // ── PAGE 1: ETPL LISTING FIELDS ──────────────────────────────────
  sections.push(heading('HVAC Technician — ETPL Listing Data', 1));
  sections.push(body('Elevate for Humanity Career & Technical Institute', { bold: true }));
  sections.push(body('Prepared for Indiana ETPL / WorkOne submission', { color: GRAY }));
  sections.push(divider());

  sections.push(heading('Program Identification', 2));
  sections.push(labelValue('Program Name', 'HVAC Technician'));
  sections.push(labelValue('Provider', 'Elevate for Humanity Career & Technical Institute'));
  sections.push(labelValue('CIP Code', '47.0201 — Heating, Air Conditioning, Ventilation and Refrigeration Maintenance Technology'));
  sections.push(labelValue('SOC Code', '49-9021 — Heating, Air Conditioning, and Refrigeration Mechanics and Installers'));
  sections.push(labelValue('Delivery Method', 'Hybrid — Online RTI (LMS) + Hands-On Lab at Indianapolis training center'));
  sections.push(labelValue('Location', 'Indianapolis, Indiana'));

  sections.push(divider());
  sections.push(heading('Duration & Hours — ETPL Reportable (RTI Only)', 2));
  sections.push(body(
    '⚠  WIOA/ETPL funding covers Related Technical Instruction (RTI) only — Weeks 1–9. ' +
    'OJT (Weeks 10–12) is a separate employer-funded or OJT-contract instrument.',
    { color: RED, bold: true }
  ));
  sections.push(labelValue('RTI Duration (ETPL-fundable)', `${RTI_WEEKS} weeks`));
  sections.push(labelValue('RTI Clock Hours', `${RTI_HOURS} hours (9 weeks × 20 hrs/week)`));
  sections.push(labelValue('OJT Duration (separate instrument)', `${OJT_WEEKS} weeks — employer site`));
  sections.push(labelValue('Total Program Duration (ETPL listing)', `${TOTAL_WEEKS} weeks`));
  sections.push(labelValue('Hours/Week', '15–20 hours'));
  sections.push(labelValue('Schedule Options', 'Daytime and evening/weekend cohorts available'));

  sections.push(divider());
  sections.push(heading('Cost of Training (RTI Only)', 2));
  sections.push(labelValue('Total Tuition (RTI)', '$5,000'));
  sections.push(labelValue('RTI Clock Hours', `${RTI_HOURS} hours`));
  sections.push(labelValue('Cost Per Clock Hour', `$${COST_PER_HOUR}`));
  sections.push(labelValue('Included in Tuition',
    'All PPE, tools, training materials, EPA 608 exam fee, OSHA 10 card, CPR/First Aid/AED'));
  sections.push(labelValue('OJT Cost to WIOA', 'None — OJT funded via separate OJT reimbursement agreement with employer'));
  sections.push(body(
    'Note: If an OJT contract is in place, WorkOne reimburses the employer up to 50% of trainee wages ' +
    'for the OJT period. This is separate from the ITA and does not affect the ETPL cost figure.',
    { color: GRAY }
  ));

  sections.push(divider());
  sections.push(heading('Credentials Earned', 2));
  const credentials = [
    'EPA Section 608 Universal Certification (proctored on-site — Elevate is an approved EPA 608 testing facility)',
    'OSHA 10-Hour Construction Safety Card (U.S. Department of Labor)',
    'CPR / First Aid / AED Certification',
    'Residential HVAC Certification 1 & 2 (Elevate for Humanity)',
    'Rise Up Retail Industry Fundamentals (NRF Foundation)',
  ];
  credentials.forEach(c => sections.push(bullet(c)));

  sections.push(divider());
  sections.push(heading('Funding Eligibility', 2));
  const funding = [
    'WIOA Title I Adult',
    'WIOA Title I Dislocated Worker',
    'Indiana Next Level Jobs — Workforce Ready Grant',
    'Indiana Next Level Jobs — Employer Training Grant',
    'Job Readiness Indiana (JRI)',
    'Self-pay ($5,000 — payment plans available)',
  ];
  funding.forEach(f => sections.push(bullet(f)));

  // ── PAGE 2: UPDATED CURRICULUM ────────────────────────────────────
  sections.push(new Paragraph({ pageBreakBefore: true, children: [] }));
  sections.push(heading('HVAC Technician — Updated Curriculum', 1));
  sections.push(body('RTI Phases (WIOA-Fundable) — Weeks 1–9 | 180 Clock Hours', { bold: true }));
  sections.push(body(
    'OJT Phase (Weeks 10–12) is listed separately and funded via employer OJT contract — not included in ITA cost.',
    { color: GRAY }
  ));
  sections.push(divider());

  // Curriculum table
  const phases = [
    {
      phase: 'Phase 1 — Weeks 1–3',
      title: 'Technical Foundations & Safety',
      hours: '60 hrs',
      topics: [
        'Program orientation and workforce readiness',
        'How HVAC systems work — heating, cooling, ventilation',
        'HVAC tools and equipment identification (10/10 practical)',
        'PPE and shop safety — LOTO per OSHA 1910.147',
        'Electrical fundamentals: voltage, current, resistance, Ohm\'s Law',
        'Multimeter operation and electrical testing (±5% accuracy)',
        'Reading wiring diagrams and schematics',
        'Capacitors, contactors, and relays',
        'OSHA 10-Hour Construction Safety (DOL card)',
      ],
    },
    {
      phase: 'Phase 2 — Weeks 4–7',
      title: 'System Diagnostics',
      hours: '80 hrs',
      topics: [
        'Gas furnace operation and ignition systems',
        'Electric heat and heat strips',
        'Heat pump heating mode and reversing valve',
        'Combustion analysis — CO below 100 ppm',
        'Temperature rise measurement (±5°F of nameplate)',
        'The refrigeration cycle — 4 stages',
        'Pressure-temperature relationship and PT charts',
        'Superheat and subcooling measurement (±2°F)',
        'Compressor types and metering devices',
        'System diagnostics with manifold gauges — 4/4 fault diagnoses',
        'Ductwork design and static pressure (±0.02 in. w.c.)',
        'Equipment sizing (Manual J basics)',
      ],
    },
    {
      phase: 'Phase 3 — Weeks 8–9',
      title: 'EPA 608 Certification & Career Prep',
      hours: '40 hrs',
      topics: [
        'EPA 608 Core: ozone layer, Clean Air Act Section 608, refrigerant safety',
        'Refrigerant types: CFC, HCFC, HFC, HFO — classify 10 by ODP',
        'Recovery, recycling, and reclamation definitions',
        'Type I: small appliance systems (<5 lbs refrigerant)',
        'Type II: high-pressure systems — R-410A, R-22, R-134a',
        'Type III: low-pressure systems and centrifugal chillers',
        'Evacuation to 500 microns; leak detection methods',
        'Brazing and line set installation — 150 psi nitrogen test',
        'Proctored EPA 608 Universal exam (ESCO / Mainstream Engineering)',
        'CPR / First Aid / AED certification',
        'Resume building, mock interviews, employer introductions',
      ],
    },
  ];

  for (const p of phases) {
    sections.push(heading(`${p.phase}: ${p.title}  (${p.hours})`, 2));
    p.topics.forEach(t => sections.push(bullet(t)));
    sections.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
  }

  sections.push(divider());
  sections.push(heading('OJT Phase — Weeks 10–12 (Employer Site — Separate Instrument)', 2));
  sections.push(body(
    'Not included in ITA / ETPL cost. Funded via OJT reimbursement agreement between WorkOne and employer partner.',
    { color: RED }
  ));
  const ojtCompetencies = [
    'Diagnose 3 common AC faults within 30 minutes each',
    'Complete a full furnace safety inspection (15-point checklist)',
    'Perform a residential system startup and commissioning',
    'Document service calls using industry-standard formats',
    'Supervised real-world service calls at Indianapolis-area employer partner sites',
  ];
  ojtCompetencies.forEach(c => sections.push(bullet(c)));

  sections.push(divider());
  sections.push(heading('Supplemental Certifications — EPATest.com (Self-Paced, Open-Book)', 2));
  sections.push(body(
    'Issued by Mainstream Engineering Corporation via epatest.com. All are open-book, no time limit, ' +
    'no proctoring required. Students complete these independently after earning EPA 608. ' +
    'Cost: $26.95 per exam (wallet card included). Retest: $7.95.',
    { color: GRAY }
  ));
  sections.push(new Paragraph({ spacing: { after: 80 }, children: [] }));

  const suppCerts = [
    {
      name: 'R-410A Certification',
      url: 'https://ww2.epatest.com/r410a/',
      desc: 'Safe handling of high-pressure R-410A refrigerant. Recommended by most manufacturers. Requires EPA 608.',
    },
    {
      name: 'PM Tech Certification',
      url: 'https://ww2.epatest.com/pmtech/',
      desc: 'Preventative maintenance: acid/moisture detection, compressor and coil maintenance, refrigeration charging, leak testing. Requires EPA 608.',
    },
    {
      name: 'Indoor Air Quality (IAQ) Certification',
      url: 'https://ww2.epatest.com/iaq/',
      desc: 'IAQ principles and best practices for HVAC technicians.',
    },
    {
      name: 'Green HVAC/R Certification',
      url: 'https://ww2.epatest.com/green/',
      desc: 'Energy audits, energy-efficient equipment, and preventative maintenance for optimum HVAC operation.',
    },
    {
      name: 'EPA Section 609 MVAC Certification',
      url: 'https://ww2.epatest.com/epa-609-mvac/',
      desc: 'Required by EPA for technicians servicing refrigerants in motor vehicle AC systems. Mainstream is EPA-approved for 609.',
    },
    {
      name: 'HC (A3) & HFO (A2L) Low-GWP Refrigerant Certification',
      url: 'https://ww2.epatest.com/hc-hfo-low-gwp/',
      desc: 'Safe handling of next-generation flammable (A3) and slightly flammable (A2L) refrigerants replacing R-410A. Requires EPA 608.',
    },
  ];

  for (const cert of suppCerts) {
    sections.push(new Paragraph({
      spacing: { after: 60 },
      bullet: { level: 0 },
      children: [
        new TextRun({ text: cert.name, bold: true, size: 22, color: DARK, font: 'Arial' }),
        new TextRun({ text: ` — ${cert.desc}`, size: 22, color: GRAY, font: 'Arial' }),
        new TextRun({ text: `  ${cert.url}`, size: 20, color: '1D4ED8', font: 'Arial' }),
      ],
    }));
  }

  sections.push(divider());
  sections.push(heading('Labor Market Alignment', 2));
  sections.push(labelValue('SOC', '49-9021 — HVAC Mechanics and Installers'));
  sections.push(labelValue('Median Salary (Indiana)', '$52,000/year'));
  sections.push(labelValue('Salary Range', '$38,000–$80,000'));
  sections.push(labelValue('Job Growth', '+6% (faster than average) — BLS Occupational Outlook Handbook 2024'));
  sections.push(labelValue('Indianapolis MSA Openings', '200+ active postings (Indeed/LinkedIn, Q1 2025)'));

  // ── Build doc ──────────────────────────────────────────────────────
  const doc = new Document({
    creator: 'Elevate for Humanity',
    title: 'HVAC Technician — ETPL Listing & Curriculum',
    description: 'ETPL listing data and updated curriculum for Indiana WorkOne submission',
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 22, color: DARK },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left:   convertInchesToTwip(1.25),
            right:  convertInchesToTwip(1.25),
          },
        },
      },
      children: sections,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = '/tmp/hvac-etpl-curriculum.docx';
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Document written to ${outPath}`);
  return outPath;
}

// ── Send via SendGrid ──────────────────────────────────────────────
async function sendDoc(docPath) {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    console.error('❌ SENDGRID_API_KEY not set — cannot send email');
    process.exit(1);
  }

  const attachment = fs.readFileSync(docPath).toString('base64');

  const payload = {
    personalizations: [{ to: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }] }],
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
    reply_to: { email: 'elevate4humanityedu@gmail.com' },
    subject: 'HVAC Technician — ETPL Listing Data & Updated Curriculum',
    content: [
      {
        type: 'text/plain',
        value: [
          'Elizabeth,',
          '',
          'Attached is the HVAC Technician ETPL listing data and updated curriculum document.',
          '',
          'Key updates:',
          '- RTI hours clarified: 180 hours (Weeks 1–9 only — WIOA-fundable)',
          '- OJT phase (Weeks 10–12) separated out as a distinct employer-funded instrument',
          '- Cost per clock hour recalculated: $5,000 / 180 RTI hours = $27.78/hr',
          '- Total program duration on ETPL listing: 12–20 weeks',
          '- Curriculum reorganized into 3 RTI phases + 1 OJT phase',
          '',
          'The document is ready to use for your ETPL submission or WorkOne review.',
          '',
          'Elevate for Humanity LMS',
        ].join('\n'),
      },
      {
        type: 'text/html',
        value: `
<p>Elizabeth,</p>
<p>Attached is the HVAC Technician ETPL listing data and updated curriculum document.</p>
<p><strong>Key updates:</strong></p>
<ul>
  <li>RTI hours clarified: <strong>180 hours</strong> (Weeks 1–9 only — WIOA-fundable)</li>
  <li>OJT phase (Weeks 10–12) separated out as a distinct employer-funded instrument</li>
  <li>Cost per clock hour recalculated: <strong>$5,000 ÷ 180 RTI hours = $27.78/hr</strong></li>
  <li>Total program duration on ETPL listing: <strong>12–20 weeks</strong></li>
  <li>Curriculum reorganized into 3 RTI phases + 1 OJT phase</li>
</ul>
<p>The document is ready to use for your ETPL submission or WorkOne review.</p>
<p style="color:#6b7280;font-size:12px">Elevate for Humanity LMS</p>
        `,
      },
    ],
    attachments: [
      {
        content: attachment,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filename: 'HVAC-Technician-ETPL-Curriculum.docx',
        disposition: 'attachment',
      },
    ],
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (res.ok || res.status === 202) {
    console.log('✅ Email sent to elevate4humanityedu@gmail.com');
  } else {
    const text = await res.text();
    console.error(`❌ SendGrid error ${res.status}: ${text}`);
    process.exit(1);
  }
}

(async () => {
  const docPath = await buildDoc();
  await sendDoc(docPath);
  // Clean up temp file
  fs.unlinkSync(docPath);
  console.log('✅ Done');
})();
