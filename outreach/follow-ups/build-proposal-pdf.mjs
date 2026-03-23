import PDFDocument from 'pdfkit';
import fs from 'fs';

const NAVY = '#1a3a6b';
const GOLD = '#c9a227';
const BLACK = '#111111';
const GRAY = '#666666';
const LIGHT = '#f0f0f0';
const WHITE = '#ffffff';

const MARGIN = 72; // 1 inch
const PAGE_W = 612; // Letter width in points
const PAGE_H = 792; // Letter height in points
const CONTENT_W = PAGE_W - MARGIN * 2;

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
  info: {
    Title: 'Workforce to Homeownership Mobility Program',
    Author: 'Elizabeth L. Greene — Elevate for Humanity',
    Subject: 'Proposal for Strategic Collaboration',
  },
});

const out = fs.createWriteStream('outreach/follow-ups/workforce-homeownership-proposal.pdf');
doc.pipe(out);

// ── Helpers ───────────────────────────────────────────────────────────────────

const rule = (y, color = NAVY, thickness = 1) => {
  doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).lineWidth(thickness).strokeColor(color).stroke();
};

const sectionHeading = (text) => {
  doc.moveDown(1.2);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY);
  doc.text(text.toUpperCase(), MARGIN, doc.y, { width: CONTENT_W });
  const y = doc.y + 4;
  rule(y, NAVY, 0.75);
  doc.moveDown(0.6);
  doc.font('Helvetica').fontSize(11).fillColor(BLACK);
};

const bodyText = (text) => {
  doc.font('Helvetica').fontSize(11).fillColor(BLACK);
  doc.text(text, MARGIN, doc.y, { width: CONTENT_W, align: 'justify', lineGap: 3 });
  doc.moveDown(0.4);
};

const bulletItem = (text, bold = false) => {
  const bx = MARGIN + 14;
  const bw = CONTENT_W - 14;
  doc.font('Helvetica').fontSize(10).fillColor(NAVY).text('\u2022', MARGIN, doc.y, { width: 14, continued: false });
  const y = doc.y - doc.currentLineHeight();
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11).fillColor(BLACK);
  doc.text(text, bx, y, { width: bw, lineGap: 2 });
  doc.moveDown(0.2);
};

const stageBlock = (title, items) => {
  doc.moveDown(0.5);
  // Left border line
  const startY = doc.y;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY);
  doc.text(title, MARGIN + 16, doc.y, { width: CONTENT_W - 16, lineGap: 2 });
  doc.moveDown(0.3);
  items.forEach(item => {
    doc.font('Helvetica').fontSize(10.5).fillColor(BLACK);
    doc.text('\u2022  ' + item, MARGIN + 28, doc.y, { width: CONTENT_W - 28, lineGap: 2 });
    doc.moveDown(0.2);
  });
  const endY = doc.y;
  doc.moveTo(MARGIN + 4, startY - 2).lineTo(MARGIN + 4, endY).lineWidth(3).strokeColor(NAVY).stroke();
  doc.moveDown(0.3);
};

const pageHeader = () => {
  const logoH = 45;
  const logoW = Math.round(logoH * (341 / 512));
  doc.image('public/logo.png', MARGIN, 20, { height: logoH, width: logoW });
  doc.font('Helvetica').fontSize(8).fillColor(GRAY);
  doc.text('Workforce to Homeownership Mobility Program', MARGIN, 24, { width: CONTENT_W, align: 'right' });
  doc.text('Proposal for Strategic Collaboration', MARGIN, 34, { width: CONTENT_W, align: 'right' });
  rule(72, NAVY, 0.75);
};

const pageFooter = (pageNum, total) => {
  rule(PAGE_H - 50, '#cccccc', 0.5);
  doc.font('Helvetica').fontSize(8).fillColor(GRAY);
  doc.text(
    `Elevate for Humanity  |  (317) 314-3757  |  www.elevateforhumanity.org`,
    MARGIN, PAGE_H - 40, { width: CONTENT_W, align: 'center' }
  );
  doc.text(`Page ${pageNum}`, MARGIN, PAGE_H - 28, { width: CONTENT_W, align: 'center' });
};

const outcomeRow = (indicator, measurement, shade) => {
  const col1W = CONTENT_W * 0.38;
  const col2W = CONTENT_W * 0.62;
  const rowH = 28;
  const y = doc.y;
  if (shade) {
    doc.rect(MARGIN, y, CONTENT_W, rowH).fill('#f5f5f5');
  }
  doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK);
  doc.text(indicator, MARGIN + 6, y + 8, { width: col1W - 6 });
  doc.font('Helvetica').fontSize(10).fillColor(BLACK);
  doc.text(measurement, MARGIN + col1W + 6, y + 8, { width: col2W - 6 });
  doc.rect(MARGIN, y, CONTENT_W, rowH).lineWidth(0.3).strokeColor('#cccccc').stroke();
  doc.y = y + rowH;
};

