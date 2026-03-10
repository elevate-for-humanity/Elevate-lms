#!/usr/bin/env node
/**
 * Generates the Textures Institute of Cosmetology Partnership Agreement
 * between Elevate for Humanity, Jozanna George, and Arthur Harris
 * Output: /tmp/Textures_Institute_Partnership_Agreement.docx
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, ShadingType,
  convertInchesToTwip, HeadingLevel, PageBreak,
} = require('docx');
const fs = require('fs');
const path = require('path');

const DARK  = '1E293B';
const RED   = 'DC2626';
const GRAY  = '6B7280';
const LIGHT = 'F1F5F9';
const WHITE = 'FFFFFF';

const logoPath = path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg');
const logoData = fs.readFileSync(logoPath);

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

const body = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, size: 22, color: DARK, font: 'Arial', ...opts })],
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

// ─── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.25),
          right: convertInchesToTwip(1.25),
        },
      },
    },
    children: [

      // ── LOGO ──
      new Paragraph({
        children: [new ImageRun({ data: logoData, transformation: { width: 60, height: 90 }, type: 'jpg' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),

      // ── TITLE BLOCK ──
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
        children: [new TextRun({ text: 'PARTNERSHIP AGREEMENT', bold: true, size: 36, color: RED, font: 'Arial' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Beauty, Barbering & Cosmetology Apprenticeship Program', bold: true, size: 26, color: DARK, font: 'Arial' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Effective Date: ${today}`, size: 22, color: GRAY, font: 'Arial' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),

      hr(),

      // ── PARTIES ──
      heading('PARTIES TO THIS AGREEMENT'),

      body('This Partnership Agreement ("Agreement") is entered into as of the date above by and between the following parties:'),
      spacer(),

      subheading('Party 1 — Elevate for Humanity'),
      bullet('Organization: Elevate for Humanity | Workforce Credential Institute'),
      bullet('Role: DOL Registered Apprenticeship Sponsor and Program Administrator'),
      bullet('Representative: Elizabeth Greene, Executive Director'),
      bullet('Contact: elevate4humanityedu@gmail.com | 317-314-3537'),
      bullet('Website: www.elevateforhumanity.org'),
      spacer(),

      subheading('Party 2 — Program Holder (Jozanna George)'),
      bullet('Name: Jozanna George'),
      bullet('Role: Program Holder — Beauty, Barbering & Cosmetology Programs'),
      bullet('Licenses: Indiana Nail Technician, Nail Instructor, Esthetician'),
      bullet('Affiliation: Textures Institute of Cosmetology'),
      bullet('Contact: Jozannageorge@outlook.com'),
      spacer(),

      subheading('Party 3 — Affiliated Training Site (Arthur Harris)'),
      bullet('Name: Arthur Harris'),
      bullet('Role: Authorized Representative — Textures Institute of Cosmetology'),
      bullet('Organization: Textures Institute of Cosmetology'),
      bullet('Relationship: Direct Affiliate and Training Site Partner'),
      spacer(),

      hr(),

      // ── PURPOSE ──
      heading('PURPOSE & BACKGROUND'),

      body('Elevate for Humanity is a DOL-registered apprenticeship sponsor and ETPL-listed workforce training organization based in Indianapolis, Indiana. Elevate administers industry-recognized credential programs across healthcare, trades, technology, and beauty industries.'),
      spacer(80),

      body('Textures Institute of Cosmetology is an Indiana-licensed cosmetology school operating under the oversight of the Indiana Professional Licensing Agency (IPLA). Arthur Harris serves as the authorized representative of Textures Institute of Cosmetology.'),
      spacer(80),

      body('Jozanna George is a multi-licensed beauty professional (Nail Technician, Nail Instructor, Esthetician) who oversees the nail program at Textures Institute of Cosmetology and manages enrollment operations for Elevate for Humanity.'),
      spacer(80),

      body('The purpose of this Agreement is to formalize the partnership between Elevate for Humanity, Jozanna George, and Textures Institute of Cosmetology (through Arthur Harris) to jointly deliver DOL-registered apprenticeship programs in Nail Technology, Esthetics, and Cosmetology through the Elevate platform.'),
      spacer(),

      hr(),

      // ── WHY AFFILIATION IS NEEDED ──
      heading('WHY THIS AFFILIATION IS REQUIRED'),

      body('This direct affiliation between Jozanna George and Arthur Harris / Textures Institute of Cosmetology is required for the following reasons:'),
      spacer(80),

      subheading('1. Indiana IPLA Licensing Requirements'),
      body('Indiana law requires that cosmetology, nail technology, and esthetics instruction be conducted at a licensed cosmetology school or under the supervision of a licensed instructor at an approved training site. Textures Institute of Cosmetology holds the required Indiana IPLA establishment license. This affiliation ensures all instruction delivered under the Elevate apprenticeship program meets state licensing requirements.'),
      spacer(80),

      subheading('2. DOL Apprenticeship Standards'),
      body('The U.S. Department of Labor requires that registered apprenticeship programs identify a qualified training site where Related Technical Instruction (RTI) and On-the-Job Training (OJT) are delivered. Textures Institute of Cosmetology serves as the designated training site for the Beauty, Barbering & Cosmetology apprenticeship program. Arthur Harris, as the authorized representative, must formally agree to this designation.'),
      spacer(80),

      subheading('3. ETPL & WorkOne Compliance'),
      body('Indiana\'s Eligible Training Provider List (ETPL) requires that training programs be delivered at approved facilities with qualified instructors. The affiliation with Textures Institute of Cosmetology and Arthur Harris provides the facility credentials required for ETPL listing and WorkOne funding eligibility for enrolled students.'),
      spacer(80),

      subheading('4. Student Credential Eligibility'),
      body('Students enrolled in the Elevate Beauty & Barbering apprenticeship program must complete their required clock hours at an IPLA-approved facility to be eligible to sit for Indiana State Board licensing exams. The affiliation with Textures Institute of Cosmetology ensures students\' hours are properly documented and recognized by the Indiana State Board.'),
      spacer(80),

      subheading('5. Liability & Insurance Coverage'),
      body('A formal affiliation agreement protects all parties by clearly defining roles, responsibilities, and liability. Elevate for Humanity carries program liability insurance as the DOL sponsor. Textures Institute of Cosmetology must maintain its own facility and professional liability coverage. This agreement documents the relationship for insurance and compliance purposes.'),
      spacer(),

      hr(),

      // ── SCOPE OF PROGRAMS ──
      heading('SCOPE OF PROGRAMS'),

      body('The following programs are covered under this Agreement:'),
      spacer(80),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Program', bold: true, size: 22, font: 'Arial', color: WHITE })], alignment: AlignmentType.CENTER })], shading: { fill: DARK, type: ShadingType.CLEAR }, width: { size: 30, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Credential', bold: true, size: 22, font: 'Arial', color: WHITE })], alignment: AlignmentType.CENTER })], shading: { fill: DARK, type: ShadingType.CLEAR }, width: { size: 35, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Clock Hours', bold: true, size: 22, font: 'Arial', color: WHITE })], alignment: AlignmentType.CENTER })], shading: { fill: DARK, type: ShadingType.CLEAR }, width: { size: 35, type: WidthType.PERCENTAGE } }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nail Technology', size: 22, font: 'Arial', color: DARK })] })], shading: { fill: LIGHT, type: ShadingType.CLEAR } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Indiana State Board — Nail Tech License', size: 22, font: 'Arial', color: DARK })] })], shading: { fill: LIGHT, type: ShadingType.CLEAR } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '450 hours (Indiana minimum)', size: 22, font: 'Arial', color: DARK })] })], shading: { fill: LIGHT, type: ShadingType.CLEAR } }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Esthetics', size: 22, font: 'Arial', color: DARK })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Indiana State Board — Esthetician License', size: 22, font: 'Arial', color: DARK })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '700 hours (Indiana minimum)', size: 22, font: 'Arial', color: DARK })] })] }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Cosmetology', size: 22, font: 'Arial', color: DARK })] })], shading: { fill: LIGHT, type: ShadingType.CLEAR } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Indiana State Board — Cosmetology License', size: 22, font: 'Arial', color: DARK })] })], shading: { fill: LIGHT, type: ShadingType.CLEAR } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '1,500 hours (Indiana minimum)', size: 22, font: 'Arial', color: DARK })] })], shading: { fill: LIGHT, type: ShadingType.CLEAR } }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Barbering', size: 22, font: 'Arial', color: DARK })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Indiana State Board — Barber License', size: 22, font: 'Arial', color: DARK })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '1,500 hours (Indiana minimum)', size: 22, font: 'Arial', color: DARK })] })] }),
            ],
          }),
        ],
      }),
      spacer(),

      hr(),

      // ── ROLES & RESPONSIBILITIES ──
      heading('ROLES & RESPONSIBILITIES'),

      subheading('Elevate for Humanity'),
      bullet('Serve as the DOL Registered Apprenticeship Sponsor for all programs'),
      bullet('Administer enrollment, funding navigation (WIOA, Pell, Job Ready Indy), and student records'),
      bullet('Issue digital credentials and coordinate state board exam registration'),
      bullet('Maintain ETPL listing and DOL compliance documentation'),
      bullet('Process enrollment payments and maintain financial records for all programs'),
      bullet('Provide the Elevate LMS platform for student tracking and reporting'),
      spacer(80),

      subheading('Jozanna George (Program Holder)'),
      bullet('Serve as the primary Program Holder and instructor lead for all Beauty & Barbering programs'),
      bullet('Deliver or supervise curriculum instruction at Textures Institute of Cosmetology'),
      bullet('Maintain all required Indiana IPLA licenses (Nail Tech, Nail Instructor, Esthetician)'),
      bullet('Document and submit student clock hours to Elevate for IPLA and DOL reporting'),
      bullet('Coordinate with Arthur Harris on facility scheduling, equipment, and student access'),
      bullet('Prepare students for Indiana State Board licensing exams'),
      spacer(80),

      subheading('Arthur Harris / Textures Institute of Cosmetology'),
      bullet('Serve as the Authorized Training Site Representative for Textures Institute of Cosmetology'),
      bullet('Provide facility access, equipment, and supplies for all apprenticeship program instruction'),
      bullet('Maintain the Indiana IPLA establishment license for Textures Institute of Cosmetology'),
      bullet('Ensure the facility meets all IPLA, DOL, and Elevate program standards'),
      bullet('Cooperate with Elevate and Jozanna George on scheduling, inspections, and compliance'),
      bullet('Maintain facility liability insurance and provide proof of coverage to Elevate annually'),
      spacer(),

      hr(),

      // ── TERM ──
      heading('TERM & TERMINATION'),
      body('This Agreement is effective as of the date above and shall remain in effect for one (1) year, automatically renewing annually unless terminated by either party with 30 days written notice. Either party may terminate this Agreement for cause with immediate effect upon written notice if the other party materially breaches any provision of this Agreement.'),
      spacer(),

      hr(),

      // ── SIGNATURES ──
      heading('SIGNATURES'),
      body('By signing below, each party agrees to the terms of this Partnership Agreement and commits to fulfilling their respective roles and responsibilities as outlined above.'),
      spacer(),

      ...signatureLine('Elevate for Humanity', 'Elizabeth Greene', 'Executive Director', 'Elevate for Humanity | Workforce Credential Institute'),
      ...signatureLine('Program Holder', 'Jozanna George', 'Program Holder — Beauty & Barbering', 'Textures Institute of Cosmetology / Elevate for Humanity'),
      ...signatureLine('Training Site Representative', 'Arthur Harris', 'Authorized Representative', 'Textures Institute of Cosmetology'),

    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  const outPath = '/tmp/Textures_Institute_Partnership_Agreement.docx';
  fs.writeFileSync(outPath, buf);
  console.log('✅ Agreement generated:', outPath);
  console.log('   Size:', (buf.length / 1024).toFixed(1) + ' KB');
});
