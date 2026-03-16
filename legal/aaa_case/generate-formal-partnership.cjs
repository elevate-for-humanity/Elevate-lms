#!/usr/bin/env node
// Generates a formal Partnership Agreement between Elevate for Humanity
// and Textures Institute of Cosmetology (Arthur Harris only).
// Designed to accompany the AAA arbitration filing as evidence of
// a documented placement and training partnership.

require('dotenv').config({ path: '.env.local' });

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, ShadingType,
  convertInchesToTwip,
} = require('docx');
const fs    = require('fs');
const path  = require('path');
const https = require('https');

const DARK  = '1E293B';
const RED   = 'DC2626';
const GRAY  = '6B7280';
const LIGHT = 'F1F5F9';
const WHITE = 'FFFFFF';

const logoPath = path.join(__dirname, '../../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg');
const logoData = fs.readFileSync(logoPath);

const today = new Date().toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric',
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const hr = () => new Paragraph({
  border: { bottom: { color: RED, size: 8, style: BorderStyle.SINGLE } },
  spacing: { after: 200 },
});

const spacer = (pts = 160) => new Paragraph({ spacing: { after: pts } });

const heading = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 28, color: DARK, font: 'Arial' })],
  spacing: { before: 320, after: 120 },
  border: { bottom: { color: RED, size: 6, style: BorderStyle.SINGLE } },
});

const subheading = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 24, color: RED, font: 'Arial' })],
  spacing: { before: 200, after: 80 },
});

const body = (text) => new Paragraph({
  children: [new TextRun({ text, size: 22, color: DARK, font: 'Arial' })],
  spacing: { after: 120 },
  alignment: AlignmentType.JUSTIFIED,
});

const bullet = (text) => new Paragraph({
  children: [new TextRun({ text, size: 22, color: DARK, font: 'Arial' })],
  bullet: { level: 0 },
  spacing: { after: 80 },
});

const signatureLine = (label, name, title, org) => [
  new Paragraph({
    children: [new TextRun({ text: '_'.repeat(50), size: 22, font: 'Arial', color: DARK })],
    spacing: { before: 400, after: 60 },
  }),
  new Paragraph({
    children: [new TextRun({ text: `Signature: ${label}`, bold: true, size: 22, font: 'Arial', color: DARK })],
    spacing: { after: 60 },
  }),
  new Paragraph({
    children: [new TextRun({ text: `Printed Name: ${name}`, size: 22, font: 'Arial', color: DARK })],
    spacing: { after: 60 },
  }),
  new Paragraph({
    children: [new TextRun({ text: `Title: ${title}`, size: 22, font: 'Arial', color: DARK })],
    spacing: { after: 60 },
  }),
  new Paragraph({
    children: [new TextRun({ text: `Organization: ${org}`, size: 22, font: 'Arial', color: DARK })],
    spacing: { after: 60 },
  }),
  new Paragraph({
    children: [new TextRun({ text: `Date: ___________________________`, size: 22, font: 'Arial', color: DARK })],
    spacing: { after: 200 },
  }),
];

// ── Document ──────────────────────────────────────────────────────────────────

