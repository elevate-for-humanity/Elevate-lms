/**
 * Elevate for Humanity — FSSA SNAP E&T Program Overview & Capability Statement
 * Full budget including all staff positions, shared utilities, facility rent $8,700/mo
 * Team from data/team.ts verified against elevateforhumanity.org/about/team
 * Salaries: Indianapolis BLS OES May 2024 market rates
 * CDL Class A: $5,500 | CDL Class B: $5,000
 */
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

function wrap(text: string, maxW: number, font: PDFFont, sz: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(test, sz) <= maxW) { cur = test; }
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
function money(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const NAVY  = rgb(0.12, 0.25, 0.50);
const BLACK = rgb(0.05, 0.05, 0.05);
const DGRAY = rgb(0.25, 0.25, 0.25);
const GRAY  = rgb(0.45, 0.45, 0.45);
const LGRAY = rgb(0.72, 0.72, 0.72);
const RULE  = rgb(0.82, 0.82, 0.82);
const NBGD  = rgb(0.93, 0.95, 0.98);
const ROWALT= rgb(0.97, 0.97, 0.97);
const WHITE = rgb(1, 1, 1);
const GREEN = rgb(0.08, 0.40, 0.16);
const GBGD  = rgb(0.91, 0.97, 0.91);
const HTXT  = rgb(1, 1, 1);

export async function generateTppOverviewPdf(): Promise<Uint8Array> {
  const doc  = await PDFDocument.create();
  const reg  = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ital = await doc.embedFont(StandardFonts.HelveticaOblique);

  const W = 612, H = 792, ML = 54, MR = 54, MB = 44;
  const CW = W - ML - MR;
  const LH = 13;

  let logo: Awaited<ReturnType<typeof doc.embedJpg>> | null = null;
  try {
    const fs = await import('fs'), path = await import('path');
    const p = path.join(process.cwd(), 'public', 'logo.jpg');
    if (fs.existsSync(p)) logo = await doc.embedJpg(fs.readFileSync(p)).catch(() => null);
  } catch { /* no logo */ }

  let page = doc.addPage([W, H]);
  let y = H - 54;
  const np = () => { page = doc.addPage([W, H]); y = H - 50; };
  const cy = (n = 40) => { if (y < MB + n) np(); };

  const t = (s: string, x: number, yy: number, f: PDFFont, sz: number, c = BLACK) =>
    page.drawText(s, { x, y: yy, size: sz, font: f, color: c });
  const hr = (yy: number, th = 0.5, c = RULE) =>
    page.drawLine({ start: { x: ML, y: yy }, end: { x: W - MR, y: yy }, thickness: th, color: c });
  const box = (x: number, yy: number, w: number, h: number, c = WHITE, bc?: typeof BLACK, bw = 0.5) =>
    page.drawRectangle({ x, y: yy, width: w, height: h, color: c, ...(bc ? { borderColor: bc, borderWidth: bw } : {}) });
  const tc = (s: string, yy: number, f: PDFFont, sz: number, c = BLACK) => {
    const tw = f.widthOfTextAtSize(s, sz);
    page.drawText(s, { x: ML + (CW - tw) / 2, y: yy, size: sz, font: f, color: c });
  };
  const secHdr = (num: string, title: string) => {
    cy(30); box(ML, y - 5, CW, 22, NAVY);
    t(`SECTION ${num}  —  ${title.toUpperCase()}`, ML + 8, y + 8, bold, 9.5, HTXT);
    y -= 30;
  };
  const subHdr = (title: string) => {
    cy(20); box(ML, y - 3, CW, 16, NBGD);
    t(title.toUpperCase(), ML + 6, y + 5, bold, 7.5, NAVY);
    y -= 22;
  };
  const para = (text: string, indent = 0, sz = 9) => {
    const lines = wrap(text, CW - indent, reg, sz);
    for (const l of lines) { cy(12); t(l, ML + indent, y, reg, sz, BLACK); y -= LH; }
    y -= 3;
  };
  const bul = (text: string, indent = 8, sz = 8.5) => {
    const lines = wrap(text, CW - indent - 12, reg, sz);
    cy(12); t('\u2022', ML + indent, y, bold, sz, NAVY);
    lines.forEach((l, i) => { cy(12); t(l, ML + indent + 10, y - i * LH, reg, sz, BLACK); });
    y -= lines.length * LH + 2;
  };
  const lv = (label: string, value: string, lw = 160) => {
    cy(14); t(label, ML, y, bold, 8, GRAY);
    const vlines = wrap(value, CW - lw, reg, 9);
    vlines.forEach((vl, vi) => t(vl, ML + lw, y - vi * LH, reg, 9, BLACK));
    y -= Math.max(LH + 2, vlines.length * LH + 2);
  };
  const runHdr = (pg: PDFPage, pn: number, tot: number) => {
    pg.drawRectangle({ x: 0, y: H - 30, width: W, height: 30, color: NAVY });
    if (logo) { const lh = 22, lw = (logo.width / logo.height) * lh; pg.drawImage(logo, { x: ML, y: H - 28, width: lw, height: lh }); }
    const hx = logo ? ML + (logo.width / logo.height) * 22 + 8 : ML;
    pg.drawText(`${PLATFORM_DEFAULTS.orgName}  ·  FSSA SNAP E&T Program Overview & Capability Statement`, { x: hx, y: H - 19, size: 7.5, font: bold, color: HTXT });
    pg.drawText(`Page ${pn} of ${tot}`, { x: W - MR - 50, y: H - 19, size: 7.5, font: reg, color: rgb(0.75, 0.85, 1) });
  };
  const runFtr = (pg: PDFPage) => {
    pg.drawLine({ start: { x: ML, y: MB + 14 }, end: { x: W - MR, y: MB + 14 }, thickness: 0.4, color: RULE });
    pg.drawText(`${PLATFORM_DEFAULTS.orgLegalName}  ·  8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240  ·  ${PLATFORM_DEFAULTS.supportPhone}`, { x: ML, y: MB + 4, size: 6.5, font: reg, color: LGRAY });
  };

  // ══════════════════════════════════════════════════════════════════
  // COVER PAGE
  // ══════════════════════════════════════════════════════════════════
  box(0, H - 82, W, 82, NAVY);
  if (logo) { const lh = 62, lw = (logo.width / logo.height) * lh; page.drawImage(logo, { x: ML, y: H - 76, width: lw, height: lh }); }
  const hx0 = logo ? ML + (logo.width / logo.height) * 62 + 14 : ML;
  t(PLATFORM_DEFAULTS.orgLegalName, hx0, H - 30, bold, 11, HTXT);
  t('8888 Keystone Crossing, Suite 1300  ·  Indianapolis, IN 46240', hx0, H - 44, reg, 8, rgb(0.75, 0.85, 1));
  t(`${PLATFORM_DEFAULTS.supportPhone}  ·  elevate4humanityedu@gmail.com  ·  ${PLATFORM_DEFAULTS.canonicalDomain}`, hx0, H - 57, reg, 8, rgb(0.75, 0.85, 1));
  t('EIN: 85-3832840  ·  UEI: VX2GK5S8SZH8  ·  CAGE: 0Q856  ·  RAPIDS: 2025-IN-132301', hx0, H - 70, reg, 7.5, rgb(0.65, 0.78, 1));
  y = H - 104; y -= 20;
  t('STATE OF INDIANA', ML, y, bold, 9, GRAY); y -= 13;
  t('Family and Social Services Administration — Division of Family Resources', ML, y, reg, 9, DGRAY); y -= 13;
  t('SNAP Employment & Training Program — Third Party Provider', ML, y, reg, 9, DGRAY); y -= 28;
  hr(y + 22, 2, NAVY); y -= 8;
  tc('PROGRAM OVERVIEW & CAPABILITY STATEMENT', y, bold, 16, BLACK); y -= 20;
  tc('Comprehensive Plan for FSSA DFR Review — Indiana SNAP E&T', y, ital, 10, DGRAY); y -= 10;
  hr(y, 2, NAVY); y -= 20;
  t(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, ML, y, reg, 9, DGRAY); y -= 13;
  t('Authorized Representative: Elizabeth Greene, Founder & Chief Executive Officer', ML, y, reg, 9, DGRAY); y -= 26;
  box(ML, y - 76, CW, 84, rgb(0.97, 0.97, 1), NAVY, 0.75);
  t('EXECUTIVE SUMMARY', ML + 10, y - 4, bold, 9, NAVY);
  [`${PLATFORM_DEFAULTS.orgLegalName} (2Exclusive LLC-S, DBA) is a For-Profit workforce`,
   'development organization headquartered in Indianapolis, Indiana. We deliver 35+ industry-recognized',
   'credential programs to SNAP recipients, ABAWD participants, Returning Citizens, and workforce-ready',
   'individuals across Marion County and surrounding communities. Our model combines hands-on credential',
   'training, wraparound supportive services, and direct employer connections to achieve sustainable',
   'employment outcomes. We are an Indiana ETPL-listed provider, DOL Registered Apprenticeship Sponsor',
   '(RAPIDS: 2025-IN-132301), ByBlack certified, Certiport CATC, CareerSafe OSHA provider, Milady partner,',
   'NRF Rise Up provider, Job Ready Indy approved, WorkOne partner, and EmployIndy partner.',
  ].forEach((l, i) => t(l, ML + 10, y - 18 - i * 10.5, reg, 8, BLACK));
  y -= 100; y -= 6;
  t('TABLE OF CONTENTS', ML, y, bold, 10, BLACK); y -= 6; hr(y, 1, NAVY); y -= 4;
  // Column header row
  box(ML, y - 3, CW, 16, NAVY);
  t('#', ML + 6, y + 5, bold, 8, HTXT);
  t('Section Title', ML + 24, y + 5, bold, 8, HTXT);
  t('Contents', ML + 300, y + 5, bold, 8, HTXT);
  y -= 18;
  [['1','Organization Profile, Credentials & Testing Center','Legal identity, EIN, CAGE, DOL, ETPL, Certiport CATC, 4 facilities'],
   ['2','Mission, Vision & Target Population','SNAP populations served, enrollment process, projected outcomes'],
   ['3','Full Program Catalog — 35+ Programs','All programs: duration, cost, credential, employer demand'],
   ['4','Jobs Aligned With Our Programs','Job titles, BLS wages, career ladders, hiring partners by track'],
   ['5','Supportive Services Plan','All 8 services, policies, reimbursement rates, 7 CFR 273.7(d)(4)'],
   ['6','All Partners & Vendors','Workforce agencies, employers, apprenticeship hosts, vendors'],
   ['7','Full Staff & Organizational Chart','All positions, bios, qualifications, salaries, E&T FTE allocations'],
   ['8','Compliance & Regulatory Standing','ETPL, DOL, FSSA, FERPA, insurance, background checks, data privacy'],
   ['9','FSSA SNAP E&T TPP Budget','Personnel, 4 facilities, training materials, supportive services'],
  ].forEach(([num, title, desc]) => {
    cy(18); box(ML, y - 3, CW, 16, parseInt(num) % 2 === 0 ? ROWALT : WHITE);
    t(`${num}.`, ML + 6, y + 5, bold, 9, NAVY);
    t(title, ML + 24, y + 5, bold, 8, BLACK);
    t(desc, ML + 300, y + 5, reg, 7.5, GRAY);
    y -= 18;
  });
  const coverPg = page;
  np(); y = H - 50;

  // ══════════════════════════════════════════════════════════════════
  // SECTION 1 — ORGANIZATION PROFILE, CREDENTIALS & TESTING CENTER
  // ══════════════════════════════════════════════════════════════════
  secHdr('1', 'Organization Profile, Credentials & Testing Center');

  subHdr('Legal Identity');
  lv('Legal Entity Name:', '2Exclusive LLC-S');
  lv('DBA:', PLATFORM_DEFAULTS.orgLegalName);
  lv('Organization Type:', 'For-Profit Corporation (S-Corp)');
  lv('Federal Tax ID (EIN):', '85-3832840');
  lv('UEI (SAM.gov):', 'VX2GK5S8SZH8');
  lv('CAGE Code:', '0Q856');
  lv('SAM.gov Status:', 'Active — Federal Government Contractor');
  lv('DOL Provider ID:', '206251');
  lv('RAPIDS (Apprenticeship):', '2025-IN-132301');
  y -= 4;

  subHdr('Facility Locations — 4 Active Training Sites');
  para(`${PLATFORM_DEFAULTS.orgName} operates four dedicated training facilities across Indianapolis, each serving a specific program track. All locations are accessible by IndyGo public transit.`);
  y -= 2;

  const facilities4 = [
    {
      name: 'Administrative Offices & Testing Center (2 Offices)',
      addr: '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240',
      rent: '$1,700/mo per office × 2 = $3,400/mo (utilities not included)',
      use:  'Administrative offices, Certiport Authorized Testing Center, computer lab, case management, SNAP E&T intake, student resource center, IT program instruction.',
      transit: 'IndyGo Route 39 (Keystone Ave)',
    },
    {
      name: 'Hands-On Trades Training Facility',
      addr: '5860 Caito Dr, Building 5, Indianapolis, IN',
      rent: '$2,841/mo (utilities included)',
      use:  'HVAC, CDL prep, electrical, plumbing, welding, construction trades, forklift, diesel mechanic. Equipped with tools, safety gear, and hands-on training stations.',
      transit: 'IndyGo Route 8 (Michigan St)',
    },
    {
      name: 'Barbering & Beauty School',
      addr: '6331 N Keystone Ave, Indianapolis, IN 46220',
      rent: '$5,000/mo (utilities included)',
      use:  'Cosmetology, barbering, nail technician, esthetician, beauty career educator programs. Operated by Naomi Jordan / Rebuilds Mind and Body Studio LLC (Program Holder MOU on file).',
      transit: 'IndyGo Route 39 (Keystone Ave)',
    },
    {
      name: 'Manufacturing & Construction Trades Site',
      addr: '7116 N College Ave, Indianapolis, IN',
      rent: '$1,600/mo (utilities included)',
      use:  'Construction trades certification, building services technician, forklift operator, welding, manufacturing fundamentals. Equipped for hands-on trades instruction.',
      transit: 'IndyGo Route 28 (College Ave)',
    },
  ];

  facilities4.forEach((f, i) => {
    cy(55); box(ML, y - 2, CW, 14, NBGD);
    t(f.name, ML + 6, y + 5, bold, 8, NAVY);
    y -= 18;
    lv('Address:', f.addr);
    lv('Monthly Rent:', f.rent);
    lv('Program Use:', f.use);
    lv('Transit Access:', f.transit);
    if (i < facilities4.length - 1) { hr(y - 2, 0.5, RULE); y -= 8; }
  });
  y -= 8;

  subHdr('All Active Certifications & Registrations');
  const certs = [
    ['Indiana ETPL',                          'Active — Eligible Training Provider List. Eligible for WIOA and SNAP E&T reimbursement.'],
    ['DOL Registered Apprenticeship Sponsor', 'Active — RAPIDS #2025-IN-132301 · Provider ID 206251. Programs: Barber, Cosmetology.'],
    ['SAM.gov Registration',                  'Active — UEI: VX2GK5S8SZH8 · CAGE: 0Q856. Eligible for federal and state contracts.'],
    ['Certiport CATC',                        'Authorized Testing Center — administers Microsoft, CompTIA, Adobe, IC3, and QuickBooks exams.'],
    ['CareerSafe OSHA Provider',              'Authorized to deliver OSHA 10 and OSHA 30 safety training and issue OSHA cards.'],
    ['NRF Rise Up Provider',                  'National Retail Federation — authorized to deliver and certify Retail Industry Fundamentals, Customer Service & Sales, and Advanced Customer Service & Sales credentials.'],
    ['Milady Partner',                        'Authorized Milady curriculum partner for Cosmetology, Esthetics, Barbering, and Nail Technology programs.'],
    ['ByBlack Certified',                     'Verified Black-owned business certification — ByBlack national registry.'],

    ['WIOA / WRG / JRI Approved',             'Approved provider under Workforce Innovation and Opportunity Act, Workforce Ready Grant, and Job Readiness Initiative.'],
    ['WorkOne Partner',                       'Active partner — Indiana WorkOne system. Participant referrals and co-enrollment.'],
    ['EmployIndy Partner',                    'Active partner — Indianapolis Workforce Development Board. Employer connections and funding.'],
    ['Job Ready Indy Partner',                'Active partner — City of Indianapolis workforce initiative.'],
    ['HSI Affiliate',                         'Hispanic-Serving Institution affiliate — expanded outreach to LEP and Hispanic communities.'],
    ['EPA 608 Certified Proctor',             'Elizabeth Greene is a certified EPA 608 exam proctor. Exams administered on-site.'],
  ];
  certs.forEach(([label, value], i) => {
    cy(16);
    box(ML, y - 3, CW, 15, i % 2 === 0 ? ROWALT : WHITE);
    t(label, ML + 4, y + 4, bold, 8, NAVY);
    const vlines = wrap(value, CW - 175, reg, 7.5);
    vlines.forEach((vl, vi) => t(vl, ML + 175, y + 4 - vi * 10, reg, 7.5, DGRAY));
    y -= Math.max(15, vlines.length * 10 + 5);
    hr(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  });
  y -= 8;

  subHdr('Certiport Authorized Testing Center (CATC)');
  para(`${PLATFORM_DEFAULTS.orgName} operates a Certiport Authorized Testing Center at 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240. The testing center is equipped with dedicated testing workstations, a certified proctor (Alberta Davis, Testing Center Coordinator), and secure exam delivery infrastructure. The following credential exams are administered on-site:`);
  const testingCreds = [
    'Microsoft Office Specialist (MOS) — Word, Excel, PowerPoint, Outlook, Access',
    'Microsoft Technology Associate (MTA)',
    'CompTIA A+, Network+, Security+ (Certiport delivery)',
    'IC3 Digital Literacy Certification',
    'QuickBooks Certified User (Intuit / Certiport)',
    'Adobe Certified Professional',
    'NRF Rise Up — Retail Industry Fundamentals, Customer Service & Sales',
    'EPA Section 608 Universal Certification (Elizabeth Greene, Certified Proctor)',
    'OSHA 10 and OSHA 30 (CareerSafe — online + proctored final)',
    'Indiana CNA State Exam (ISDH — coordinated with Ivy Tech / Prometric)',
    'CDL Skills Test (coordinated with Indiana BMV-approved range)',
  ];
  testingCreds.forEach(c => bul(c));
  y -= 8;

  // ══════════════════════════════════════════════════════════════════
  // SECTION 2 — MISSION, VISION & TARGET POPULATION
  // ══════════════════════════════════════════════════════════════════
  secHdr('2', 'Mission, Vision & Target Population');

  subHdr('Mission Statement');
  para(`${PLATFORM_DEFAULTS.orgLegalName} delivers industry-recognized credential programs to SNAP recipients, ABAWD participants, Returning Citizens, and workforce-ready individuals across Marion County and surrounding Indiana communities. Our model combines hands-on credential training, wraparound supportive services, and direct employer connections to achieve sustainable, living-wage employment outcomes. We believe that access to a credential — not a four-year degree — is the fastest, most direct path to economic self-sufficiency for the populations we serve.`);

  subHdr('Vision');
  para('A workforce ecosystem in which every individual — regardless of economic background, justice involvement, or prior education — has access to the credentials, support, and employer connections needed to achieve economic self-sufficiency. Elevate envisions a Marion County where SNAP receipt is a temporary bridge, not a permanent condition, because every participant has a clear, supported pathway to a living-wage career.');

  subHdr('Core Values');
  [
    'Dignity First — Every participant is treated with respect regardless of their background, justice involvement, or current circumstances.',
    'Credential-Driven — We deliver only programs that result in a recognized, employer-valued credential. No certificate of completion without a credential.',
    'Barrier Removal — We identify and remove every barrier — transportation, childcare, housing, tools, clothing — that stands between a participant and program completion.',
    'Employer Alignment — Every program is built around what employers in Marion County are actively hiring for, at wages above the SNAP exit threshold.',
    'Data Accountability — We track every participant from enrollment through 90-day post-placement and report outcomes transparently to all funding partners.',
  ].forEach(v => bul(v));
  y -= 4;

  subHdr('Founder Background');
  para('Elizabeth Greene is a U.S. Army Veteran (Unit Supply Specialist, Honorably Discharged), IRS Enrolled Agent (EA) with active EFIN and PTIN, EPA 608 Certified Proctor, Indiana Substitute Teacher, Licensed Barber, DOL Registered Apprenticeship Sponsor, SAM.gov Registered Federal Government Contractor (CAGE: 0Q856), ByBlack Certified, EmployIndy Partner, WorkOne Partner, ETPL Provider, WIOA/WRG/JRI Approved, Job Ready Indy Partner, HSI Affiliate, CareerSafe OSHA Provider, Milady Partner, NRF Rise Up Provider, and Certiport CATC. She also operates Selfish Inc., a 501(c)(3) nonprofit providing VITA free tax preparation and community services to underserved Indianapolis residents. Her personal experience navigating workforce barriers as a veteran and community member directly informs Elevate\'s participant-centered program design.');
  y -= 4;

  subHdr('SNAP E&T Participants Served — Annual Projection (150 Participants)');
  para('Elevate for Humanity projects serving 150 unduplicated SNAP E&T participants annually. The following table details the participant population by category, eligibility basis, and program track assignment. All participant counts are based on Marion County SNAP caseload data, WorkOne referral capacity, and Elevate\'s current enrollment infrastructure.');
  y -= 2;

  // Participant population table
  cy(16); box(ML, y - 3, CW, 14, NAVY);
  t('Participant Category', ML + 4, y + 3, bold, 7.5, HTXT);
  t('Eligibility Basis', ML + 200, y + 3, bold, 7.5, HTXT);
  t('Count', ML + 370, y + 3, bold, 7.5, HTXT);
  t('% of Total', ML + 410, y + 3, bold, 7.5, HTXT);
  t('Primary Program Track', ML + 460, y + 3, bold, 7.5, HTXT);
  y -= 16;

  const snapPop: [string, string, number, string][] = [
    ['Mandatory SNAP E&T Participants',          '7 CFR 273.7 — required to participate',                    45, 'Healthcare, IT, Trades'],
    ['Able-Bodied Adults Without Dependents (ABAWDs)', 'ABAWD work requirement — 80 hrs/mo',               30, 'Trades, CDL, IT'],
    ['Voluntary SNAP E&T Participants',          '7 CFR 273.7(o) — voluntary enrollment',                   25, 'Beauty, Business, Healthcare'],
    ['Returning Citizens (justice-involved)',    'JRI / Peer Recovery — SNAP eligible',                     20, 'Peer Recovery, Trades, IT'],
    ['Veterans — SNAP eligible',                 'DD-214 verified, SNAP household',                          5, 'IT, Trades, CDL'],
    ['Individuals with Disabilities — SNAP',     'ADA accommodated, SNAP eligible',                          5, 'IT, Business, Healthcare'],
    ['Limited English Proficiency (LEP)',        'SNAP eligible, ESL support provided',                      5, 'CNA, Forklift, Hospitality'],
    ['Older Disconnected Youth (18–24)',         'SNAP eligible, not in school or work',                    10, 'IT, Beauty, Business'],
    ['Housing-Unstable / Homeless — SNAP',       'SNAP eligible, housing barrier documented',                5, 'All tracks — barrier plan required'],
  ];

  snapPop.forEach(([cat, basis, count, track], i) => {
    const pct = Math.round((count / 150) * 100);
    cy(14); box(ML, y - 2, CW, 13, i % 2 === 0 ? ROWALT : WHITE);
    t(cat, ML + 4, y + 3, bold, 7.5, BLACK);
    t(basis, ML + 200, y + 3, reg, 7, GRAY);
    t(String(count), ML + 370, y + 3, bold, 7.5, BLACK);
    t(`${pct}%`, ML + 410, y + 3, reg, 7.5, DGRAY);
    t(track, ML + 460, y + 3, reg, 7, GRAY);
    y -= 14; hr(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  });
  cy(14); box(ML, y - 3, CW, 13, NBGD);
  t('TOTAL SNAP E&T PARTICIPANTS', ML + 4, y + 3, bold, 8, NAVY);
  t('150', ML + 370, y + 3, bold, 9, NAVY);
  t('100%', ML + 410, y + 3, bold, 8, NAVY);
  y -= 18;

  subHdr('SNAP E&T Eligibility & Enrollment Process');
  para('All participants enrolled in Elevate\'s SNAP E&T program are verified as SNAP-eligible prior to enrollment. The following process is followed for every participant:');
  [
    'Step 1 — Referral: Participant is referred by WorkOne Indianapolis, EmployIndy, FSSA DFR caseworker, or self-refers through Elevate\'s intake process.',
    'Step 2 — SNAP Verification: Elizabeth Greene (Authorized Representative) verifies active SNAP case number with FSSA DFR. Mandatory vs. voluntary status confirmed.',
    'Step 3 — Barrier Assessment: Leslie Wafford (Director of Community Services) and the SNAP E&T Case Manager conduct a comprehensive barrier assessment covering transportation, childcare, housing, disability, LEP, and justice involvement.',
    'Step 4 — Individual Employment Plan (IEP): SNAP E&T Case Manager develops a written IEP with the participant identifying the credential program, timeline, supportive services needed, and employment goal.',
    'Step 5 — Program Enrollment: Participant is enrolled in the appropriate credential program. Enrollment documentation submitted to FSSA DFR within 5 business days.',
    'Step 6 — Supportive Services Authorization: Required supportive services (transportation, childcare, tools, clothing) authorized and disbursed per the IEP.',
    'Step 7 — Progress Monitoring: SNAP E&T Case Manager conducts monthly check-ins. Attendance tracked weekly. Indiana Career Connect updated monthly.',
    'Step 8 — Credential Attainment: Upon credential completion, participant is connected to employer partners for job placement. 90-day follow-up conducted.',
    'Step 9 — FSSA Reporting: Quarterly participant outcome reports submitted to FSSA DFR including enrollment, completion, credential attainment, and employment placement data.',
  ].forEach(s => bul(s));
  y -= 4;

  subHdr('SNAP E&T Participant Outcomes — Projected Annual Targets');
  cy(16); box(ML, y - 3, CW, 14, NAVY);
  t('Outcome Measure', ML + 4, y + 3, bold, 7.5, HTXT);
  t('Target', ML + 340, y + 3, bold, 7.5, HTXT);
  t('Basis', ML + 390, y + 3, bold, 7.5, HTXT);
  y -= 16;

  const outcomes: [string, string, string][] = [
    ['Total SNAP E&T participants enrolled',          '150',   'Annual unduplicated count'],
    ['Program completion rate',                       '82%',   '123 of 150 participants'],
    ['Credential attainment rate (of completers)',    '90%',   '111 of 123 completers'],
    ['Job placement rate (of credential earners)',    '74%',   '82 of 111 credential earners'],
    ['Average wage at placement',                     '$18.50/hr', 'Above SNAP exit threshold'],
    ['90-day job retention rate',                     '70%',   'Industry standard for population'],
    ['Participants exiting SNAP within 12 months',    '55%',   'Based on wage at placement'],
    ['ABAWDs meeting 80-hr/month work requirement',   '100%',  'All enrolled ABAWDs — mandatory'],
    ['Supportive services provided (transportation)', '60 participants/month', '$75/mo avg'],
    ['Supportive services provided (work clothing)',  '80 participants',       '$200 one-time avg'],
  ];

  outcomes.forEach(([measure, target, basis], i) => {
    cy(13); box(ML, y - 2, CW, 13, i % 2 === 0 ? ROWALT : WHITE);
    t(measure, ML + 4, y + 3, reg, 7.5, BLACK);
    t(target, ML + 340, y + 3, bold, 7.5, NAVY);
    t(basis, ML + 390, y + 3, reg, 7, GRAY);
    y -= 13; hr(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  });
  y -= 8;

  subHdr('Geographic Service Area');
  para('Primary: Marion County, Indiana (Indianapolis). Secondary: Hamilton, Hendricks, Johnson, and Madison Counties. Elevate\'s four training facilities are strategically located across Indianapolis to maximize access for SNAP participants without reliable transportation:');
  [
    '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240 — Administrative offices, testing center, computer lab, case management. Near IndyGo Route 39 (Keystone).',
    '5860 Caito Dr, Building 5, Indianapolis, IN — Hands-on trades training: HVAC, CDL prep, electrical, plumbing, welding, construction. Near IndyGo Route 8 (Michigan).',
    '6331 N Keystone Ave, Indianapolis, IN 46220 — Barbering, cosmetology, nail technician, esthetician programs. Near IndyGo Route 39 (Keystone). Operated by Naomi Jordan / Rebuilds Mind and Body Studio LLC.',
    '7116 N College Ave, Indianapolis, IN — Manufacturing and construction trades training: forklift, building services, diesel mechanic. Near IndyGo Route 28 (College).',
  ].forEach(l => bul(l));
  para(`All locations are accessible by IndyGo public transit. Transportation assistance (bus passes and mileage reimbursement) is provided to all participants who require it to attend training. Online and hybrid program components are available statewide via Elevate's proprietary LMS platform at ${PLATFORM_DEFAULTS.canonicalDomain}.`);
  y -= 8;

  // ══════════════════════════════════════════════════════════════════
  // SECTION 3 — FULL PROGRAM CATALOG
  // ══════════════════════════════════════════════════════════════════
  secHdr('3', 'Full Program Catalog — 35+ Credential Programs');

  para('All programs are listed on the Indiana Eligible Training Provider List (ETPL) and are eligible for WIOA, WRG, SNAP E&T, and self-pay funding. Pricing reflects ETPL-listed rates. CDL Class A: $5,500 | CDL Class B: $5,000 per Elizabeth Greene direction.');
  y -= 4;

  // Table header
  cy(20);
  box(ML, y - 3, CW, 16, NAVY);
  t('Program Title', ML + 4, y + 5, bold, 7.5, HTXT);
  t('Credential', ML + 170, y + 5, bold, 7.5, HTXT);
  t('Duration', ML + 330, y + 5, bold, 7.5, HTXT);
  t('Cost', ML + 390, y + 5, bold, 7.5, HTXT);
  t('Funding', ML + 440, y + 5, bold, 7.5, HTXT);
  y -= 20;

  const programs = [
    // Healthcare
    { sector: 'HEALTHCARE', items: [
      { title: 'Certified Nursing Assistant (CNA)',     cred: 'Indiana ISDH CNA Certification',              dur: '4–6 wks',  cost: '$1,800',  fund: 'FSSA/Self-Pay' },
      { title: 'Medical Assistant',                     cred: 'NHA CCMA Certification',                      dur: '12 wks',   cost: '$5,000',  fund: 'WIOA/WRG/SNAP' },
      { title: 'Phlebotomy Technician',                 cred: 'NHA CPT Certification',                       dur: '6 wks',    cost: '$2,500',  fund: 'WIOA/WRG/SNAP' },
      { title: 'Pharmacy Technician',                   cred: 'PTCB CPhT Certification',                     dur: '8 wks',    cost: '$3,500',  fund: 'WIOA/WRG/SNAP' },
      { title: 'Home Health Aide (HHA)',                cred: 'Indiana ISDH HHA Certification',              dur: '2 wks',    cost: '$800',    fund: 'WIOA/SNAP' },
      { title: 'Peer Recovery Specialist',              cred: 'Indiana DMHA CPRS Certification',             dur: '8 wks',    cost: '$5,000',  fund: 'WIOA/WRG/SNAP' },
      { title: 'CPR / First Aid / AED',                 cred: 'American Heart Association BLS Card',         dur: '1 day',    cost: '$75',     fund: 'Self-Pay' },
      { title: 'Sanitation & Infection Control',        cred: 'ServSafe / OSHA Sanitation Certificate',      dur: '1 wk',     cost: '$300',    fund: 'Self-Pay' },
      { title: 'Emergency Health & Safety',             cred: 'OSHA 10 / CareerSafe Certificate',            dur: '1 wk',     cost: '$150',    fund: 'Self-Pay' },
    ]},
    // Trades
    { sector: 'SKILLED TRADES', items: [
      { title: 'HVAC Technician',                       cred: 'EPA Section 608 Universal Certification',     dur: '4 wks',    cost: '$3,200',  fund: 'WIOA/WRG/SNAP' },
      { title: 'CDL Class A — Commercial Driver',       cred: 'Indiana CDL Class A License',                 dur: '4 wks',    cost: '$5,500',  fund: 'WIOA/WRG/SNAP' },
      { title: 'CDL Class B — Commercial Driver',       cred: 'Indiana CDL Class B License',                 dur: '3 wks',    cost: '$5,000',  fund: 'WIOA/WRG/SNAP' },
      { title: 'Welding Technology',                    cred: 'AWS D1.1 / OSHA 10 Certificate',              dur: '10 wks',   cost: '$4,800',  fund: 'WIOA/WRG/SNAP' },
      { title: 'Electrical Trades',                     cred: 'OSHA 10 / Electrical Safety Certificate',     dur: '8 wks',    cost: '$3,800',  fund: 'WIOA/WRG' },
      { title: 'Plumbing Trades',                       cred: 'OSHA 10 / Plumbing Fundamentals Certificate', dur: '8 wks',    cost: '$3,800',  fund: 'WIOA/WRG' },
      { title: 'Diesel Mechanic',                       cred: 'ASE Student Certification',                   dur: '12 wks',   cost: '$4,500',  fund: 'WIOA/WRG' },
      { title: 'Forklift Operator',                     cred: 'OSHA Forklift Operator Certificate',          dur: '1 wk',     cost: '$500',    fund: 'WIOA/SNAP' },
      { title: 'Construction Trades Certification',     cred: 'NCCER Core Curriculum Certificate',           dur: '8 wks',    cost: '$3,200',  fund: 'WIOA/WRG' },
    ]},
    // Beauty & Personal Services
    { sector: 'BEAUTY & PERSONAL SERVICES', items: [
      { title: 'Barber Apprenticeship',                 cred: 'Indiana IPLA Barber License',                 dur: '12 mo',    cost: '$4,980',  fund: 'DOL Apprenticeship' },
      { title: 'Cosmetology Apprenticeship',            cred: 'Indiana IPLA Cosmetologist License',          dur: '12 mo',    cost: '$6,000',  fund: 'DOL Apprenticeship' },
      { title: 'Nail Technician Apprenticeship',        cred: 'Indiana IPLA Nail Technician License',        dur: '20 wks',   cost: '$5,000',  fund: 'DOL Apprenticeship' },
      { title: 'Esthetician',                           cred: 'Indiana IPLA Esthetician License',            dur: '20 wks',   cost: '$5,500',  fund: 'WIOA/WRG' },
      { title: 'Beauty Career Educator',                cred: 'Milady Educator Certificate',                 dur: '8 wks',    cost: '$4,730',  fund: 'Self-Pay' },
    ]},
    // Business & Technology
    { sector: 'BUSINESS & TECHNOLOGY', items: [
      { title: 'IT Help Desk Technician',               cred: 'CompTIA A+ (220-1101 & 220-1102)',            dur: '8 wks',    cost: '$2,800',  fund: 'WIOA/WRG/SNAP' },
      { title: 'Cybersecurity Analyst',                 cred: 'CompTIA Security+ / CySA+',                   dur: '12 wks',   cost: '$4,500',  fund: 'WIOA/WRG' },
      { title: 'Network Support Technician',            cred: 'CompTIA Network+',                            dur: '8 wks',    cost: '$3,200',  fund: 'WIOA/WRG' },
      { title: 'Network Administration',                cred: 'CompTIA Network+ / CCNA',                     dur: '12 wks',   cost: '$4,200',  fund: 'WIOA/WRG' },
      { title: 'Web Development',                       cred: 'Certiport Web Development Certificate',       dur: '12 wks',   cost: '$3,500',  fund: 'WIOA/WRG' },
      { title: 'Software Development',                  cred: 'Certiport / CompTIA Developer Certificate',   dur: '16 wks',   cost: '$4,800',  fund: 'WIOA/WRG' },
      { title: 'Graphic Design',                        cred: 'Adobe Certified Professional',                dur: '8 wks',    cost: '$2,800',  fund: 'WIOA/WRG' },
      { title: 'CAD Drafting',                          cred: 'Autodesk AutoCAD Certification',              dur: '10 wks',   cost: '$3,500',  fund: 'WIOA/WRG' },
      { title: 'Bookkeeping & QuickBooks',              cred: 'QuickBooks ProAdvisor / NACPB Certificate',   dur: '5 wks',    cost: '$1,500',  fund: 'WIOA/WRG/SNAP' },
      { title: 'Tax Preparation',                       cred: 'IRS AFSP / VITA Certificate',                 dur: '6 wks',    cost: '$1,200',  fund: 'WIOA/SNAP' },
      { title: 'Office Administration',                 cred: 'Microsoft Office Specialist (MOS)',           dur: '6 wks',    cost: '$1,800',  fund: 'WIOA/WRG/SNAP' },
    ]},
    // Business Development
    { sector: 'BUSINESS DEVELOPMENT', items: [
      { title: 'Business Administration',               cred: 'NRF Rise Up / Elevate Certificate',           dur: '8 wks',    cost: '$2,500',  fund: 'WIOA/WRG/SNAP' },
      { title: 'Entrepreneurship',                      cred: 'Elevate Entrepreneurship Certificate',        dur: '6 wks',    cost: '$1,800',  fund: 'WIOA/SNAP' },
      { title: 'Project Management',                    cred: 'CAPM / PMI Certificate',                      dur: '8 wks',    cost: '$2,800',  fund: 'WIOA/WRG' },
      { title: 'Hospitality & Customer Service',        cred: 'NRF Rise Up Customer Service Certificate',    dur: '4 wks',    cost: '$1,200',  fund: 'WIOA/SNAP' },
      { title: 'Culinary Apprenticeship',               cred: 'ServSafe Manager / DOL Apprenticeship',       dur: '12 mo',    cost: '$5,500',  fund: 'DOL Apprenticeship' },
    ]},
  ];

  for (const sector of programs) {
    cy(20);
    box(ML, y - 2, CW, 14, NBGD);
    t(sector.sector, ML + 4, y + 4, bold, 8, NAVY);
    y -= 16;
    sector.items.forEach((item, i) => {
      cy(14);
      box(ML, y - 2, CW, 13, i % 2 === 0 ? ROWALT : WHITE);
      t(item.title, ML + 4, y + 3, reg, 7.5, BLACK);
      t(item.cred, ML + 170, y + 3, reg, 7, DGRAY);
      t(item.dur, ML + 330, y + 3, reg, 7.5, BLACK);
      t(item.cost, ML + 390, y + 3, bold, 7.5, BLACK);
      t(item.fund, ML + 440, y + 3, reg, 7, GRAY);
      y -= 13;
      hr(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
    });
    y -= 4;
  }
  y -= 8;

  // ══════════════════════════════════════════════════════════════════
  // SECTION 4 — JOBS ALIGNED WITH OUR PROGRAMS
  // ══════════════════════════════════════════════════════════════════
  secHdr('4', 'Jobs Aligned With Our Programs');
  para('All salary data sourced from U.S. Bureau of Labor Statistics OES May 2024, Indianapolis-Carmel-Anderson MSA (CBSA 26900). Career ladders show entry, mid, and advanced roles achievable from each credential program.');
  y -= 4;

  const jobSectors = [
    { sector: 'HEALTHCARE', jobs: [
      { prog: 'CNA / Nursing Assistant',    roles: [
        { title: 'Certified Nursing Assistant',           entry: '$16–$20/hr',  mid: '$19–$23/hr',  adv: '$22–$26/hr',  bls: '$35,740 median' },
        { title: 'Home Health Aide',                      entry: '$15–$18/hr',  mid: '$17–$21/hr',  adv: '$20–$24/hr',  bls: '$30,180 median' },
        { title: 'Patient Care Technician',               entry: '$17–$21/hr',  mid: '$20–$25/hr',  adv: '$23–$28/hr',  bls: '$38,000 median' },
        { title: 'Medical Assistant (w/ add\'l cert)',    entry: '$18–$22/hr',  mid: '$21–$26/hr',  adv: '$24–$30/hr',  bls: '$42,000 median' },
      ]},
      { prog: 'Medical Assistant',          roles: [
        { title: 'Medical Assistant',                     entry: '$18–$22/hr',  mid: '$21–$26/hr',  adv: '$25–$30/hr',  bls: '$42,000 median' },
        { title: 'Clinical Medical Assistant',            entry: '$19–$23/hr',  mid: '$22–$27/hr',  adv: '$26–$32/hr',  bls: '$44,000 median' },
        { title: 'Medical Office Manager',                entry: '$22–$28/hr',  mid: '$28–$35/hr',  adv: '$35–$45/hr',  bls: '$58,000 median' },
      ]},
      { prog: 'Phlebotomy Technician',      roles: [
        { title: 'Phlebotomist',                          entry: '$16–$20/hr',  mid: '$19–$24/hr',  adv: '$22–$28/hr',  bls: '$38,530 median' },
        { title: 'Lab Assistant',                         entry: '$17–$21/hr',  mid: '$20–$25/hr',  adv: '$23–$29/hr',  bls: '$40,000 median' },
      ]},
      { prog: 'Pharmacy Technician',        roles: [
        { title: 'Pharmacy Technician',                   entry: '$16–$20/hr',  mid: '$19–$24/hr',  adv: '$22–$28/hr',  bls: '$37,790 median' },
        { title: 'Senior Pharmacy Technician',            entry: '$20–$25/hr',  mid: '$24–$30/hr',  adv: '$28–$35/hr',  bls: '$44,000 median' },
      ]},
      { prog: 'Peer Recovery Specialist',   roles: [
        { title: 'Peer Recovery Specialist',              entry: '$16–$20/hr',  mid: '$19–$24/hr',  adv: '$22–$28/hr',  bls: '$38,000 median' },
        { title: 'Recovery Coach',                        entry: '$18–$22/hr',  mid: '$21–$26/hr',  adv: '$24–$30/hr',  bls: '$42,000 median' },
        { title: 'Behavioral Health Case Manager',        entry: '$20–$26/hr',  mid: '$25–$32/hr',  adv: '$30–$40/hr',  bls: '$50,000 median' },
      ]},
    ]},
    { sector: 'SKILLED TRADES', jobs: [
      { prog: 'HVAC Technician',            roles: [
        { title: 'HVAC Installer / Helper',               entry: '$18–$22/hr',  mid: '$22–$28/hr',  adv: '$28–$38/hr',  bls: '$57,300 median' },
        { title: 'HVAC Service Technician', entry: '$22–$28/hr',  mid: '$28–$36/hr',  adv: '$36–$48/hr',  bls: '$62,000 median' },
        { title: 'HVAC Lead Technician',    entry: '$28–$35/hr',  mid: '$35–$45/hr',  adv: '$45–$60/hr',  bls: '$70,000 median' },
      ]},
      { prog: 'CDL Class A',                roles: [
        { title: 'OTR Truck Driver (Class A)',             entry: '$22–$28/hr',  mid: '$28–$36/hr',  adv: '$36–$48/hr',  bls: '$62,000 median' },
        { title: 'Regional Driver',                       entry: '$24–$30/hr',  mid: '$30–$38/hr',  adv: '$38–$50/hr',  bls: '$65,000 median' },
        { title: 'Owner-Operator',                        entry: '$55,000/yr',  mid: '$75,000/yr',  adv: '$100,000+/yr', bls: '$80,000 median' },
      ]},
      { prog: 'CDL Class B',                roles: [
        { title: 'Bus Driver / Transit Operator',         entry: '$18–$24/hr',  mid: '$22–$28/hr',  adv: '$26–$34/hr',  bls: '$48,000 median' },
        { title: 'Delivery Driver (Class B)',             entry: '$20–$26/hr',  mid: '$24–$30/hr',  adv: '$28–$36/hr',  bls: '$52,000 median' },
      ]},
      { prog: 'Welding Technology',         roles: [
        { title: 'Welder',                                entry: '$18–$24/hr',  mid: '$24–$32/hr',  adv: '$32–$42/hr',  bls: '$47,010 median' },
        { title: 'Structural Welder',                     entry: '$22–$28/hr',  mid: '$28–$36/hr',  adv: '$36–$48/hr',  bls: '$55,000 median' },
      ]},
      { prog: 'Forklift Operator',          roles: [
        { title: 'Forklift Operator',                     entry: '$16–$20/hr',  mid: '$19–$24/hr',  adv: '$22–$28/hr',  bls: '$38,000 median' },
        { title: 'Warehouse Lead',                        entry: '$20–$26/hr',  mid: '$24–$30/hr',  adv: '$28–$36/hr',  bls: '$46,000 median' },
      ]},
    ]},
    { sector: 'BEAUTY & PERSONAL SERVICES', jobs: [
      { prog: 'Barber Apprenticeship',      roles: [
        { title: 'Licensed Barber',                       entry: '$28,000/yr',  mid: '$38,000/yr',  adv: '$55,000/yr',  bls: '$35,700 median' },
        { title: 'Master Barber',                         entry: '$38,000/yr',  mid: '$55,000/yr',  adv: '$75,000+/yr', bls: '$50,000 median' },
        { title: 'Barbershop Owner',                      entry: '$45,000/yr',  mid: '$65,000/yr',  adv: '$100,000+/yr',bls: 'Self-employed' },
      ]},
      { prog: 'Cosmetology Apprenticeship', roles: [
        { title: 'Licensed Cosmetologist',                entry: '$28,000/yr',  mid: '$40,000/yr',  adv: '$65,000/yr',  bls: '$33,400 median' },
        { title: 'Hair Colorist / Stylist',               entry: '$32,000/yr',  mid: '$48,000/yr',  adv: '$70,000+/yr', bls: '$45,000 median' },
        { title: 'Salon Manager',                         entry: '$38,000/yr',  mid: '$52,000/yr',  adv: '$70,000/yr',  bls: '$50,000 median' },
        { title: 'Salon Owner',                           entry: '$45,000/yr',  mid: '$70,000/yr',  adv: '$100,000+/yr',bls: 'Self-employed' },
      ]},
      { prog: 'Nail Technician',            roles: [
        { title: 'Nail Technician',                       entry: '$25,000/yr',  mid: '$35,000/yr',  adv: '$50,000/yr',  bls: '$30,000 median' },
        { title: 'Nail Instructor',                       entry: '$35,000/yr',  mid: '$45,000/yr',  adv: '$60,000/yr',  bls: '$40,000 median' },
        { title: 'Nail Salon Owner',                      entry: '$40,000/yr',  mid: '$60,000/yr',  adv: '$90,000+/yr', bls: 'Self-employed' },
      ]},
      { prog: 'Esthetician',                roles: [
        { title: 'Esthetician',                           entry: '$28,000/yr',  mid: '$40,000/yr',  adv: '$60,000/yr',  bls: '$36,510 median' },
        { title: 'Medical Esthetician',                   entry: '$35,000/yr',  mid: '$50,000/yr',  adv: '$75,000/yr',  bls: '$50,000 median' },
      ]},
    ]},
    { sector: 'TECHNOLOGY & BUSINESS', jobs: [
      { prog: 'IT Help Desk / CompTIA A+',  roles: [
        { title: 'IT Help Desk Technician',               entry: '$18–$22/hr',  mid: '$22–$28/hr',  adv: '$28–$36/hr',  bls: '$42,000 median' },
        { title: 'Desktop Support Specialist',            entry: '$20–$26/hr',  mid: '$25–$32/hr',  adv: '$30–$40/hr',  bls: '$52,000 median' },
        { title: 'Systems Administrator',                 entry: '$25–$32/hr',  mid: '$32–$42/hr',  adv: '$42–$55/hr',  bls: '$80,000 median' },
      ]},
      { prog: 'Bookkeeping & QuickBooks',   roles: [
        { title: 'Bookkeeper',                            entry: '$18–$22/hr',  mid: '$22–$28/hr',  adv: '$26–$34/hr',  bls: '$45,860 median' },
        { title: 'Accounting Clerk',                      entry: '$17–$21/hr',  mid: '$20–$26/hr',  adv: '$24–$30/hr',  bls: '$42,000 median' },
        { title: 'Accounting Manager',                    entry: '$28–$36/hr',  mid: '$36–$48/hr',  adv: '$48–$65/hr',  bls: '$78,000 median' },
      ]},
      { prog: 'Office Administration / MOS',roles: [
        { title: 'Administrative Assistant',              entry: '$16–$20/hr',  mid: '$19–$24/hr',  adv: '$22–$28/hr',  bls: '$40,990 median' },
        { title: 'Office Manager',                        entry: '$22–$28/hr',  mid: '$28–$36/hr',  adv: '$36–$48/hr',  bls: '$58,000 median' },
      ]},
      { prog: 'Tax Preparation',            roles: [
        { title: 'Tax Preparer',                          entry: '$18–$24/hr',  mid: '$24–$32/hr',  adv: '$32–$45/hr',  bls: '$46,290 median' },
        { title: 'Enrolled Agent (EA)',                   entry: '$35,000/yr',  mid: '$55,000/yr',  adv: '$85,000+/yr', bls: '$65,000 median' },
      ]},
    ]},
  ];

  for (const sector of jobSectors) {
    cy(20); box(ML, y - 2, CW, 14, NAVY);
    t(sector.sector, ML + 4, y + 4, bold, 8.5, HTXT); y -= 16;
    for (const prog of sector.jobs) {
      cy(18); box(ML, y - 2, CW, 13, NBGD);
      t(prog.prog, ML + 4, y + 3, bold, 8, NAVY); y -= 15;
      // column headers
      cy(14); box(ML, y - 2, CW, 12, rgb(0.96, 0.96, 0.96));
      t('Job Title', ML + 4, y + 2, bold, 7, GRAY);
      t('Entry', ML + 200, y + 2, bold, 7, GRAY);
      t('Mid-Career', ML + 280, y + 2, bold, 7, GRAY);
      t('Advanced', ML + 360, y + 2, bold, 7, GRAY);
      t('BLS Median', ML + 440, y + 2, bold, 7, GRAY);
      y -= 13;
      prog.roles.forEach((role, i) => {
        cy(12); box(ML, y - 2, CW, 12, i % 2 === 0 ? ROWALT : WHITE);
        t(role.title, ML + 4, y + 2, reg, 7.5, BLACK);
        t(role.entry, ML + 200, y + 2, reg, 7.5, BLACK);
        t(role.mid, ML + 280, y + 2, reg, 7.5, BLACK);
        t(role.adv, ML + 360, y + 2, reg, 7.5, BLACK);
        t(role.bls, ML + 440, y + 2, reg, 7, GRAY);
        y -= 12; hr(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
      });
      y -= 4;
    }
    y -= 6;
  }
  y -= 8;

  // ══════════════════════════════════════════════════════════════════
  // SECTION 5 — SUPPORTIVE SERVICES PLAN
  // ══════════════════════════════════════════════════════════════════
  secHdr('5', 'Supportive Services Plan');
  para('All supportive services are provided at no cost to the participant. Reimbursements comply with 7 CFR 273.7(d)(4) and the Indiana SNAP E&T State Plan. Mandatory services are provided to all mandatory E&T participants without exception.');
  y -= 4;

  const svcs = [
    { name: 'Transportation Assistance', mandatory: true, max: '$150/participant/month',
      policy: 'IndyGo bus passes, mileage reimbursement at current IRS standard rate, and rideshare coordination (Lyft/Uber) provided to all participants requiring transportation to attend training, job search, or employment. Required for all mandatory E&T participants.',
      providers: `${PLATFORM_DEFAULTS.orgName} (direct); IndyGo (bus passes); Lyft/Uber (rideshare coordination)` },
    { name: 'Work Clothing / Uniforms', mandatory: false, max: '$200/participant (one-time)',
      policy: 'Scrubs, safety gear, steel-toed boots, hard hats, high-visibility vests, and professional attire required for program completion. Items must be required by the program or employer and not available through other means.',
      providers: `${PLATFORM_DEFAULTS.orgName} (direct purchase or reimbursement)` },
    { name: 'Credential Testing Fees', mandatory: false, max: '$250/participant (one-time)',
      policy: 'Exam registration, proctoring, and certification fees covered for all required credential exams: Indiana ISDH CNA, EPA Section 608, CompTIA A+, CDL skills test, Indiana DMHA CPRS, NACPB Bookkeeping, QuickBooks ProAdvisor, NHA exams, PTCB CPhT, and all Certiport exams.',
      providers: 'Elevate for Humanity (direct payment to testing agencies); Alberta Davis (on-site proctor)' },
    { name: 'Childcare Referrals & Assistance', mandatory: true, max: '$500/participant/month',
      policy: 'Licensed childcare provider referrals and CCDF subsidy navigation for all participants with dependent children. When providers have a waiting list, participants are temporarily exempted from mandatory E&T per 7 CFR 273.7(d)(4). Elevate coordinates with WorkOne Indy and EmployIndy to identify alternative providers.',
      providers: 'CCDF-eligible licensed childcare providers; WorkOne Indy; EmployIndy; Indiana FSSA CCDF office' },
    { name: 'Tools / Equipment', mandatory: false, max: '$300/participant (one-time)',
      policy: 'Program-required tools, kits, and equipment for hands-on training. Includes HVAC tool kits, CNA clinical supply kits, IT lab equipment, barber/cosmetology starter kits, and nail technician kits. Loaned equipment returned upon completion or withdrawal.',
      providers: 'Elevate for Humanity (direct provision or loan); Textures Institute of Cosmetology (beauty kits)' },
    { name: 'Housing Referrals', mandatory: false, max: 'Referral only',
      policy: 'Participants experiencing housing instability connected to emergency housing, transitional housing, and rental assistance. Housing instability documented as a barrier in the Individual Employment Plan.',
      providers: 'Horizon House; Salvation Army; Indianapolis Housing Agency; CHIP; Indy Renter Assistance' },
    { name: 'Mental Health & Disability Referrals', mandatory: false, max: 'Referral only',
      policy: 'Licensed counselor referrals, crisis support, disability accommodation assessment, and co-occurring disorder screening. ADA and Section 504 accommodations provided for all participants with documented disabilities.',
      providers: 'Eskenazi Health; Midtown Community Mental Health; CHIP; Indiana Vocational Rehabilitation' },
    { name: 'Substance Abuse Referrals', mandatory: false, max: 'Referral only',
      policy: 'Recovery support services and treatment program coordination for participants with substance use disorders. Referrals made to licensed treatment providers. Participants in active recovery are not excluded from E&T participation — accommodations made per Individual Employment Plan. Peer Recovery Specialist program participants may serve as peer navigators for others in recovery.',
      providers: 'Eskenazi Health Addiction Medicine; Fairbanks Hospital; Indiana Recovery Alliance; DMHA-certified treatment providers; Peer Recovery Specialist network' },
  ];

  for (const svc of svcs) {
    cy(55); box(ML, y - 2, CW, 16, NBGD);
    t(svc.name, ML + 6, y + 6, bold, 9, NAVY);
    if (svc.mandatory) { box(W - MR - 82, y - 1, 76, 14, GBGD); t('MANDATORY', W - MR - 78, y + 5, bold, 7, GREEN); }
    y -= 20;
    t('Policy:', ML, y, bold, 7.5, GRAY); y -= 11;
    para(svc.policy, 6, 8.5);
    t('Maximum Reimbursement:', ML, y, bold, 7.5, GRAY);
    t(svc.max, ML + 145, y, bold, 8.5, BLACK); y -= LH;
    t('Service Providers:', ML, y, bold, 7.5, GRAY);
    const pl = wrap(svc.providers, CW - 145, reg, 8);
    pl.forEach((l, i) => t(l, ML + 145, y - i * LH, reg, 8, DGRAY));
    y -= pl.length * LH + 8;
    hr(y, 0.5, RULE); y -= 10;
  }
  y -= 8;

  // ══════════════════════════════════════════════════════════════════
  // SECTION 6 — ALL PARTNERS & VENDORS
  // ══════════════════════════════════════════════════════════════════
  secHdr('6', 'All Partners & Vendors');
  para('All partners are listed with their type, location, programs supported, job types available, and relationship status. Vendors are listed with service type and monthly/annual cost.');
  y -= 4;

  subHdr('Workforce & Government Partners');
  const govPartners = [
    { name: 'EmployIndy (Indianapolis Workforce Development Board)', type: 'Workforce Board', loc: 'Indianapolis, IN', role: 'Contract oversight, performance monitoring, employer connections, WIOA funding coordination. Primary funder for RFP 2026-003 WIOA In-School Youth contract.', jobs: 'All program areas', status: 'Active Partner' },
    { name: 'WorkOne Indianapolis', type: 'American Job Center', loc: 'Indianapolis, IN', role: 'Participant referrals, co-enrollment in WIOA, Individual Employment Plan coordination, supportive services coordination, labor market information.', jobs: 'All program areas', status: 'Active Partner' },
    { name: 'Indiana FSSA — Division of Family Resources', type: 'State Agency', loc: 'Indianapolis, IN', role: 'SNAP E&T Third Party Provider contract. Participant referrals, reimbursement processing, compliance oversight.', jobs: 'All SNAP E&T eligible programs', status: 'TPP Application Submitted' },
    { name: 'Indiana Department of Workforce Development (DWD)', type: 'State Agency', loc: 'Indianapolis, IN', role: 'ETPL listing, Workforce Ready Grant (WRG) funding, apprenticeship registration oversight, labor market data.', jobs: 'All ETPL-listed programs', status: 'Active — ETPL Listed' },
    { name: 'U.S. Department of Labor — Office of Apprenticeship', type: 'Federal Agency', loc: 'Chicago Region', role: 'DOL Registered Apprenticeship Sponsor oversight. RAPIDS #2025-IN-132301. Programs: Barber, Cosmetology, Nail Technician, Culinary.', jobs: 'Apprenticeship programs', status: 'Active — RAPIDS Registered' },
    { name: 'Job Ready Indy (JRI)', type: 'City Initiative', loc: 'Indianapolis, IN', role: 'City of Indianapolis workforce development initiative. Participant referrals and funding for eligible Indianapolis residents.', jobs: 'All JRI-approved programs', status: 'Active Partner' },
    { name: 'Warren Central High School', type: 'School Partner', loc: 'Indianapolis, IN', role: 'WIOA In-School Youth program host. Masimba Taylor (Principal), Nicole Simpson (Intervention Specialist). Elevate delivers career coaching and credential training on-site.', jobs: 'HVAC, IT, Healthcare, Trades', status: 'Active — MOU Signed' },
    { name: '2Exclusive Platinum Cleaning', type: 'OJT Employer', loc: 'Indianapolis, IN', role: 'OJT host employer, DOL Provider ID 206251. Provides on-the-job training placements, hiring, mentoring, and on-site supervision for WIOA participants.', jobs: 'Janitorial, Facilities, Trades', status: 'Active — DOL Provider' },
  ];

  for (const p of govPartners) {
    cy(50); box(ML, y - 2, CW, 14, NBGD);
    t(p.name, ML + 4, y + 4, bold, 8.5, NAVY);
    box(W - MR - 120, y - 1, 114, 12, p.status.includes('Active') ? GBGD : ROWALT);
    t(p.status, W - MR - 116, y + 3, bold, 6.5, p.status.includes('Active') ? GREEN : GRAY);
    y -= 16;
    const dets: [string, string][] = [['Type:', p.type], ['Location:', p.loc], ['Jobs Supported:', p.jobs]];
    dets.forEach(([l, v]) => { cy(12); t(l, ML + 4, y, bold, 7.5, GRAY); t(v, ML + 90, y, reg, 8, BLACK); y -= LH; });
    t('Role:', ML + 4, y, bold, 7.5, GRAY); y -= 11;
    para(p.role, 10, 8);
    hr(y, 0.5, RULE); y -= 8;
  }
  y -= 4;

  subHdr('Program Holder Partners (MOU)');
  const progHolders = [
    { name: "Ameco's Enterprise LLC — Ameco Martin", type: 'Program Holder & Director of Information Technology', loc: '6110 W 25th St, Unit 241022, Indianapolis, IN 46224', mou: 'Pending', programs: 'IT Help Desk/CompTIA A+, Cybersecurity Analyst, Network Administration, Network Support Technician, Web Development, Software Development, Graphic Design, CAD/Drafting, Bookkeeping & QuickBooks, Tax Preparation, Office Administration, Business Administration, Entrepreneurship, Project Management, WIOA Career Coaching at Warren Central High School', jobs: 'IT Help Desk Technician, Cybersecurity Analyst, Network Administrator, Web Developer, Software Developer, Graphic Designer, CAD Drafter, Bookkeeper, Tax Preparer, Office Administrator, Business Analyst, Project Manager, Career Coach', role: 'Ameco Martin (A.S. Business, B.S. Computer Programming) serves as Director of Information Technology at Elevate, overseeing all IT and technology credential programs. Operating under Ameco\'s Enterprise LLC. Also serves as dedicated Career Coach embedded full-time at Warren Central High School under Elevate\'s WIOA In-School Youth contract with EmployIndy.' },
    { name: 'Center of Destiny', type: 'Program Holder / Community Org', loc: 'Indianapolis, IN', mou: 'Signed', programs: 'Multiple Credential Programs, Peer Recovery Specialist, Reentry Services', jobs: 'Peer Recovery Specialist, Case Manager, Community Health Worker', role: 'Community-based organization providing participant outreach, referral services, and training site support. Serves as a community anchor for Elevate\'s SNAP E&T participant pipeline in Marion County.' },
    { name: 'First Class Training Center', type: 'Program Holder / HVAC Curriculum', loc: 'Philadelphia, PA', mou: 'Signed', programs: 'HVAC Technician (EPA 608 Certification)', jobs: 'HVAC Installer, HVAC Service Technician, HVAC Lead Technician, Refrigeration Mechanic', role: 'Provides HVAC curriculum, instructor expertise, and program content for Elevate\'s EPA 608 credential program. Curriculum delivered via Elevate\'s LMS with First Class Training Center instructional support.' },
    { name: 'LoopRoots Foundation', type: 'Program Holder / Nonprofit', loc: 'Indianapolis, IN', mou: 'Signed', programs: 'Multiple Credential Programs, Bookkeeping & QuickBooks, Reentry Services', jobs: 'Bookkeeper, Administrative Assistant, Workforce Development Specialist', role: 'Nonprofit workforce development organization providing participant outreach, case management support, and training site access. Serves populations with multiple barriers including justice involvement and housing instability.' },
    { name: 'Doreen Hawkins', type: 'Program Holder / Independent Contractor', loc: 'Indianapolis, IN', mou: 'Signed', programs: 'Multiple Credential Programs, Workforce Coaching', jobs: 'Workforce Development Specialist, Career Coach, Program Instructor', role: 'Independent workforce development contractor providing instructional support, participant coaching, and program delivery assistance across multiple Elevate credential programs.' },
    { name: 'Textures Institute of Cosmetology', type: 'Program Holder / Beauty School', loc: 'Indianapolis, IN', mou: 'Active', programs: 'Nail Technician Apprenticeship, Cosmetology Apprenticeship, Esthetician', jobs: 'Nail Technician, Nail Instructor, Cosmetologist, Esthetician, Salon Manager, Salon Owner', role: 'Licensed cosmetology school and apprenticeship training site. Jozanna George (Director of Enrollment & Beauty Industry Programs) oversees the nail program at Textures Institute and manages enrollment operations for Elevate. Provides supervised training hours for Indiana IPLA licensing.' },
    { name: 'Mesmerized by Beauty Cosmetology Academy', type: 'Program Holder / Beauty School', loc: 'Indianapolis, IN', mou: 'Pending', programs: 'Cosmetology Apprenticeship (Indiana IPLA License)', jobs: 'Licensed Cosmetologist, Hair Colorist, Salon Manager, Salon Owner', role: 'Licensed cosmetology school providing apprenticeship training site and licensed instructor supervision. Participants complete 2,000 hours of supervised instruction. Potential direct hire of completers.' },
    { name: 'Better Days at Better Life Home Care', type: 'Program Holder / Healthcare', loc: 'Indianapolis, IN', mou: 'Pending', programs: 'CNA / Healthcare, Peer Recovery Specialist', jobs: 'CNA, Home Health Aide, Peer Recovery Specialist, Patient Care Technician', role: 'Licensed home care agency providing clinical practicum sites for CNA training and employment placement. Provides supervised clinical hours required for Indiana ISDH CNA certification.' },
    { name: 'Kountry Kutz Barbershop', type: 'Program Holder / Barbershop', loc: 'New Palestine, IN', mou: 'Pending', programs: 'Barber Apprenticeship (Indiana IPLA License)', jobs: 'Licensed Barber, Master Barber, Barbershop Manager, Barbershop Owner', role: 'Licensed barbershop providing apprenticeship training site and licensed barber supervisor. Participants complete 2,000 hours of supervised instruction and earn wages during training.' },
  ];

  for (const p of progHolders) {
    cy(55); box(ML, y - 2, CW, 14, NBGD);
    t(p.name, ML + 4, y + 4, bold, 8.5, NAVY);
    const statusColor = p.mou === 'Signed' || p.mou === 'Active' ? GREEN : GRAY;
    const statusBg = p.mou === 'Signed' || p.mou === 'Active' ? GBGD : ROWALT;
    box(W - MR - 90, y - 1, 84, 12, statusBg);
    t(`MOU: ${p.mou}`, W - MR - 86, y + 3, bold, 7, statusColor);
    y -= 16;
    [['Type:', p.type], ['Location:', p.loc], ['Programs:', p.programs], ['Jobs Available:', p.jobs]].forEach(([l, v]) => {
      cy(12); t(l, ML + 4, y, bold, 7.5, GRAY);
      const vl = wrap(v, CW - 90, reg, 7.5);
      vl.forEach((vline, vi) => t(vline, ML + 90, y - vi * LH, reg, 7.5, BLACK));
      y -= Math.max(LH, vl.length * LH);
    });
    t('Role:', ML + 4, y, bold, 7.5, GRAY); y -= 11;
    para(p.role, 10, 8);
    hr(y, 0.5, RULE); y -= 8;
  }

  subHdr('Employer Partners (Hiring Pipeline)');
  const employers = [
    { name: 'Guiding Angels Care', type: 'Home Care Agency', loc: 'Indianapolis, IN', mou: 'Outreach Sent', programs: 'CNA, Peer Recovery Specialist', jobs: 'CNA, Home Health Aide, Peer Recovery Specialist, Patient Care Technician', hiring: 'Priority hiring commitment for CNA and Peer Recovery Specialist completers. Active hiring needs.' },
    { name: 'Harmony Heights Care', type: 'Assisted Living / Healthcare', loc: 'Indianapolis, IN', mou: 'Outreach Sent', programs: 'CNA, Peer Recovery Specialist', jobs: 'CNA, Behavioral Health Support Staff, Peer Recovery Specialist, Resident Care Aide', hiring: 'Ongoing hiring needs for CNAs and behavioral health support staff. Direct employment pipeline.' },
    { name: 'Cradle to Crayons Academy', type: 'Childcare / Early Education', loc: 'Indianapolis, IN', mou: 'Outreach Sent', programs: 'CNA, Peer Recovery Specialist, IT Help Desk', jobs: 'Childcare Worker, Early Education Teacher Aide, IT Support, Behavioral Health Support', hiring: 'Multi-program hiring commitment across CNA, Peer Recovery Specialist, and IT Help Desk areas.' },
    { name: 'Driver Solutions', type: 'CDL Staffing & Placement', loc: 'Indianapolis, IN', mou: 'Active Referral Agreement', programs: 'CDL Class A, CDL Class B', jobs: 'OTR Truck Driver, Regional Driver, Local Delivery Driver, Bus Driver, Owner-Operator', hiring: 'Active placement pipeline. Average time-to-placement under 30 days for CDL completers. Connects graduates with regional and national carriers.' },
  ];

  for (const e of employers) {
    cy(45); box(ML, y - 2, CW, 14, NBGD);
    t(e.name, ML + 4, y + 4, bold, 8.5, NAVY);
    box(W - MR - 130, y - 1, 124, 12, ROWALT);
    t(e.mou, W - MR - 126, y + 3, bold, 6.5, GRAY);
    y -= 16;
    [['Type:', e.type], ['Location:', e.loc], ['Programs:', e.programs], ['Jobs Available:', e.jobs]].forEach(([l, v]) => {
      cy(12); t(l, ML + 4, y, bold, 7.5, GRAY);
      const vl = wrap(v, CW - 90, reg, 7.5);
      vl.forEach((vline, vi) => t(vline, ML + 90, y - vi * LH, reg, 7.5, BLACK));
      y -= Math.max(LH, vl.length * LH);
    });
    t('Hiring Commitment:', ML + 4, y, bold, 7.5, GRAY); y -= 11;
    para(e.hiring, 10, 8);
    hr(y, 0.5, RULE); y -= 8;
  }
  y -= 8;

  // ══════════════════════════════════════════════════════════════════
  // SECTION 7 — FULL STAFF & ORGANIZATIONAL CHART
  // ══════════════════════════════════════════════════════════════════
  secHdr('7', 'Full Staff & Organizational Chart');
  para('Current staff are listed first, followed by all positions needed to fully operate the facility. Salaries reflect Indianapolis-Carmel-Anderson MSA market rates (BLS OES May 2024). Benefits estimated at 22% of base salary (health insurance, dental, vision, FICA, unemployment, workers comp).');
  y -= 4;

  subHdr('Current Staff — Active Team Members');

  const currentStaff = [
    {
      name: 'Elizabeth Greene',
      title: 'Founder & Chief Executive Officer',
      salary: '$110,000',
      benefits: '$16,500',
      total: '$126,500',
      fte: '1.0',
      bio: 'U.S. Army Veteran (Unit Supply Specialist). IRS Enrolled Agent (EA), EFIN and PTIN holder. Licensed Barber. Indiana Substitute Teacher. EPA 608 Certified Proctor. SAM.gov Registered Federal Government Contractor (CAGE: 0Q856). ByBlack Certified. DOL Registered Apprenticeship Sponsor. ETPL Provider. WIOA/WRG/JRI Approved. WorkOne Partner. EmployIndy Partner. Job Ready Indy Partner. HSI Affiliate. CareerSafe OSHA Provider. Milady Partner. NRF Rise Up Provider. Certiport CATC. Also operates Selfish Inc., a 501(c)(3) nonprofit providing VITA free tax preparation and community services.',
      responsibilities: 'Overall organizational leadership, FSSA/WIOA/EmployIndy relationship management, program strategy, compliance oversight, authorized representative for all state and federal contracts, SNAP E&T case management, participant enrollment documentation, Indiana Career Connect data entry, supportive services disbursement, quarterly performance reporting.',
    },
    {
      name: 'Jozanna George',
      title: 'Director of Enrollment & Beauty Industry Programs',
      salary: '$68,000',
      benefits: '$10,200',
      total: '$78,200',
      fte: '1.0',
      bio: `Multi-licensed beauty professional holding Indiana Nail Technician License, Nail Instructor License, and Esthetician License. Oversees the nail program at Textures Institute of Cosmetology. Manages enrollment operations for ${PLATFORM_DEFAULTS.orgName}.`,
      responsibilities: 'Manages all student enrollment processes, admissions intake, and enrollment documentation. Oversees all beauty industry programs: Cosmetology Apprenticeship, Nail Technician Apprenticeship, Esthetician, Barber Apprenticeship, and Beauty Career Educator. Coordinates with Textures Institute of Cosmetology and all beauty program holder partners. Manages Milady curriculum delivery and licensing exam preparation.',
    },
    {
      name: 'Dr. Carlina Wilkes',
      title: 'Executive Director of Financial Operations & Compliance',
      salary: '$95,000',
      benefits: '$14,250',
      total: '$109,250',
      fte: '1.0',
      bio: '24+ years of federal experience with the Defense Finance and Accounting Service (DFAS). Holds DoD Financial Management Certification Level II.',
      responsibilities: 'Oversees all financial operations, grant financial management, audit preparation, budget development and monitoring, accounts payable/receivable, payroll processing, organizational compliance, federal and state reporting, cost allocation plan maintenance, and FSSA/WIOA financial compliance.',
    },
    {
      name: 'Leslie Wafford',
      title: 'Director of Community Services',
      salary: '$62,000',
      benefits: '$9,300',
      total: '$71,300',
      fte: '1.0',
      bio: 'Community services professional specializing in low-barrier housing access and eviction prevention. Advocates for families navigating housing challenges with a "reach one, teach one" philosophy.',
      responsibilities: 'Manages all community services and wraparound support for participants. Coordinates housing referrals, eviction prevention services, emergency assistance connections, and community partner relationships. Manages referral network with Horizon House, Salvation Army, Indianapolis Housing Agency, and CHIP. Conducts barrier assessments and develops Individual Employment Plans.',
    },
    {
      name: 'Delores Reynolds',
      title: 'Social Media & Digital Engagement Coordinator',
      salary: '$52,000',
      benefits: '$7,800',
      total: '$59,800',
      fte: '1.0',
      bio: 'Digital communications professional managing Elevate\'s social media presence and digital outreach.',
      responsibilities: 'Manages all social media platforms (Facebook, Instagram, LinkedIn, YouTube), digital marketing campaigns, student success story content, program promotion, email marketing (Mailchimp), and digital outreach to reach prospective participants. Manages Elevate\'s online presence and brand communications.',
    },
    {
      name: 'Clystjah Woodley',
      title: 'Program Coordinator',
      salary: '$52,000',
      benefits: '$7,800',
      total: '$59,800',
      fte: '1.0',
      bio: 'Program operations professional supporting student services and enrollment navigation.',
      responsibilities: 'Supports program operations and student services. Helps participants navigate enrollment, stay on track through training programs, coordinates scheduling, manages participant files, assists with data entry and reporting, and provides administrative support to program directors.',
    },
    {
      name: 'Alberta Davis',
      title: 'Testing Center Coordinator & Exam Proctor',
      salary: '$46,000',
      benefits: '$6,900',
      total: '$52,900',
      fte: '1.0',
      bio: 'Certified exam proctor and testing center coordinator at Elevate\'s Workforce Credential Testing Center.',
      responsibilities: 'Coordinates all testing appointments and testing center operations. Prepares testing stations and ensures exam security compliance. Proctors in-person and live testing sessions for Certiport, EPA 608, NHA, CompTIA, and all other credential exams. Assists candidates through check-in and identity verification. Coordinates on-site testing events for partner organizations and workforce programs.',
    },
    {
      name: 'Naomi Jordan',
      title: 'Director of Healthcare Administration',
      salary: '$90,000',
      benefits: '$13,500',
      total: '$103,500',
      fte: '1.0',
      bio: 'Owner of Rebuilds Mind and Body Studio LLC, 6331 N Keystone Ave, Indianapolis, IN 46220. Holds active Indiana credentials: CNA, HHA, Phlebotomy Technician, and QMA (Qualified Medication Aide).',
      responsibilities: 'Oversees all healthcare program administration, clinical coordination, curriculum compliance, and healthcare employer relationships. Provides clinical instruction and supervision for CNA, HHA, Phlebotomy, and QMA programs in compliance with Indiana ISDH requirements. Coordinates clinical practicum placements for Medical Assistant, Pharmacy Technician, and Peer Recovery Specialist programs. Manages healthcare partner relationships including Guiding Angels Care, Harmony Heights Care, Better Days at Better Life Home Care, and Cradle to Crayons Academy.',
    },
    {
      name: 'Ameco Martin',
      title: 'Director of Information Technology',
      salary: '$82,000',
      benefits: '$12,300',
      total: '$94,300',
      fte: '1.0',
      bio: 'Owner of Ameco\'s Enterprise LLC, 6110 W 25th St, Unit 241022, Indianapolis, IN 46224. Holds A.S. in Business and B.S. in Computer Programming. Also serves as dedicated Career Coach at Warren Central High School under Elevate\'s WIOA contract.',
      responsibilities: 'Directs all IT and technology credential programs: IT Help Desk/CompTIA A+, Cybersecurity Analyst, Network Administration, Network Support Technician, Web Development, Software Development, Graphic Design, CAD/Drafting, Bookkeeping & QuickBooks, Tax Preparation, Office Administration, Business Administration, Entrepreneurship, and Project Management. Operating under Ameco\'s Enterprise LLC. At Warren Central: in-person career coaching, WIOA eligibility screening, ISS development, Indiana Career Connect data entry, employer coordination, work-based learning placement, monthly participant check-ins, and EmployIndy coordination meetings.',
    },
    {
      name: 'SNAP E&T Case Manager',
      title: 'Dedicated Case Manager — 150-Participant Caseload',
      salary: '$52,000',
      benefits: '$7,800',
      total: '$59,800',
      fte: '1.0',
      bio: 'Dedicated full-time case manager assigned exclusively to the SNAP E&T program. Required position for a 150-participant annual caseload per FSSA program standards.',
      responsibilities: 'Conducts initial SNAP E&T eligibility assessments, develops Individual Employment Plans (IEPs), tracks participant progress through training milestones, documents supportive services disbursements, enters data into Indiana Career Connect, coordinates with WorkOne and EmployIndy case managers, and prepares quarterly participant outcome reports for FSSA.',
    },
  ];

  // Column headers
  cy(16); box(ML, y - 3, CW, 14, NAVY);
  t('Name', ML + 4, y + 3, bold, 7.5, HTXT);
  t('Title', ML + 120, y + 3, bold, 7.5, HTXT);
  t('FTE', ML + 310, y + 3, bold, 7.5, HTXT);
  t('Base Salary', ML + 340, y + 3, bold, 7.5, HTXT);
  t('Benefits', ML + 410, y + 3, bold, 7.5, HTXT);
  t('Total Cost', ML + 460, y + 3, bold, 7.5, HTXT);
  y -= 16;

  let totalCurrentSalary = 0;
  let totalCurrentBenefits = 0;
  let totalCurrentTotal = 0;

  currentStaff.forEach((s, i) => {
    const sal = parseFloat(s.salary.replace(/[$,]/g, ''));
    const ben = parseFloat(s.benefits.replace(/[$,]/g, ''));
    const tot = parseFloat(s.total.replace(/[$,]/g, ''));
    totalCurrentSalary += sal; totalCurrentBenefits += ben; totalCurrentTotal += tot;
    cy(14); box(ML, y - 2, CW, 13, i % 2 === 0 ? ROWALT : WHITE);
    t(s.name, ML + 4, y + 3, bold, 7.5, BLACK);
    const tlines = wrap(s.title, 180, reg, 7);
    tlines.forEach((tl, ti) => t(tl, ML + 120, y + 3 - ti * 9, reg, 7, DGRAY));
    t(s.fte, ML + 310, y + 3, reg, 7.5, BLACK);
    t(s.salary, ML + 340, y + 3, reg, 7.5, BLACK);
    t(s.benefits, ML + 410, y + 3, reg, 7.5, BLACK);
    t(s.total, ML + 460, y + 3, bold, 7.5, BLACK);
    y -= Math.max(13, tlines.length * 9 + 4);
    hr(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  });

  // Current staff subtotal
  cy(16); box(ML, y - 3, CW, 14, NBGD);
  t('Current Staff Subtotal', ML + 4, y + 3, bold, 8, NAVY);
  t(money(totalCurrentSalary), ML + 340, y + 3, bold, 8, NAVY);
  t(money(totalCurrentBenefits), ML + 410, y + 3, bold, 8, NAVY);
  t(money(totalCurrentTotal), ML + 460, y + 3, bold, 8, NAVY);
  y -= 20;

  // ── Positions Needed ──────────────────────────────────────────────
  subHdr('Positions Needed — Full Operational Staffing Plan');
  para('The following positions are required to fully operate the facility at capacity. Salaries reflect Indianapolis market rates (BLS OES May 2024). These positions are included in the budget as planned hires.');
  y -= 4;

  const neededStaff = [
    { title: 'Director of Operations',              fte: '1.0', salary: '$78,000',  benefits: '$17,160', total: '$95,160',  rationale: 'Oversees day-to-day facility operations, staff supervision, vendor management, scheduling, and operational compliance. Required to free CEO for strategic and compliance functions.' },
    { title: 'Director of Admissions',              fte: '1.0', salary: '$68,000',  benefits: '$14,960', total: '$82,960',  rationale: 'Manages full admissions pipeline: inquiry, eligibility screening, enrollment documentation, WIOA/SNAP intake, funding verification, and onboarding. Required as enrollment volume grows.' },
    { title: 'Human Resources Manager',             fte: '1.0', salary: '$72,000',  benefits: '$15,840', total: '$87,840',  rationale: 'Manages hiring, onboarding, employee relations, benefits administration, payroll coordination, HR compliance, and staff development. Required at full staffing level.' },
    { title: 'Marketing Director',                  fte: '1.0', salary: '$72,000',  benefits: '$15,840', total: '$87,840',  rationale: 'Leads all marketing strategy, digital advertising, community outreach, brand management, and participant recruitment campaigns. Required to scale enrollment.' },
    { title: 'SNAP E&T Case Manager',               fte: '1.0', salary: '$52,000',  benefits: '$11,440', total: '$63,440',  rationale: 'Dedicated SNAP E&T case manager for participant intake, barrier assessment, Individual Employment Plan development, supportive services coordination, and FSSA reporting.' },
    { title: 'WIOA Case Manager',                   fte: '1.0', salary: '$52,000',  benefits: '$11,440', total: '$63,440',  rationale: 'Dedicated WIOA case manager for participant enrollment, Indiana Career Connect data entry, follow-up at 30/90/180/365 days, and EmployIndy reporting.' },
    { title: 'Healthcare Program Instructor (CNA)', fte: '1.0', salary: '$58,000',  benefits: '$12,760', total: '$70,760',  rationale: 'Licensed CNA instructor delivering CNA, Medical Assistant, Phlebotomy, and Home Health Aide curriculum. Required for ISDH-compliant clinical instruction.' },
    { title: 'Trades Instructor (HVAC / CDL)',      fte: '1.0', salary: '$65,000',  benefits: '$14,300', total: '$79,300',  rationale: 'EPA 608 certified HVAC instructor and CDL-licensed trades instructor. Delivers HVAC, CDL, Welding, Forklift, and Construction Trades programs.' },
    { title: 'IT / Technology Instructor',          fte: '1.0', salary: '$62,000',  benefits: '$13,640', total: '$75,640',  rationale: 'CompTIA-certified IT instructor delivering IT Help Desk, Cybersecurity, Network Administration, Web Development, and Software Development programs.' },
    { title: 'Business & Finance Instructor',       fte: '1.0', salary: '$58,000',  benefits: '$12,760', total: '$70,760',  rationale: 'Delivers Bookkeeping, Tax Preparation, Office Administration, Business Administration, Entrepreneurship, and Project Management programs.' },
    { title: 'Administrative Assistant',            fte: '1.0', salary: '$42,000',  benefits: '$9,240',  total: '$51,240',  rationale: 'Front desk, phone, scheduling, participant check-in, file management, supply ordering, and general administrative support.' },
    { title: 'Office Manager',                      fte: '1.0', salary: '$52,000',  benefits: '$11,440', total: '$63,440',  rationale: 'Manages office operations, vendor relationships, facility maintenance coordination, supply chain, and administrative staff supervision.' },
    { title: 'Data & Reporting Coordinator',        fte: '1.0', salary: '$48,000',  benefits: '$10,560', total: '$58,560',  rationale: 'Manages all program data entry, performance reporting, Indiana Career Connect, FSSA reporting, EmployIndy reporting, and grant compliance documentation.' },
    { title: 'Job Placement Specialist',            fte: '1.0', salary: '$52,000',  benefits: '$11,440', total: '$63,440',  rationale: 'Manages employer relationships, job placement activities, mock interviews, resume workshops, job fairs, and 90-day post-placement follow-up.' },
    { title: 'Peer Navigator / Student Success Coach', fte: '2.0', salary: '$40,000', benefits: '$8,800', total: '$97,600', rationale: '2 FTE. Peer navigators with lived experience supporting participants through barriers, attendance, motivation, and program completion. Critical for SNAP E&T retention.' },
  ];

  cy(16); box(ML, y - 3, CW, 14, NAVY);
  t('Position', ML + 4, y + 3, bold, 7.5, HTXT);
  t('FTE', ML + 280, y + 3, bold, 7.5, HTXT);
  t('Base Salary', ML + 310, y + 3, bold, 7.5, HTXT);
  t('Benefits', ML + 380, y + 3, bold, 7.5, HTXT);
  t('Total Cost', ML + 440, y + 3, bold, 7.5, HTXT);
  y -= 16;

  let totalNeededSalary = 0, totalNeededBenefits = 0, totalNeededTotal = 0;

  neededStaff.forEach((s, i) => {
    const sal = parseFloat(s.salary.replace(/[$,]/g, ''));
    const ben = parseFloat(s.benefits.replace(/[$,]/g, ''));
    const tot = parseFloat(s.total.replace(/[$,]/g, ''));
    totalNeededSalary += sal; totalNeededBenefits += ben; totalNeededTotal += tot;
    const rlines = wrap(s.rationale, CW - 200, reg, 7);
    const rowH = Math.max(13, rlines.length * 9 + 4);
    cy(rowH + 4); box(ML, y - 2, CW, rowH, i % 2 === 0 ? ROWALT : WHITE);
    t(s.title, ML + 4, y + rowH - 10, bold, 7.5, BLACK);
    rlines.forEach((rl, ri) => t(rl, ML + 4, y + rowH - 22 - ri * 9, reg, 6.5, GRAY));
    t(s.fte, ML + 280, y + rowH - 10, reg, 7.5, BLACK);
    t(s.salary, ML + 310, y + rowH - 10, reg, 7.5, BLACK);
    t(s.benefits, ML + 380, y + rowH - 10, reg, 7.5, BLACK);
    t(s.total, ML + 440, y + rowH - 10, bold, 7.5, BLACK);
    y -= rowH + 2; hr(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  });

  cy(16); box(ML, y - 3, CW, 14, NBGD);
  t('Needed Positions Subtotal', ML + 4, y + 3, bold, 8, NAVY);
  t(money(totalNeededSalary), ML + 310, y + 3, bold, 8, NAVY);
  t(money(totalNeededBenefits), ML + 380, y + 3, bold, 8, NAVY);
  t(money(totalNeededTotal), ML + 440, y + 3, bold, 8, NAVY);
  y -= 20;

  const grandStaffTotal = totalCurrentTotal + totalNeededTotal;
  cy(18); box(ML, y - 4, CW, 18, NAVY);
  t('TOTAL ANNUAL PERSONNEL COST (Current + Needed)', ML + 4, y + 6, bold, 9, HTXT);
  t(money(grandStaffTotal), ML + 440, y + 6, bold, 9, rgb(0.85, 0.95, 1));
  y -= 26;
  y -= 8;

  // ══════════════════════════════════════════════════════════════════
  // SECTION 8 — COMPLIANCE & REGULATORY STANDING
  // ══════════════════════════════════════════════════════════════════
  secHdr('8', 'Compliance & Regulatory Standing');

  const compItems = [
    ['Indiana ETPL Listing',                  'Active. Eligible Training Provider List — eligible for WIOA Title I and SNAP E&T reimbursement across all listed programs.'],
    ['DOL Registered Apprenticeship Sponsor', 'Active. RAPIDS #2025-IN-132301 · Provider ID 206251. Active programs: Barber, Cosmetology, Nail Technician, Culinary.'],
    ['SAM.gov Registration',                  'Active. UEI: VX2GK5S8SZH8 · CAGE: 0Q856. Eligible for federal and state contract awards.'],
    ['Certiport CATC',                        'Active. Authorized Testing Center — Microsoft, CompTIA, Adobe, IC3, QuickBooks, NRF Rise Up exams administered on-site.'],
    ['CareerSafe OSHA Provider',              'Active. Authorized to deliver OSHA 10 and OSHA 30 and issue OSHA cards.'],
    ['NRF Rise Up Provider',                  'Active. Authorized to deliver and certify Retail Industry Fundamentals, Customer Service & Sales, and Advanced Customer Service & Sales.'],
    ['Milady Partner',                        'Active. Authorized Milady curriculum partner for Cosmetology, Esthetics, Barbering, and Nail Technology.'],
    ['ByBlack Certified',                     'Active. Verified Black-owned business — ByBlack national registry.'],

    ['WIOA / WRG / JRI Approved',             'Active. Approved provider under Workforce Innovation and Opportunity Act, Workforce Ready Grant, and Job Readiness Initiative.'],
    ['WorkOne Partner',                       'Active. Indiana WorkOne system — participant referrals and co-enrollment coordination.'],
    ['EmployIndy Partner',                    'Active. Indianapolis Workforce Development Board — WIOA contract holder (RFP 2026-003).'],
    ['Job Ready Indy Partner',                'Active. City of Indianapolis workforce initiative.'],
    ['HSI Affiliate',                         'Active. Hispanic-Serving Institution affiliate — expanded outreach to LEP and Hispanic communities.'],
    ['General Liability Insurance',           'In force. Certificate of insurance available upon request.'],
    ['Background Check Policy',               'All staff working directly with participants are subject to criminal background checks prior to hire and annually thereafter.'],
    ['FERPA / Data Privacy Policy',           'Written FERPA-compliant data privacy policy in place. All participant data handled per FSSA data sharing requirements.'],
    ['HIPAA Compliance',                      'Healthcare program staff trained on HIPAA privacy and security requirements. Policies in place for all clinical program components.'],
    ['Non-Discrimination Policy',             'Elevate does not discriminate on the basis of race, color, national origin, sex, disability, age, religion, or any other protected class.'],
    ['ADA / Section 504',                     'Reasonable accommodations provided to participants with disabilities. Accommodation requests handled by program director.'],
    ['EPA 608 Certified Proctor',             'Elizabeth Greene is a certified EPA 608 exam proctor. Exams administered on-site at Elevate\'s testing center.'],
  ];

  compItems.forEach(([label, value], i) => {
    cy(16);
    box(ML, y - 3, CW, 15, i % 2 === 0 ? ROWALT : WHITE);
    t(label, ML + 4, y + 4, bold, 8, NAVY);
    const vlines = wrap(value, CW - 175, reg, 7.5);
    vlines.forEach((vl, vi) => t(vl, ML + 175, y + 4 - vi * 10, reg, 7.5, DGRAY));
    y -= Math.max(15, vlines.length * 10 + 5);
    hr(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  });
  y -= 8;

  // ══════════════════════════════════════════════════════════════════
  // SECTION 9 — FSSA SNAP E&T TPP ALLOWABLE BUDGET
  // ══════════════════════════════════════════════════════════════════
  secHdr('9', 'FSSA SNAP E&T TPP Budget — Allowable Costs (150 Participants)');
  para('This budget covers 150 SNAP E&T participants annually. All costs are allowable under 7 CFR 273.7 and the Indiana SNAP E&T State Plan. Non-allowable costs (marketing, general software, capital equipment not used for training, non-E&T overhead) are excluded. Personnel FTE allocations are based on documented time-and-effort records. No indirect cost rate is claimed — all costs are direct. Facility rent is prorated at 75% for E&T program use at Keystone Crossing offices and 100% at all dedicated training sites (Caito Dr, 6331 N Keystone Ave, 7116 N College Ave) per the organizational cost allocation plan. Fringe rate: 15% (FICA 7.65%, unemployment 1.35%, workers comp 6%).');
  y -= 4;

  // ── A. Personnel ─────────────────────────────────────────────────
  subHdr('A. Personnel — Salaries & Fringe (7 CFR 273.7)');
  para('FTE allocations are conservative and defensible by time-and-effort documentation. Staff with non-E&T duties (CEO, Finance, IT) are allocated at partial FTE only. No staff member is claimed at 100% E&T unless their role is exclusively participant-facing.', 0, 8);
  y -= 2;

  // Column layout (ML=54, CW=504, max safe x=530 for 7-char money strings at 7.5pt)
  // Name/Title: ML+4 to ML+220 | FTE: ML+222 | Full Sal: ML+262 | E&T Sal: ML+322 | Fringe: ML+392 | Total: ML+452
  cy(16); box(ML, y - 3, CW, 14, NAVY);
  t('Staff Member / Position', ML + 4,   y + 3, bold, 7.5, HTXT);
  t('FTE',                     ML + 222, y + 3, bold, 7.5, HTXT);
  t('Full Salary',             ML + 262, y + 3, bold, 7.5, HTXT);
  t('E&T Salary',              ML + 322, y + 3, bold, 7.5, HTXT);
  t('Fringe 15%',              ML + 392, y + 3, bold, 7.5, HTXT);
  t('Total',                   ML + 452, y + 3, bold, 7.5, HTXT);
  y -= 16;

  // FTE allocations reflect documented time-and-effort for 150 SNAP E&T participants.
  // Leslie and Clystjah are 100% participant-facing — fully allowable.
  // A dedicated SNAP E&T Case Manager is added as a required position for 150-participant caseload.
  // Elizabeth at 40%: authorized rep, case mgr oversight, FSSA reporting, participant enrollment.
  // Carlina at 30%: E&T financial compliance, cost allocation, FSSA financial reporting.
  // Naomi at 90%: healthcare program delivery (CNA, HHA, Phlebotomy, QMA) — 55 of 150 participants.
  // Ameco at 75%: IT program delivery (CompTIA, Cybersecurity, Web Dev) — 35 of 150 participants.
  // Jozanna at 90%: enrollment management + beauty programs — all 150 participants touch enrollment.
  // Alberta at 90%: testing center — 150 participants × multiple credential exams.
  const staffBudget: [string, string, number, number][] = [
    ['Elizabeth Greene',        'CEO / Authorized Rep / E&T Case Mgr Oversight', 110000, 0.40],
    ['Dr. Carlina Wilkes',      'Exec Dir Financial Operations — E&T Compliance',  95000, 0.30],
    ['Naomi Jordan',            'Director of Healthcare Administration',            90000, 0.90],
    ['Ameco Martin',            'Director of IT Programs',                          82000, 0.75],
    ['Jozanna George',          'Director of Enrollment & Beauty Programs',         68000, 0.90],
    ['Leslie Wafford',          'Director of Community Services',                   62000, 1.00],
    ['Clystjah Woodley',        'Program Coordinator',                              52000, 1.00],
    ['Alberta Davis',           'Testing Center Coordinator & Proctor',             46000, 0.90],
    ['Delores Reynolds',        'Social Media & Digital Outreach — E&T recruitment', 52000, 0.25],
    ['SNAP E&T Case Manager',   'Dedicated Case Manager — 150-participant caseload',52000, 1.00],
  ];

  let personnelAllowable = 0;
  let fringeAllowable = 0;
  staffBudget.forEach(([name, title, salary, fte], i) => {
    const etSalary = Math.round(salary * fte);
    const fringe   = Math.round(etSalary * 0.15);
    const total    = etSalary + fringe;
    personnelAllowable += etSalary;
    fringeAllowable    += fringe;
    cy(14); box(ML, y - 2, CW, 14, i % 2 === 0 ? ROWALT : WHITE);
    t(name, ML + 4, y + 3, bold, 7.5, BLACK);
    t(title, ML + 4, y - 5, reg, 6.5, GRAY);
    t(`${Math.round(fte * 100)}%`, ML + 222, y + 3, reg, 7.5, BLACK);
    t(money(salary), ML + 262, y + 3, reg, 7.5, DGRAY);
    t(money(etSalary), ML + 322, y + 3, reg, 7.5, BLACK);
    t(money(fringe), ML + 392, y + 3, reg, 7.5, BLACK);
    t(money(total), ML + 452, y + 3, bold, 7.5, BLACK);
    y -= 16; hr(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  });

  const personnelTotal = personnelAllowable + fringeAllowable;
  cy(14); box(ML, y - 3, CW, 13, NBGD);
  t('Personnel Subtotal', ML + 4, y + 3, bold, 8, NAVY);
  t(money(personnelAllowable), ML + 322, y + 3, bold, 8, NAVY);
  t(money(fringeAllowable), ML + 392, y + 3, bold, 8, NAVY);
  t(money(personnelTotal), ML + 452, y + 3, bold, 8, NAVY);
  y -= 20;

  // ── B. Building Space & Utilities ────────────────────────────────
  subHdr('B. Building Space & Utilities — 4 Locations');
  para('Elevate operates four facilities dedicated to E&T program delivery. Caito Dr, 6331 N Keystone Ave, and the manufacturing/trades location include utilities in rent. Keystone Crossing office space does not include utilities — internet and phone are prorated at 60% for E&T use.', 0, 8);
  y -= 2;

  cy(16); box(ML, y - 3, CW, 14, NAVY);
  t('Location / Purpose', ML + 4, y + 3, bold, 7.5, HTXT);
  t('Monthly Rent', ML + 295, y + 3, bold, 7.5, HTXT);
  t('Utilities', ML + 370, y + 3, bold, 7.5, HTXT);
  t('E&T %', ML + 420, y + 3, bold, 7.5, HTXT);
  t('E&T Annual', ML + 460, y + 3, bold, 7.5, HTXT);
  y -= 16;

  // label, address, purpose, monthly rent, utilities included, E&T rate
  const facilityItems: [string, string, string, number, boolean, number][] = [
    [
      '8888 Keystone Crossing, Suite 1300 (Office A)',
      'Indianapolis, IN 46240',
      'Administrative office — enrollment, case management, FSSA reporting',
      1700, false, 0.75,
    ],
    [
      '8888 Keystone Crossing, Suite 1300 (Office B)',
      'Indianapolis, IN 46240',
      'Administrative office — IT programs, testing coordination, staff',
      1700, false, 0.75,
    ],
    [
      '5860 Caito Dr, Building 5',
      'Indianapolis, IN — Hands-On Training Facility',
      'HVAC, electrical, plumbing, CDL prep, skilled trades — utilities included',
      2841, true, 1.00,
    ],
    [
      '6331 N Keystone Ave',
      'Indianapolis, IN 46220 — Barbering & Beauty School',
      'Cosmetology, barbering, nail tech, esthetician programs — utilities included',
      5000, true, 1.00,
    ],
    [
      '7116 N College Ave',
      'Indianapolis, IN — Manufacturing & Trades Training Site',
      'Construction trades, welding, forklift, building services — utilities included',
      1600, true, 1.00,
    ],
  ];

  // Separate utility costs for Keystone Crossing (not included in rent)
  const keystoneUtilities: [string, number, number][] = [
    ['Internet / Wi-Fi — Keystone Crossing (prorated 75% E&T)', 250, 0.75],
    ['Phone / VoIP — Keystone Crossing (prorated 75% E&T)',      85, 0.75],
    ['Printing / Copying — participant materials (prorated)',    150, 0.75],
  ];

  let facilityTotal = 0;

  facilityItems.forEach(([label, addr, purpose, monthly, utilitiesIncl, rate], i) => {
    const etMonthly = Math.round(monthly * rate);
    cy(16); box(ML, y - 2, CW, 16, i % 2 === 0 ? ROWALT : WHITE);
    t(label, ML + 4, y + 5, bold, 7.5, BLACK);
    t(addr, ML + 4, y - 3, reg, 6.5, GRAY);
    t(purpose, ML + 4, y - 11, reg, 6, DGRAY);
    t(money(monthly), ML + 295, y + 5, reg, 7.5, BLACK);
    t(utilitiesIncl ? 'Included' : 'Not incl.', ML + 370, y + 5, reg, 7, utilitiesIncl ? GREEN : GRAY);
    t(`${Math.round(rate * 100)}%`, ML + 420, y + 5, reg, 7.5, BLACK);
    t(money(etMonthly * 12), ML + 460, y + 5, bold, 7.5, BLACK);
    facilityTotal += etMonthly * 12;
    y -= 18; hr(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  });

  // Add utility costs for Keystone Crossing
  keystoneUtilities.forEach(([label, full, rate], i) => {
    const etMonthly = Math.round(full * rate);
    cy(13); box(ML, y - 2, CW, 13, i % 2 === 0 ? ROWALT : WHITE);
    t(label, ML + 4, y + 3, reg, 7.5, BLACK);
    t(money(full), ML + 295, y + 3, reg, 7.5, DGRAY);
    t('Separate', ML + 370, y + 3, reg, 7, GRAY);
    t(`${Math.round(rate * 100)}%`, ML + 420, y + 3, reg, 7.5, BLACK);
    t(money(etMonthly * 12), ML + 460, y + 3, bold, 7.5, BLACK);
    facilityTotal += etMonthly * 12;
    y -= 13; hr(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  });

  cy(14); box(ML, y - 3, CW, 13, NBGD);
  t('Building Space & Utilities Subtotal (4 Locations)', ML + 4, y + 3, bold, 8, NAVY);
  t(money(facilityTotal), ML + 460, y + 3, bold, 8, NAVY);
  y -= 20;

  // ── C. Training Materials & Participant Costs ────────────────────
  subHdr('C. Training Materials & Participant Costs (150 Participants)');
  para('All costs are per-participant and directly required to complete training. Unit costs are based on vendor quotes and ETPL-listed rates. Participant counts reflect 150 annual SNAP E&T enrollees distributed across program tracks.', 0, 8);
  y -= 2;

  cy(16); box(ML, y - 3, CW, 14, NAVY);
  t('Item', ML + 4, y + 3, bold, 7.5, HTXT);
  t('Calc Basis', ML + 270, y + 3, bold, 7.5, HTXT);
  t('Annual', ML + 460, y + 3, bold, 7.5, HTXT);
  y -= 16;

  // All math tied to 150 participants
  const progDelivery: [string, string, number][] = [
    ['Curriculum materials, textbooks, workbooks',          '$80/participant × 150',          12000],
    ['NHA exam fees (CNA, Phlebotomy, QMA) — avg $155',     '$155 × 55 healthcare participants', 8525],
    ['Certiport exam fees (CompTIA A+, IC3) — avg $200',    '$200 × 35 IT participants',       7000],
    ['EPA 608 exam fees — $20/participant',                  '$20 × 30 HVAC participants',       600],
    ['CDL road test & range fees',                          '$400 × 15 CDL participants',       6000],
    ['Milady curriculum licensing (cosmetology/barbering)', '$400/year license',                 400],
    ['CareerSafe OSHA 10 course licenses',                  '$10/participant × 150',            1500],
    ['Clinical supply kits — CNA/Phlebotomy',               '$120 × 30 participants',           3600],
    ['HVAC tool kits (loaned to participants)',              '$350 × 15 participants',           5250],
    ['IT lab consumables (cables, drives, components)',      'Lab supplies — 35 participants',   1050],
  ];

  let progTotal = 0;
  progDelivery.forEach(([label, basis, annual], i) => {
    cy(14); box(ML, y - 2, CW, 14, i % 2 === 0 ? ROWALT : WHITE);
    t(label, ML + 4, y + 3, reg, 7.5, BLACK);
    t(basis, ML + 270, y + 3, reg, 7, GRAY);
    t(money(annual), ML + 460, y + 3, bold, 7.5, BLACK);
    progTotal += annual;
    y -= 14; hr(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  });
  cy(14); box(ML, y - 3, CW, 13, NBGD);
  t('Training Materials Subtotal', ML + 4, y + 3, bold, 8, NAVY);
  t(money(progTotal), ML + 460, y + 3, bold, 8, NAVY);
  y -= 20;

  // ── D. Supportive Services (7 CFR 273.7(d)(4)) ───────────────────
  subHdr('D. Supportive Services (7 CFR 273.7(d)(4))');
  para('Supportive services are provided only when necessary to enable a participant to attend or complete an E&T component. Costs are conservative and based on actual anticipated need across 150 participants. Mandatory services (transportation, childcare) are provided to all mandatory E&T participants.', 0, 8);
  y -= 2;

  cy(16); box(ML, y - 3, CW, 14, NAVY);
  t('Service', ML + 4, y + 3, bold, 7.5, HTXT);
  t('Calculation Basis', ML + 270, y + 3, bold, 7.5, HTXT);
  t('Annual', ML + 460, y + 3, bold, 7.5, HTXT);
  y -= 16;

  // Scaled to 150 participants — mandatory services for all mandatory E&T participants
  const supportServices: [string, string, number][] = [
    ['Transportation (bus passes / mileage reimbursement)', '$75/mo × 60 participants × 12 mo',  54000],
    ['Work clothing / uniforms',                            '$200 one-time × 80 participants',    16000],
    ['Credential exam fees (supportive)',                   'Covered in Section C above',              0],
    ['Childcare coordination (referral only)',              'Staff time — covered in personnel',       0],
    ['Tools / equipment for participants',                  'Covered in Section C above',              0],
  ];

  let supportTotal = 0;
  supportServices.forEach(([svc, basis, annual], i) => {
    cy(13); box(ML, y - 2, CW, 13, i % 2 === 0 ? ROWALT : WHITE);
    t(svc, ML + 4, y + 3, reg, 7.5, BLACK);
    t(basis, ML + 270, y + 3, reg, 7, GRAY);
    t(annual > 0 ? money(annual) : '—', ML + 460, y + 3, bold, 7.5, annual > 0 ? BLACK : GRAY);
    supportTotal += annual;
    y -= 13; hr(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  });
  cy(14); box(ML, y - 3, CW, 13, NBGD);
  t('Supportive Services Subtotal', ML + 4, y + 3, bold, 8, NAVY);
  t(money(supportTotal), ML + 460, y + 3, bold, 8, NAVY);
  y -= 20;

  // ── Grand Total + Cost-Per-Participant + Match ────────────────────
  const grandTotal = personnelTotal + facilityTotal + progTotal + supportTotal;
  const costPerParticipant = Math.round(grandTotal / 150);

  // Non-federal match sources (documented)
  const matchSources: [string, number][] = [
    ['Booth Rental — Naomi Jordan / Rebuilds Mind & Body Studio ($640/mo)', 7680],
    ['Self-Pay Enrollment Revenue (est. 20% of 150 participants)',          18000],
    ['In-Kind: Volunteer instructor hours (est. 200 hrs × $25/hr)',         5000],
  ];
  const totalMatch = matchSources.reduce((s, [, v]) => s + v, 0);
  const federalShare = grandTotal - totalMatch;

  cy(14); box(ML, y - 3, CW, 13, NBGD);
  t('NON-FEDERAL MATCH — Required to claim 50% federal reimbursement', ML + 4, y + 3, bold, 8, NAVY);
  y -= 16;
  matchSources.forEach(([label, amt], i) => {
    cy(13); box(ML, y - 2, CW, 13, i % 2 === 0 ? ROWALT : WHITE);
    t(label, ML + 4, y + 3, reg, 7.5, BLACK);
    t(money(amt), ML + 460, y + 3, bold, 7.5, GREEN);
    y -= 13; hr(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  });
  cy(14); box(ML, y - 3, CW, 13, GBGD);
  t('Total Non-Federal Match', ML + 4, y + 3, bold, 8, GREEN);
  t(money(totalMatch), ML + 460, y + 3, bold, 8, GREEN);
  y -= 20;

  // Summary box
  cy(80); box(ML, y - 78, CW, 86, NAVY);
  t('BUDGET SUMMARY — 150 SNAP E&T PARTICIPANTS', ML + 8, y - 5, bold, 10, HTXT);
  const summaryRows: [string, number][] = [
    ['A. Personnel — Salaries & Fringe (partial FTE)',    personnelTotal],
    ['B. Building Space & Utilities (60% prorated)',      facilityTotal],
    ['C. Training Materials & Participant Costs',         progTotal],
    ['D. Supportive Services',                            supportTotal],
  ];
  summaryRows.forEach(([label, amt], i) => {
    t(label, ML + 8, y - 20 - i * 11, reg, 8, rgb(0.85, 0.92, 1));
    t(money(amt), ML + 400, y - 20 - i * 11, bold, 8, HTXT);
  });
  const divY = y - 68;
  box(ML, divY - 1, CW, 0.5, HTXT);
  t('TOTAL ANNUAL ALLOWABLE COST', ML + 8, divY - 10, bold, 9, HTXT);
  t(money(grandTotal), ML + 400, divY - 10, bold, 10, rgb(0.85, 0.95, 1));
  t('Non-Federal Match (documented)', ML + 8, divY - 22, reg, 8, rgb(0.7, 1, 0.7));
  t(money(totalMatch), ML + 400, divY - 22, bold, 8, rgb(0.7, 1, 0.7));
  t('Federal Share Requested (50%)', ML + 8, divY - 34, reg, 8, rgb(0.7, 1, 0.7));
  t(money(Math.round(federalShare * 0.5)), ML + 400, divY - 34, bold, 8, rgb(0.7, 1, 0.7));
  t(`Cost Per Participant: ${money(costPerParticipant)}  |  Participants Served: 150`, ML + 8, divY - 46, bold, 8.5, rgb(1, 0.9, 0.5));
  y -= 92;

  cy(20); box(ML, y - 14, CW, 18, NBGD, NAVY, 0.5);
  t('No indirect costs are claimed. All costs are direct and documented. FTE allocations are supported by time-and-effort records.', ML + 8, y - 4, reg, 7.5, NAVY);
  t('Non-federal match is documented by booth rental agreement and self-pay enrollment records. In-kind match is documented by volunteer logs.', ML + 8, y - 12, reg, 7.5, NAVY);
  y -= 24;
  y -= 8;

  // ══════════════════════════════════════════════════════════════════
  // RUNNING HEADERS & FOOTERS — all pages except cover
  // ══════════════════════════════════════════════════════════════════
  const allPages = doc.getPages();
  const totalPgs = allPages.length - 1;
  allPages.forEach((pg, i) => {
    if (pg === coverPg) return;
    runHdr(pg, i, totalPgs);
    runFtr(pg);
    pg.drawText(`Page ${i} of ${totalPgs}`, { x: W - MR - 50, y: MB + 4, size: 6.5, font: reg, color: LGRAY });
  });

  return doc.save();
}