const gridItem = (title, desc, x, y, w) => {
  doc.rect(x, y, w - 6, 0).stroke(); // placeholder for height calc
  doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
  doc.text(title, x + 8, y + 8, { width: w - 22 });
  doc.font('Helvetica').fontSize(10).fillColor(BLACK);
  doc.text(desc, x + 8, doc.y + 2, { width: w - 22, lineGap: 2 });
  const endY = doc.y + 8;
  doc.rect(x, y, w - 6, endY - y).lineWidth(0.5).strokeColor('#cccccc').stroke();
  return endY;
};

// ─────────────────────────────────────────────────────────────────────────────
// COVER PAGE
// ─────────────────────────────────────────────────────────────────────────────

const logoH = 120;
const logoW = Math.round(logoH * (341 / 512));
doc.image('public/logo.png', (PAGE_W - logoW) / 2, 140, { height: logoH, width: logoW });

rule(290, NAVY, 1.5);

doc.font('Helvetica-Bold').fontSize(20).fillColor(NAVY);
doc.text('WORKFORCE & ECONOMIC MOBILITY PATHWAY', MARGIN, 310, { width: CONTENT_W, align: 'center' });

doc.font('Helvetica').fontSize(15).fillColor('#333333');
doc.text('Workforce to Homeownership Mobility Program', MARGIN, doc.y + 12, { width: CONTENT_W, align: 'center' });

doc.font('Helvetica-Oblique').fontSize(12).fillColor(GRAY);
doc.text('Proposal for Strategic Collaboration', MARGIN, doc.y + 8, { width: CONTENT_W, align: 'center' });

rule(doc.y + 24, NAVY, 1.5);

doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY);
doc.text('Prepared By:', MARGIN, doc.y + 36, { width: CONTENT_W, align: 'center' });
doc.font('Helvetica').fontSize(11).fillColor(BLACK);
doc.text('Elevate for Humanity', MARGIN, doc.y + 6, { width: CONTENT_W, align: 'center' });
doc.text('Founder & Executive Director, Elizabeth L. Greene', MARGIN, doc.y + 4, { width: CONTENT_W, align: 'center' });

doc.moveDown(1.2);
doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY);
doc.text('Prepared For:', MARGIN, doc.y, { width: CONTENT_W, align: 'center' });
doc.font('Helvetica').fontSize(11).fillColor(BLACK);
doc.text('Housing Authority Partners', MARGIN, doc.y + 6, { width: CONTENT_W, align: 'center' });
doc.text('Workforce Development Agencies', MARGIN, doc.y + 4, { width: CONTENT_W, align: 'center' });
doc.text('Employer & Community Partners', MARGIN, doc.y + 4, { width: CONTENT_W, align: 'center' });

rule(PAGE_H - 90, NAVY, 0.75);
doc.font('Helvetica').fontSize(9).fillColor(GRAY);
doc.text('www.elevateforhumanity.org  |  (317) 314-3757  |  Elevate4humanityedu@gmail.com',
  MARGIN, PAGE_H - 76, { width: CONTENT_W, align: 'center' });
doc.text('Elevate for Humanity is a 501(c)(3) nonprofit workforce development institute.',
  MARGIN, PAGE_H - 62, { width: CONTENT_W, align: 'center' });

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2 — TABLE OF CONTENTS
// ─────────────────────────────────────────────────────────────────────────────

doc.addPage();
pageHeader();
doc.y = 90;

doc.font('Helvetica-Bold').fontSize(13).fillColor(NAVY);
doc.text('TABLE OF CONTENTS', MARGIN, doc.y, { width: CONTENT_W, align: 'center' });
doc.moveDown(1);

const tocItems = [
  '1.   Executive Vision: Aligning With Policy & Opportunity',
  '2.   Program Overview & The Need We Address',
  '3.   Structured Pathway: Full Implementation Model',
  '4.   Outcomes & Performance Metrics',
  '5.   Federal Context & Policy Alignment',
  '6.   Organizational Alignment & Strategic Positioning',
  '7.   Program Impact',
  '8.   Next Steps: Partnership Discussion',
  '9.   Contact Information',
];

tocItems.forEach(item => {
  doc.font('Helvetica').fontSize(11).fillColor(BLACK);
  doc.text(item, MARGIN, doc.y, { width: CONTENT_W });
  rule(doc.y + 4, '#dddddd', 0.4);
  doc.moveDown(0.6);
});

pageFooter(2);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3 — SECTIONS 1 & 2
// ─────────────────────────────────────────────────────────────────────────────

doc.addPage();
pageHeader();
doc.y = 90;