const doc = new Document({
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
    children: [

      // Logo
      new Paragraph({
        children: [new ImageRun({ data: logoData, transformation: { width: 60, height: 90 }, type: 'jpg' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),

      // Title block
      new Paragraph({
        children: [new TextRun({ text: 'ELEVATE FOR HUMANITY', bold: true, size: 32, color: DARK, font: 'Arial' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Workforce Credential Institute', size: 24, color: GRAY, font: 'Arial' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'DOL Registered Apprenticeship Sponsor  |  ETPL Listed  |  WorkOne Partner', size: 20, color: GRAY, font: 'Arial' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'FORMAL PARTNERSHIP AGREEMENT', bold: true, size: 36, color: RED, font: 'Arial' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Barber, Nail Technology & Cosmetology Apprenticeship Programs', bold: true, size: 26, color: DARK, font: 'Arial' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Effective Date: ${today}`, size: 22, color: GRAY, font: 'Arial' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Submitted in connection with AAA Case No. 01-26-0000-2875', size: 20, color: RED, font: 'Arial', italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),

      hr(),

      // Parties
      heading('PARTIES TO THIS AGREEMENT'),
      body('This Formal Partnership Agreement ("Agreement") is entered into as of the date above by and between:'),
      spacer(80),

      subheading('Party 1 — Elevate for Humanity'),
      bullet('Organization: Elevate for Humanity | Workforce Credential Institute'),
      bullet('Role: DOL Registered Apprenticeship Sponsor and Program Administrator'),
      bullet('Representative: Elizabeth Greene, Executive Director'),
      bullet('Address: 8888 Keystone Crossing, Suite 1300, Indianapolis, Indiana 46240'),
      bullet('Contact: elevate4humanityedu@gmail.com | (317) 314-3757'),
      bullet('Website: www.elevateforhumanity.org'),
      spacer(80),

      subheading('Party 2 — Textures Institute of Cosmetology, LLC'),
      bullet('Organization: Textures Institute of Cosmetology, LLC'),
      bullet('Role: Licensed Training Site and Apprenticeship Delivery Partner'),
      bullet('Authorized Representative: Arthur Harris'),
      bullet('Address: 12887 Tuscany Boulevard, Carmel, Indiana 46032'),
      bullet('Contact: Arthurncarole@aol.com'),
      spacer(),

      hr(),

      // Purpose
      heading('PURPOSE'),
      body('The purpose of this Agreement is to formalize the partnership between Elevate for Humanity and Textures Institute of Cosmetology, LLC for the joint delivery of DOL-registered apprenticeship programs in Barbering, Nail Technology, and Cosmetology.'),
      spacer(80),
      body('This Agreement is submitted in connection with AAA Case No. 01-26-0000-2875 as evidence of a documented, active partnership providing employment placement pathways for Textures Institute graduates. The placement data referenced herein is drawn from Elevate for Humanity\'s enrollment management system and reflects active, approved applications as of the date of this Agreement.'),
      spacer(),

      hr(),

      // Placement data
      heading('DOCUMENTED PLACEMENT COMMITMENTS'),
      body('As of the effective date of this Agreement, Elevate for Humanity has the following active, approved placement slots available for graduates of Textures Institute of Cosmetology programs:'),
      spacer(80),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Program', bold: true, size: 22, font: 'Arial', color: WHITE })], alignment: AlignmentType.CENTER })], shading: { fill: DARK, type: ShadingType.CLEAR }, width: { size: 40, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Active Applications', bold: true, size: 22, font: 'Arial', color: WHITE })], alignment: AlignmentType.CENTER })], shading: { fill: DARK, type: ShadingType.CLEAR }, width: { size: 30, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Placement Slots', bold: true, size: 22, font: 'Arial', color: WHITE })], alignment: AlignmentType.CENTER })], shading: { fill: DARK, type: ShadingType.CLEAR }, width: { size: 30, type: WidthType.PERCENTAGE } }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Barber Apprenticeship', size: 22, font: 'Arial', color: DARK })] })], shading: { fill: LIGHT, type: ShadingType.CLEAR } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '17 (all approved)', size: 22, font: 'Arial', color: DARK })] })], shading: { fill: LIGHT, type: ShadingType.CLEAR } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '50', size: 22, font: 'Arial', color: DARK })] })], shading: { fill: LIGHT, type: ShadingType.CLEAR } }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nail Technology', size: 22, font: 'Arial', color: DARK })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '1 (approved)', size: 22, font: 'Arial', color: DARK })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '1', size: 22, font: 'Arial', color: DARK })] })] }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Cosmetology', size: 22, font: 'Arial', color: DARK })] })], shading: { fill: LIGHT, type: ShadingType.CLEAR } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '3 (all approved)', size: 22, font: 'Arial', color: DARK })] })], shading: { fill: LIGHT, type: ShadingType.CLEAR } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '3', size: 22, font: 'Arial', color: DARK })] })], shading: { fill: LIGHT, type: ShadingType.CLEAR } }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL', bold: true, size: 22, font: 'Arial', color: WHITE })] })], shading: { fill: DARK, type: ShadingType.CLEAR } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '21 (20 approved)', bold: true, size: 22, font: 'Arial', color: WHITE })] })], shading: { fill: DARK, type: ShadingType.CLEAR } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '54', bold: true, size: 22, font: 'Arial', color: WHITE })] })], shading: { fill: DARK, type: ShadingType.CLEAR } }),
            ],
          }),
        ],
      }),
      spacer(),
      body('These placements are structured, employer-connected, and registered through the Indiana Department of Workforce Development apprenticeship framework. They qualify as documented employment placements under workforce and accreditation reporting standards.'),
      spacer(),

      hr(),

      // Roles
      heading('ROLES & RESPONSIBILITIES'),

      subheading('Elevate for Humanity'),
      bullet('Serve as the DOL Registered Apprenticeship Sponsor for all programs'),
      bullet('Administer enrollment, funding navigation (WIOA, WRG, Job Ready Indy), and student records'),
      bullet('Provide 54 documented placement slots for Textures Institute graduates'),
      bullet('Issue digital credentials and coordinate state board exam registration'),
      bullet('Maintain ETPL listing and DOL compliance documentation'),
      bullet('Provide the Elevate LMS platform for student tracking and workforce reporting'),
      spacer(80),

      subheading('Textures Institute of Cosmetology, LLC (Arthur Harris)'),
      bullet('Serve as the licensed training site for all apprenticeship program instruction'),
      bullet('Maintain the Indiana IPLA establishment license for Textures Institute of Cosmetology'),
      bullet('Provide facility access, equipment, and supplies for program delivery'),
      bullet('Ensure the facility meets all IPLA, DOL, and Elevate program standards'),
      bullet('Cooperate with Elevate on scheduling, inspections, and compliance reporting'),
      bullet('Maintain facility liability insurance and provide proof of coverage to Elevate annually'),
      bullet('Document and submit student clock hours for IPLA and DOL reporting'),
      spacer(),

      hr(),

      // Term
      heading('TERM & TERMINATION'),
      body('This Agreement is effective as of the date above and shall remain in effect for one (1) year, automatically renewing annually unless terminated by either party with 30 days written notice. Either party may terminate this Agreement for cause with immediate effect upon written notice if the other party materially breaches any provision of this Agreement.'),
      spacer(),

      hr(),

      // Signatures
      heading('SIGNATURES'),
      body('By signing below, each party agrees to the terms of this Formal Partnership Agreement and commits to fulfilling their respective roles and responsibilities as outlined above.'),
      spacer(),

      ...signatureLine(
        'Elevate for Humanity',
        'Elizabeth Greene',
        'Executive Director',
        'Elevate for Humanity | Workforce Credential Institute'
      ),
      ...signatureLine(
        'Textures Institute of Cosmetology, LLC',
        'Arthur Harris',
        'Authorized Representative',
        'Textures Institute of Cosmetology, LLC'
      ),
    ],
  }],
});

// ── Generate + Send ───────────────────────────────────────────────────────────

async function main() {
  const buf     = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, 'Formal_Partnership_Agreement_Elevate_Textures.docx');
  fs.writeFileSync(outPath, buf);
  console.log('✅ Agreement written:', outPath, `(${(buf.length/1024).toFixed(1)} KB)`);

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) { console.warn('⚠️  No SENDGRID_API_KEY'); return; }

  const b64 = buf.toString('base64');

  const payload = {
    personalizations: [{
      to: [
        { email: 'ErikaLincoln@adr.org',        name: 'Erika Lincoln — AAA' },
        { email: 'Arthurncarole@aol.com',        name: 'Arthur Harris' },
      ],
      cc: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elevate for Humanity' }],
    }],
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
    reply_to: { email: 'elevate4humanityedu@gmail.com' },
    subject: 'Formal Partnership Agreement — AAA Case No. 01-26-0000-2875 — Elevate for Humanity & Textures Institute',
    content: [{
      type: 'text/html',
      value: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.6;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#1e293b;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:18px">Formal Partnership Agreement</h1>
    <p style="margin:4px 0 0;opacity:0.8;font-size:13px">AAA Case No. 01-26-0000-2875 — Textures Institute of Cosmetology, LLC</p>
  </div>
  <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
    <p>Dear Ms. Lincoln and Mr. Harris,</p>
    <p>Please find attached the <strong>Formal Partnership Agreement</strong> between
    Elevate for Humanity and Textures Institute of Cosmetology, LLC, submitted for
    inclusion in the case record for AAA Case No. 01-26-0000-2875.</p>
    <p>This agreement documents:</p>
    <ul>
      <li><strong>54 active placement slots</strong> for Textures Institute graduates across Barber, Nail Technology, and Cosmetology programs</li>
      <li><strong>21 active applications (20 approved)</strong> drawn from Elevate's live enrollment system</li>
      <li>Formal roles and responsibilities of both parties</li>
      <li>DOL apprenticeship framework and ETPL compliance structure</li>
    </ul>
    <p><strong>For Arthur Harris:</strong> Please sign the agreement and return a copy to
    <a href="mailto:elevate4humanityedu@gmail.com">elevate4humanityedu@gmail.com</a>.
    The signed agreement will be submitted to AAA as additional evidence.</p>
    <p>Please confirm receipt.</p>
    <p>Respectfully,<br>
    <strong>Elizabeth Greene</strong><br>
    Executive Director, Elevate for Humanity<br>
    (317) 314-3757 | elevate4humanityedu@gmail.com</p>
  </div>
</body></html>`,
    }],
    attachments: [{
      content: b64,
      filename: 'Formal_Partnership_Agreement_Elevate_Textures.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      disposition: 'attachment',
    }],
  };

  const body = JSON.stringify(payload);
  await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.sendgrid.com',
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Sent to ErikaLincoln@adr.org + Arthurncarole@aol.com');
          console.log('✅ CC: elevate4humanityedu@gmail.com');
        } else {
          console.error('❌ SendGrid error', res.statusCode, d);
        }
        resolve();
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