sectionHeading('1. Executive Vision: Aligning With Policy & Opportunity');
bodyText('Across the country, there is renewed national focus on expanding workforce participation and increasing access to practical, skills-based training for low-income individuals. Recent federal policy direction, including the One Big Beautiful Bill Act, reflects a broader commitment to strengthening workforce engagement and ensuring individuals receiving public support have structured pathways into employment.');
bodyText('Elevate for Humanity was built in direct response to this need. Our mission is to create intentional, structured career pathways that move individuals from instability to sustainability. We design measurable training-to-employment pipelines that result in:');
bulletItem('Credential attainment');
bulletItem('Paid On-the-Job Training (OJT)');
bulletItem('Employment placement');
bulletItem('Wage progression');
bulletItem('Long-term economic mobility leading toward housing stability and homeownership readiness');

sectionHeading('2. Program Overview & The Need We Address');
bodyText('Many residents face systemic barriers to employment including limited access to credentialed training, transportation challenges, financial constraints, and lack of employer connections. At the same time, regional industries — including healthcare, skilled trades, and technology — continue to experience workforce shortages. Elevate bridges this gap by aligning training directly with employer demand.');
bodyText('Our programs are:');
bulletItem('Competency-based', true);
bulletItem('Credential-focused', true);
bulletItem('Structured to transition participants directly into paid OJT placements and employment opportunities', true);

pageFooter(3);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 4 — SECTION 3: PATHWAY
// ─────────────────────────────────────────────────────────────────────────────

doc.addPage();
pageHeader();
doc.y = 90;

sectionHeading('3. Structured Pathway: Full Implementation Model');

// Pathway banner
const bannerY = doc.y;
doc.rect(MARGIN, bannerY, CONTENT_W, 30).fill('#f0f4f8');
doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
doc.text(
  'Workforce Training  \u2192  Paid Employment  \u2192  Wage Growth  \u2192  Housing Stability  \u2192  Homeownership Readiness',
  MARGIN, bannerY + 9, { width: CONTENT_W, align: 'center' }
);
doc.rect(MARGIN, bannerY, CONTENT_W, 30).lineWidth(1).strokeColor(NAVY).stroke();
doc.y = bannerY + 38;

bodyText('Participants do not simply enroll in classes. They enter a defined progression model that includes structured preparation, industry-aligned training, paid workforce engagement, and transition toward financial independence.');

stageBlock('Stage 1 \u2014 Resident Identification & Intake', [
  'Work readiness evaluation',
  'Career interest mapping',
  'Barrier assessment',
  'Development of an Individual Workforce Plan',
]);
stageBlock('Stage 2 \u2014 Workforce Preparation', [
  'Professional communication training',
  'Attendance and accountability standards',
  'Workplace expectations',
  'Financial literacy planning',
  'Introduction to the housing-to-homeownership pathway',
]);
stageBlock('Stage 3 \u2014 Technical Training & Credentialing', [
  'Employer-aligned training in Healthcare, Skilled Trades (including HVAC), and Technology/Business Support',
  "Approved on Indiana's Eligible Training Provider List (ETPL) through WorkOne",
  'Eligible participants access training at no out-of-pocket cost through WIOA and Workforce Ready Grant funding',
  'Proctored credential testing integrated within the program structure',
]);
stageBlock('Stage 4 \u2014 Employer Alignment & Paid OJT', [
  'Employer interviews coordinated by Elevate',
  'Paid On-the-Job Training placements',
  'Direct hire employment pipelines',
  'Participants enter the workplace credential-ready — improving retention, safety, and workforce stability',
]);
stageBlock('Stage 5 \u2014 Income Stabilization & Housing-to-Homeownership Pathway', [
  'Wage progression monitoring',
  'Financial coaching referrals',
  'Credit-building support',
  'Savings planning',
  'Transition toward homeownership readiness programming',
]);

pageFooter(4);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 5 — SECTIONS 4 & 5
// ─────────────────────────────────────────────────────────────────────────────

doc.addPage();
pageHeader();
doc.y = 90;

sectionHeading('4. Outcomes & Performance Metrics');

// Table header
const col1W = CONTENT_W * 0.38;
const col2W = CONTENT_W * 0.62;
const headerY = doc.y;
doc.rect(MARGIN, headerY, CONTENT_W, 28).fill(NAVY);
doc.font('Helvetica-Bold').fontSize(10.5).fillColor(WHITE);
doc.text('Performance Indicator', MARGIN + 6, headerY + 8, { width: col1W - 6 });
doc.text('Measurement', MARGIN + col1W + 6, headerY + 8, { width: col2W - 6 });
doc.y = headerY + 28;

const rows = [
  ['Credential Attainment', 'Completing industry-recognized certification'],
  ['OJT Placement Rate', 'Placed in paid On-the-Job Training'],
  ['Employment Placement Rate', 'Securing employment aligned with training pathway'],
  ['90-Day Retention', 'Employment stability at 30, 60, and 90 days post-placement'],
  ['Wage Progression', 'Starting wages and documented wage growth within first 90 days'],
  ['Housing Stability Advancement', 'Progress toward financial stabilization and homeownership readiness'],
];
rows.forEach(([ind, meas], i) => outcomeRow(ind, meas, i % 2 === 0));
doc.moveDown(1);

sectionHeading('5. Federal Context & Policy Alignment');
bodyText('In alignment with national policy trends, including the One Big Beautiful Bill Act, Elevate supports expanded access to workforce training and structured employment pathways that build long-term earning capacity and housing independence. Elevate operationalizes these priorities through structured, outcome-driven implementation — not philosophical alignment alone.');

pageFooter(5);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 6 — SECTION 6: ORG ALIGNMENT GRID
// ─────────────────────────────────────────────────────────────────────────────

doc.addPage();
pageHeader();
doc.y = 90;

sectionHeading('6. Organizational Alignment & Strategic Positioning');

const gridItems = [
  ['WIOA Frameworks', 'Meets performance-based standards including credential attainment, employment placement, and retention metrics.'],
  ['Workforce Ready Grant (WRG)', 'Aligned with state-recognized high-demand sectors and credential-based workforce funding priorities.'],
  ['Justice Reinvestment Initiative (JRI)', 'Supports justice-involved individuals transitioning into structured employment pathways.'],
  ['Government Vendor & State Bidder', 'Structured to meet public-sector accountability requirements.'],
  ['501(c)(3) Nonprofit Status', 'In partnership with Selfish Inc., providing compliance oversight, governance, and mission-driven service delivery.'],
  ['Approved Proctored Testing', 'Participants complete industry certification within the program structure.'],
  ['ETPL Approved \u2014 WorkOne', 'Eligible participants access training at no out-of-pocket cost through WorkOne and WIOA funding.'],
  ['Affiliated Nonprofit Collaboration', 'Stabilization services, financial literacy support, and long-term housing advancement coordination.'],
];

const colW = (CONTENT_W - 10) / 2;
let gx = MARGIN;
let gy = doc.y;
let maxY = gy;

gridItems.forEach((item, i) => {
  const x = i % 2 === 0 ? MARGIN : MARGIN + colW + 10;
  if (i % 2 === 0 && i > 0) {
    gy = maxY + 10;
    maxY = gy;
  }
  const endY = gridItem(item[0], item[1], x, gy, colW);
  if (endY > maxY) maxY = endY;
});

doc.y = maxY + 16;
pageFooter(6);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 7 — SECTIONS 7, 8, 9
// ─────────────────────────────────────────────────────────────────────────────

doc.addPage();
pageHeader();
doc.y = 90;

sectionHeading('7. Program Impact');
[
  'Increase participant earning capacity',
  'Reduce long-term dependency on public assistance',
  'Strengthen workforce participation compliance',
  'Create employer-connected talent pipelines',
  'Support measurable movement toward housing independence',
].forEach(item => bulletItem(item));

sectionHeading('8. Next Steps: Partnership Discussion');
bodyText('Elevate is prepared to implement this Workforce to Homeownership Mobility Program immediately in collaboration with housing leadership and employer partners.');
bodyText('We would welcome a 30-minute call to discuss how this model can be tailored to support the residents and workforce goals of your organization.');

sectionHeading('9. Contact Information');
doc.moveDown(0.5);
doc.font('Helvetica-Bold').fontSize(14).fillColor(NAVY);
doc.text('Elizabeth L. Greene', MARGIN, doc.y);
doc.font('Helvetica').fontSize(11).fillColor(BLACK);
doc.moveDown(0.4);
doc.text('Founder & Executive Director', MARGIN, doc.y);
doc.text('Elevate for Humanity Career & Technical Institute', MARGIN, doc.y + 2);
doc.text('(317) 314-3757', MARGIN, doc.y + 2);
doc.text('www.elevateforhumanity.org', MARGIN, doc.y + 2);
doc.text('Elevate4humanityedu@gmail.com', MARGIN, doc.y + 2);

doc.moveDown(2);
rule(doc.y, NAVY, 0.75);
doc.font('Helvetica-Oblique').fontSize(9).fillColor(GRAY);
doc.text('Elevate for Humanity is a 501(c)(3) nonprofit workforce development institute.', MARGIN, doc.y + 8, { width: CONTENT_W, align: 'center' });

pageFooter(7);

// ─────────────────────────────────────────────────────────────────────────────

doc.end();
out.on('finish', () => console.log('PDF done'));
