/**
 * FSSA SNAP E&T Third Party Provider (TPP) Application Questionnaire
 * Formal government submission document — white pages, official letterhead style.
 */
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export type EmployerPartner = {
  name: string;
  industry: string;
  city: string;
  programs: string[];
};

export type ReimbCategory = {
  category: string;
  description: string;
  max_per_participant: string;
  mandatory: boolean;
};

export type NonWorkComponent = {
  component: string;
  offered: boolean;
  summary?: string;
  direct_link?: string;
  description?: string;
  target_population?: string;
  criteria?: string;
  geographic_area?: string;
  providers?: string;
  projected_annual_participants?: string;
  estimated_annual_cost?: string;
  not_supplanting?: string;
  cost_parity?: string;
};

export type TppSurveyData = {
  employer_partners?: EmployerPartner[];
  org_name: string;
  org_type: string;
  ein: string;
  uei: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  contact_name: string;
  contact_title: string;
  contact_email: string;
  contact_phone: string;
  program_name: string;
  program_type: string;
  delivery_mode: string;
  counties_served: string[];
  duration_weeks: string;
  weekly_hours_structured: string;
  weekly_hours_supervised: string;
  total_participants: string;
  snap_participants: string;
  abawd_participants: string;
  completion_rate: string;
  placement_rate: string;
  provides_training: boolean;
  provides_case_management: boolean;
  provides_job_placement: boolean;
  supportive_services: string[];
  salary_wages_nonfed?: string;
  salary_wages_fed?: string;
  fringe_rate?: string;
  fringe_nonfed?: string;
  fringe_fed?: string;
  noncapital_equipment_nonfed?: string;
  noncapital_equipment_fed?: string;
  materials_nonfed?: string;
  materials_fed?: string;
  travel_nonfed?: string;
  travel_fed?: string;
  building_space_nonfed?: string;
  building_space_fed?: string;
  capital_expenditures_nonfed?: string;
  capital_expenditures_fed?: string;
  indirect_rate?: string;
  indirect_nonfed?: string;
  indirect_fed?: string;
  state_inkind_nonfed?: string;
  state_inkind_fed?: string;
  allocated_costs_nonfed?: string;
  allocated_costs_fed?: string;
  transportation_reimb_nonfed?: string;
  transportation_reimb_fed?: string;
  tuition_nonfed?: string;
  tuition_fed?: string;
  reimb_participants_annual?: string;
  reimb_participants_monthly?: string;
  reimb_budget_annual?: string;
  reimb_budget_monthly?: string;
  reimb_per_participant_monthly?: string;
  reimb_categories?: ReimbCategory[];
  childcare_waitlist_policy?: string;
  non_work_components?: NonWorkComponent[];
  total_program_cost: string;
  snap_eligible_costs: string;
  personnel_cost: string;
  training_cost: string;
  support_services_cost: string;
  admin_cost: string;
  etpl_listed: boolean;
  dol_registered: boolean;
  liability_insurance: boolean;
  background_check_policy: boolean;
  data_privacy_policy: boolean;
  compliance_notes: string;
};

// ── Utilities ─────────────────────────────────────────────────────────────────

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fmt$(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);
}

function num(v?: string): number {
  return parseFloat(v || '0') || 0;
}

// ── Color palette — formal government document ────────────────────────────────
const C = {
  black:      rgb(0.05, 0.05, 0.05),
  darkGray:   rgb(0.25, 0.25, 0.25),
  gray:       rgb(0.45, 0.45, 0.45),
  lightGray:  rgb(0.75, 0.75, 0.75),
  rule:       rgb(0.80, 0.80, 0.80),
  headerBg:   rgb(0.12, 0.25, 0.50),   // deep navy — header bars only
  headerText: rgb(1.00, 1.00, 1.00),
  subBg:      rgb(0.93, 0.95, 0.98),   // very light blue-gray for sub-headers
  subText:    rgb(0.12, 0.25, 0.50),
  rowAlt:     rgb(0.97, 0.97, 0.97),
  white:      rgb(1.00, 1.00, 1.00),
  green:      rgb(0.10, 0.42, 0.18),
  greenBg:    rgb(0.92, 0.97, 0.92),
};

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateTppSurveyPdf(data: TppSurveyData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic  = await doc.embedFont(StandardFonts.HelveticaOblique);

  const W = 612, H = 792;
  const ML = 60, MR = 60, MT = 60, MB = 50;
  const contentW = W - ML - MR;
  const lineH = 13;

  // Logo
  let logoImg: Awaited<ReturnType<typeof doc.embedJpg>> | null = null;
  try {
    const fs   = await import('fs');
    const path = await import('path');
    const p    = path.join(process.cwd(), 'public', 'logo.jpg');
    if (fs.existsSync(p)) {
      logoImg = await doc.embedJpg(fs.readFileSync(p)).catch(() => null);
    }
  } catch { /* no logo */ }

  let page = doc.addPage([W, H]);
  let y = H - MT;

  const newPage = () => { page = doc.addPage([W, H]); y = H - MT; };
  const checkY  = (need = 40) => { if (y < MB + need) newPage(); };

  // ── Drawing helpers ───────────────────────────────────────────────────────

  const txt = (text: string, x: number, yy: number, font: PDFFont, size: number, color = C.black) =>
    page.drawText(text, { x, y: yy, size, font, color });

  const rule = (yy: number, thick = 0.5, color = C.rule) =>
    page.drawLine({ start: { x: ML, y: yy }, end: { x: W - MR, y: yy }, thickness: thick, color });

  const rect = (x: number, yy: number, w: number, h: number, color = C.white, border?: { color: typeof C.black; width: number }) =>
    page.drawRectangle({ x, y: yy, width: w, height: h, color, ...(border ? { borderColor: border.color, borderWidth: border.width } : {}) });

  // Section header — navy bar with white text
  const sectionHeader = (title: string, num: string) => {
    checkY(30);
    rect(ML, y - 5, contentW, 20, C.headerBg);
    txt(`${num}.  ${title.toUpperCase()}`, ML + 8, y + 7, bold, 9, C.headerText);
    y -= 26;
  };

  // Sub-header — light blue-gray bar
  const subHeader = (title: string) => {
    checkY(20);
    rect(ML, y - 3, contentW, 16, C.subBg);
    txt(title.toUpperCase(), ML + 6, y + 5, bold, 7.5, C.subText);
    y -= 20;
  };

  // Labeled field
  const field = (label: string, value: string, indent = 0) => {
    checkY(20);
    txt(label, ML + indent, y, bold, 7.5, C.gray);
    y -= 11;
    const lines = wrapText(value || '—', contentW - indent - 8, regular, 9);
    for (const line of lines) {
      checkY(12);
      txt(line, ML + indent + 6, y, regular, 9, C.black);
      y -= lineH;
    }
    y -= 3;
  };

  // Two-column field row
  const fieldRow = (fields: { label: string; value: string }[]) => {
    checkY(24);
    const colW = contentW / fields.length;
    const startY = y;
    let maxDrop = 0;
    fields.forEach((f, i) => {
      const x = ML + i * colW;
      txt(f.label, x, startY, bold, 7.5, C.gray);
      const lines = wrapText(f.value || '—', colW - 10, regular, 9);
      lines.forEach((line, li) => txt(line, x + 6, startY - 12 - li * lineH, regular, 9, C.black));
      maxDrop = Math.max(maxDrop, 12 + lines.length * lineH);
    });
    y = startY - maxDrop - 6;
  };

  // Checkbox row
  const checkRow = (label: string, checked: boolean) => {
    checkY(14);
    rect(ML + 6, y - 1, 9, 9, C.white, { color: C.gray, width: 0.75 });
    if (checked) txt('X', ML + 8, y, bold, 7, C.headerBg);
    txt(label, ML + 22, y, regular, 9, C.black);
    y -= lineH + 1;
  };

  // Wrapped paragraph
  const para = (text: string, indent = 0, size = 8.5) => {
    const lines = wrapText(text, contentW - indent, regular, size);
    for (const line of lines) {
      checkY(12);
      txt(line, ML + indent, y, regular, size, C.black);
      y -= lineH;
    }
    y -= 4;
  };

  // ════════════════════════════════════════════════════════════════════════════
  // COVER PAGE
  // ════════════════════════════════════════════════════════════════════════════

  // Top letterhead bar
  rect(0, H - 72, W, 72, C.headerBg);

  // Logo in header
  if (logoImg) {
    const lh = 52, lw = (logoImg.width / logoImg.height) * lh;
    page.drawImage(logoImg, { x: ML, y: H - 66, width: lw, height: lh });
  }

  // Org name in header
  const hx = logoImg ? ML + (logoImg.width / logoImg.height) * 52 + 12 : ML;
  txt(PLATFORM_DEFAULTS.orgLegalName, hx, H - 30, bold, 11, C.headerText);
  txt(`8888 Keystone Crossing, Suite 1300  ·  Indianapolis, IN 46240  ·  ${PLATFORM_DEFAULTS.supportPhone}`, hx, H - 44, regular, 8, rgb(0.75, 0.85, 1));
  txt(`elevate4humanityedu@gmail.com  ·  ${PLATFORM_DEFAULTS.canonicalDomain}`, hx, H - 56, regular, 8, rgb(0.75, 0.85, 1));

  y = H - 90;

  // Document title block
  y -= 30;
  txt('STATE OF INDIANA', ML, y, bold, 9, C.gray);
  y -= 14;
  txt('Family and Social Services Administration — Division of Family Resources', ML, y, regular, 9, C.darkGray);
  y -= 14;
  txt('SNAP Employment & Training Program', ML, y, regular, 9, C.darkGray);
  y -= 30;

  rule(y + 22, 1.5, C.headerBg);
  txt('THIRD PARTY PROVIDER (TPP) APPLICATION QUESTIONNAIRE', ML, y, bold, 16, C.black);
  y -= 18;
  txt('Program Overview, Supportive Services Plan & Compliance Certification', ML, y, italic, 10, C.darkGray);
  y -= 6;
  rule(y, 1.5, C.headerBg);
  y -= 24;

  // Submission info table
  const infoRows = [
    ['Submitting Organization:', data.org_name],
    ['EIN:', data.ein + '   |   UEI: ' + data.uei],
    ['Primary Contact:', `${data.contact_name}, ${data.contact_title}`],
    ['Phone / Email:', `${data.contact_phone}  ·  ${data.contact_email}`],
    ['Program Name:', data.program_name],
    ['Submission Date:', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
  ];

  for (const [label, value] of infoRows) {
    checkY(16);
    rect(ML, y - 3, 140, 14, C.subBg);
    txt(label, ML + 4, y + 3, bold, 8, C.subText);
    txt(value, ML + 148, y + 3, regular, 8.5, C.black);
    rule(y - 4, 0.4);
    y -= 18;
  }

  y -= 20;

  // Confidentiality notice
  rect(ML, y - 28, contentW, 36, rgb(0.98, 0.98, 0.96), { color: C.rule, width: 0.5 });
  txt('NOTICE:', ML + 8, y - 4, bold, 8, C.black);
  txt('This document contains confidential program and financial information submitted for FSSA DFR review purposes only.', ML + 52, y - 4, regular, 8, C.darkGray);
  txt('Unauthorized disclosure is prohibited. Prepared pursuant to 7 CFR 273.7 and Indiana SNAP E&T State Plan requirements.', ML + 8, y - 16, regular, 8, C.darkGray);
  y -= 48;

  // Table of Contents
  y -= 10;
  txt('TABLE OF CONTENTS', ML, y, bold, 10, C.black);
  y -= 6;
  rule(y, 1, C.headerBg);
  y -= 14;

  const toc = [
    ['1', 'Organization Information', 'Legal name, EIN, UEI, address, authorized representative'],
    ['2', 'Program Details', 'Program type, delivery mode, duration, counties served'],
    ['3', 'Participant Projections', 'Annual enrollment targets, SNAP/ABAWD counts, outcomes'],
    ['4', 'Services Provided', 'Core services and all supportive services'],
    ['5', 'FSSA Cost Plan', 'Line-item budget — Non-Federal and Federal shares (Sections I–V)'],
    ['6', 'Participant Reimbursements', 'Tables E.I. & E.II. per 7 CFR 273.7(d)(4)'],
    ['7', 'E&T Components', 'Tables G.I.–G.XI. — Non-Education/Non-Work & Educational Programs'],
    ['8', 'Employer & Program Holder Partners', 'All confirmed partners with industry, location, and programs'],
    ['9', 'Compliance & Certifications', 'ETPL, DOL registration, insurance, policies, signature'],
  ];

  for (const [num, title, desc] of toc) {
    checkY(18);
    const rowBg = parseInt(num) % 2 === 0 ? C.rowAlt : C.white;
    rect(ML, y - 3, contentW, 16, rowBg);
    txt(num + '.', ML + 6, y + 5, bold, 9, C.subText);
    txt(title, ML + 22, y + 5, bold, 9, C.black);
    txt(desc, ML + 180, y + 5, regular, 8, C.gray);
    y -= 18;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RUNNING HEADER helper (applied at end to all pages except cover)
  // ════════════════════════════════════════════════════════════════════════════
  const coverPage = page;

  const addRunningHeader = (pg: PDFPage, pageNum: number) => {
    pg.drawRectangle({ x: 0, y: H - 32, width: W, height: 32, color: C.headerBg });
    if (logoImg) {
      const lh = 24, lw = (logoImg.width / logoImg.height) * lh;
      pg.drawImage(logoImg, { x: ML, y: H - 30, width: lw, height: lh });
    }
    const hx2 = logoImg ? ML + (logoImg.width / logoImg.height) * 24 + 8 : ML;
    pg.drawText(`${PLATFORM_DEFAULTS.orgName}  ·  FSSA SNAP E&T TPP Application`, { x: hx2, y: H - 20, size: 8, font: bold, color: C.headerText });
    pg.drawText(`Page ${pageNum}`, { x: W - MR - 30, y: H - 20, size: 8, font: regular, color: rgb(0.75, 0.85, 1) });
  };

  // Start content pages
  newPage();
  y = H - 50;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 1 — ORGANIZATION INFORMATION
  // ════════════════════════════════════════════════════════════════════════════
  sectionHeader('Organization Information', '1');

  fieldRow([
    { label: 'Legal Organization Name', value: data.org_name },
  ]);
  fieldRow([
    { label: 'Organization Type', value: data.org_type },
    { label: 'Federal Tax ID (EIN)', value: data.ein },
    { label: 'UEI (SAM.gov)', value: data.uei },
  ]);
  fieldRow([
    { label: 'Street Address', value: data.address },
    { label: 'City', value: data.city },
    { label: 'State / ZIP', value: `${data.state} ${data.zip}` },
  ]);
  fieldRow([
    { label: 'Authorized Representative', value: data.contact_name },
    { label: 'Title', value: data.contact_title },
  ]);
  fieldRow([
    { label: 'Email Address', value: data.contact_email },
    { label: 'Phone Number', value: data.contact_phone },
  ]);
  y -= 8;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 2 — PROGRAM DETAILS
  // ════════════════════════════════════════════════════════════════════════════
  sectionHeader('Program Details', '2');

  field('Program Name', data.program_name);
  fieldRow([
    { label: 'Program Type', value: data.program_type.replace(/_/g, ' ') },
    { label: 'Delivery Mode', value: data.delivery_mode.replace(/_/g, ' ') },
    { label: 'Program Duration', value: `${data.duration_weeks} weeks` },
  ]);
  fieldRow([
    { label: 'Structured Hours / Week', value: `${data.weekly_hours_structured} hours` },
    { label: 'Supervised Hours / Week', value: `${data.weekly_hours_supervised} hours` },
    { label: 'Total Weekly Hours', value: `${num(data.weekly_hours_structured) + num(data.weekly_hours_supervised)} hours` },
  ]);
  field('Counties Served', data.counties_served.join(', '));

  subHeader('Credential Programs Offered');
  const programs = [
    'CNA / Healthcare (Certified Nursing Assistant)',
    'HVAC Technician (EPA 608 Certification)',
    'IT Help Desk / CompTIA A+',
    'Peer Recovery Specialist',
    'CDL Class A & B Commercial Driver Training',
    'Barber Apprenticeship',
    'Cosmetology Apprenticeship',
    'Bookkeeping & QuickBooks',
    'Forklift Operator Certification',
  ];
  const colW2 = (contentW - 10) / 2;
  programs.forEach((prog, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const px = ML + col * (colW2 + 10);
    const py = y - row * 13;
    checkY(13);
    txt(`\u2022  ${prog}`, px, py, regular, 8.5, C.black);
  });
  y -= Math.ceil(programs.length / 2) * 13 + 12;
  y -= 8;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 3 — PARTICIPANT PROJECTIONS
  // ════════════════════════════════════════════════════════════════════════════
  sectionHeader('Participant Projections', '3');

  fieldRow([
    { label: 'Total Annual Participants', value: data.total_participants },
    { label: 'SNAP Recipients', value: data.snap_participants },
    { label: 'ABAWD Participants', value: data.abawd_participants },
  ]);
  fieldRow([
    { label: 'Expected Completion Rate', value: `${data.completion_rate}%` },
    { label: 'Expected 90-Day Job Placement Rate', value: `${data.placement_rate}%` },
  ]);
  y -= 8;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 4 — SERVICES PROVIDED
  // ════════════════════════════════════════════════════════════════════════════
  sectionHeader('Services Provided', '4');

  subHeader('Core Services');
  checkRow('Vocational / skills training leading to industry-recognized credentials', data.provides_training);
  checkRow('Individualized case management and barrier assessment', data.provides_case_management);
  checkRow('Job placement assistance and employer connection services', data.provides_job_placement);
  y -= 6;

  subHeader('Supportive Services');
  const SERVICE_LABELS: Record<string, string> = {
    transportation:   'Transportation assistance — bus passes, gas cards, mileage reimbursement to attend training and employment',
    work_clothing:    'Work clothing / uniforms — scrubs, safety boots, PPE, and professional attire required for program completion',
    testing_fees:     'Credential testing fees — NHA, EPA 608, CompTIA A+, CDL licensing exam registration and proctoring costs',
    childcare:        'Childcare referrals — coordination with licensed providers, CCDF subsidy navigation, and waitlist management',
    tools:            'Tools / equipment — program-specific tools, kits, and equipment provided or loaned to participants',
    housing_referral: 'Housing referrals — connection to emergency housing, transitional housing, and rental assistance programs',
    mental_health:    'Mental health referrals — licensed counselor referrals, crisis support, and disability accommodation',
    substance_abuse:  'Substance abuse referrals — recovery support services and treatment program coordination',
  };
  for (const svc of Object.keys(SERVICE_LABELS)) {
    checkRow(SERVICE_LABELS[svc], data.supportive_services.includes(svc));
  }
  y -= 8;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 5 — FSSA COST PLAN
  // ════════════════════════════════════════════════════════════════════════════
  sectionHeader('FSSA Cost Plan', '5');

  const cNF = ML + 310, cFF = ML + 420, cCW = 85;

  const costHeader = () => {
    checkY(20);
    rect(ML, y - 4, contentW, 18, C.headerBg);
    txt('Expense Category', ML + 4, y + 7, bold, 8, C.headerText);
    txt('Non-Federal Share', cNF, y + 7, bold, 7.5, rgb(0.75, 0.88, 1));
    txt('Federal Share', cFF, y + 7, bold, 7.5, rgb(0.75, 0.88, 1));
    y -= 22;
  };

  const costRow = (label: string, nf: number, ff: number, isTotal = false, isSub = false) => {
    checkY(14);
    const bg = isTotal ? C.subBg : (isSub ? rgb(0.95, 0.96, 0.98) : C.white);
    rect(ML, y - 3, contentW, 14, bg);
    const f = isTotal ? bold : regular;
    const sz = isTotal ? 8.5 : 8;
    txt(label, ML + 4, y + 3, f, sz, isTotal ? C.subText : C.black);
    const nfStr = nf > 0 ? fmt$(nf) : '—';
    const ffStr = ff > 0 ? fmt$(ff) : '—';
    txt(nfStr, cNF + cCW - (isTotal ? bold : regular).widthOfTextAtSize(nfStr, sz), y + 3, f, sz, C.black);
    txt(ffStr, cFF + cCW - (isTotal ? bold : regular).widthOfTextAtSize(ffStr, sz), y + 3, f, sz, C.black);
    y -= 14;
    rule(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  };

  costHeader();

  // I. Direct Program & Admin Costs
  checkY(16);
  rect(ML, y - 2, contentW, 14, C.subBg);
  txt('I.  DIRECT PROGRAM AND ADMINISTRATIVE COSTS', ML + 4, y + 4, bold, 8, C.subText);
  y -= 16;

  costRow('Salary / Wages', num(data.salary_wages_nonfed), num(data.salary_wages_fed));
  costRow(`Fringe Benefits (Rate: ${data.fringe_rate ?? '15'}%)`, num(data.fringe_nonfed), num(data.fringe_fed));
  costRow('Non-Capital Equipment', num(data.noncapital_equipment_nonfed), num(data.noncapital_equipment_fed));
  costRow('Materials / Supplies', num(data.materials_nonfed), num(data.materials_fed));
  costRow('Travel', num(data.travel_nonfed), num(data.travel_fed));
  costRow('Building Space / Rent', num(data.building_space_nonfed), num(data.building_space_fed));
  costRow('Equipment & Capital Expenditures', num(data.capital_expenditures_nonfed), num(data.capital_expenditures_fed));

  const sub1NF = num(data.salary_wages_nonfed) + num(data.fringe_nonfed) + num(data.noncapital_equipment_nonfed) + num(data.materials_nonfed) + num(data.travel_nonfed) + num(data.building_space_nonfed) + num(data.capital_expenditures_nonfed);
  const sub1FF = num(data.salary_wages_fed) + num(data.fringe_fed) + num(data.noncapital_equipment_fed) + num(data.materials_fed) + num(data.travel_fed) + num(data.building_space_fed) + num(data.capital_expenditures_fed);
  costRow('Total Direct Program and Administrative Costs', sub1NF, sub1FF, true);

  // II. Indirect Costs
  checkY(16);
  rect(ML, y - 2, contentW, 14, C.subBg);
  txt('II.  INDIRECT COSTS — FEDERALLY APPROVED RATE', ML + 4, y + 4, bold, 8, C.subText);
  y -= 16;
  costRow(`Indirect Costs (Approved Rate: ${data.indirect_rate ?? '15'}%)`, num(data.indirect_nonfed), num(data.indirect_fed));

  // III. In-Kind / Allocated
  checkY(16);
  rect(ML, y - 2, contentW, 14, C.subBg);
  txt('III.  IN-KIND CONTRIBUTIONS & ALLOCATED COSTS', ML + 4, y + 4, bold, 8, C.subText);
  y -= 16;
  costRow('State In-Kind Contribution', num(data.state_inkind_nonfed), num(data.state_inkind_fed));
  costRow('Federally Approved Allocated Costs (State agency)', 0, 0);
  costRow('County Administered Allocated Costs (if applicable)', 0, 0);
  const allocNF = num(data.allocated_costs_nonfed) + num(data.state_inkind_nonfed);
  const allocFF = num(data.allocated_costs_fed) + num(data.state_inkind_fed);
  costRow('Total Allocated Costs', allocNF, allocFF, true);
  costRow('Total Administrative Costs', sub1NF + num(data.indirect_nonfed) + allocNF, sub1FF + num(data.indirect_fed) + allocFF, true);

  // IV. Participant Reimbursements
  checkY(16);
  rect(ML, y - 2, contentW, 14, C.subBg);
  txt('IV.  PARTICIPANT REIMBURSEMENTS (SUPPORTIVE SERVICES)', ML + 4, y + 4, bold, 8, C.subText);
  y -= 16;
  costRow('Transportation & Other Costs (materials, etc.)', num(data.transportation_reimb_nonfed), num(data.transportation_reimb_fed));
  costRow('Tuition / Training Costs', num(data.tuition_nonfed), num(data.tuition_fed));
  const partNF = num(data.transportation_reimb_nonfed) + num(data.tuition_nonfed);
  const partFF = num(data.transportation_reimb_fed) + num(data.tuition_fed);
  costRow('Total Participant Reimbursements', partNF, partFF, true);

  // V. Grand Total
  checkY(20);
  const grandNF = sub1NF + num(data.indirect_nonfed) + allocNF + partNF;
  const grandFF = sub1FF + num(data.indirect_fed) + allocFF + partFF;
  rect(ML, y - 4, contentW, 20, C.headerBg);
  txt('V.  TOTAL PROGRAM COSTS', ML + 4, y + 8, bold, 9, C.headerText);
  const gnfStr = fmt$(grandNF), gffStr = fmt$(grandFF);
  txt(gnfStr, cNF + cCW - bold.widthOfTextAtSize(gnfStr, 9), y + 8, bold, 9, rgb(0.85, 0.95, 1));
  txt(gffStr, cFF + cCW - bold.widthOfTextAtSize(gffStr, 9), y + 8, bold, 9, rgb(0.85, 0.95, 1));
  y -= 26;

  if (grandFF > 0) {
    checkY(28);
    rect(ML, y - 18, contentW, 26, C.greenBg, { color: C.green, width: 0.5 });
    txt('Estimated SNAP E&T Federal Reimbursement (50% of Federal Share):', ML + 8, y - 2, bold, 8, C.green);
    txt(fmt$(grandFF * 0.5), ML + 8, y - 14, bold, 10, C.green);
    y -= 32;
  }
  y -= 8;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 6 — PARTICIPANT REIMBURSEMENTS (Tables E.I. & E.II.)
  // ════════════════════════════════════════════════════════════════════════════
  sectionHeader('Participant Reimbursements — Tables E.I. & E.II.', '6');

  // Regulatory citation
  checkY(50);
  rect(ML, y - 40, contentW, 48, rgb(0.97, 0.97, 1), { color: C.rule, width: 0.5 });
  txt('Regulatory Authority: 7 CFR 273.7(d)(4)', ML + 8, y - 2, bold, 8, C.subText);
  const regText = 'State agencies are required to pay for or reimburse participants for expenses that are reasonable, necessary, and directly related to participation in E&T. If a State agency serves mandatory E&T participants, it must meet all costs associated with mandatory participation. If an individual\'s expenses exceed available reimbursements, the individual must be placed into a suitable component or exempted from mandatory E&T.';
  const regLines = wrapText(regText, contentW - 16, regular, 7.5);
  regLines.forEach((line, i) => txt(line, ML + 8, y - 14 - i * 10, regular, 7.5, C.darkGray));
  y -= 14 + regLines.length * 10 + 10;

  // Table E.I.
  subHeader('Table E.I. — Estimates of Participant Reimbursements');

  const eiRows = [
    { roman: 'I.',   label: 'Estimated number of E&T participants to receive reimbursements (unduplicated annual count)', value: data.reimb_participants_annual ?? '90' },
    { roman: 'II.',  label: 'Estimated number of E&T participants to receive reimbursements per month (duplicated count)', value: data.reimb_participants_monthly ?? '30' },
    { roman: 'III.', label: 'Estimated budget for E&T participant reimbursements in upcoming fiscal year', value: fmt$(num(data.reimb_budget_annual ?? '50000')) },
    { roman: 'IV.',  label: 'Estimated budget for E&T participant reimbursements per month (Row III ÷ 12)', value: fmt$(num(data.reimb_budget_monthly ?? '4167')) },
    { roman: 'V.',   label: 'Estimated amount of participant reimbursements per E&T participant per month (Row IV ÷ Row II)', value: fmt$(num(data.reimb_per_participant_monthly ?? '139')) },
  ];

  // Column headers
  checkY(18);
  rect(ML, y - 3, contentW, 16, C.subBg);
  txt('Row', ML + 4, y + 5, bold, 7.5, C.subText);
  txt('Description', ML + 28, y + 5, bold, 7.5, C.subText);
  txt('Amount / Count', W - MR - 90, y + 5, bold, 7.5, C.subText);
  y -= 18;

  eiRows.forEach((row, i) => {
    checkY(16);
    rect(ML, y - 3, contentW, 15, i % 2 === 0 ? C.rowAlt : C.white);
    txt(row.roman, ML + 4, y + 3, bold, 8, C.subText);
    const descLines = wrapText(row.label, contentW - 120, regular, 8);
    txt(descLines[0], ML + 28, y + 3, regular, 8, C.black);
    txt(row.value, W - MR - bold.widthOfTextAtSize(row.value, 9) - 4, y + 3, bold, 9, C.black);
    y -= 16;
    rule(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  });
  y -= 12;

  // Table E.II.
  subHeader('Table E.II. — Participant Reimbursement Details');

  checkY(20);
  rect(ML, y - 3, contentW, 16, C.headerBg);
  txt('Category', ML + 4, y + 5, bold, 7.5, C.headerText);
  txt('Description / Policy', ML + 100, y + 5, bold, 7.5, C.headerText);
  txt('Max / Participant', ML + 340, y + 5, bold, 7.5, C.headerText);
  txt('Type', ML + 440, y + 5, bold, 7.5, C.headerText);
  y -= 20;

  const reimb_categories = data.reimb_categories ?? [
    { category: 'Transportation',       description: 'Bus passes, mileage reimbursement, rideshare support. Required for all mandatory E&T participants.',                                  max_per_participant: '$150/month',    mandatory: true  },
    { category: 'Childcare',            description: 'Licensed childcare costs per CCDBG market rate surveys. Required for mandatory participants with dependents.',                        max_per_participant: '$500/month',    mandatory: true  },
    { category: 'Tools / Equipment',    description: 'Program-required tools, kits, and equipment for hands-on training components.',                                                       max_per_participant: '$300 one-time', mandatory: false },
    { category: 'Credential Test Fees', description: 'Exam registration and certification fees (NHA, EPA 608, CompTIA A+, CDL skills test).',                                              max_per_participant: '$250 one-time', mandatory: false },
    { category: 'Work Clothing',        description: 'Scrubs, safety gear, steel-toed boots, and professional attire required for program completion.',                                    max_per_participant: '$200 one-time', mandatory: false },
    { category: 'Books / Materials',    description: 'Textbooks, workbooks, and study materials required for classroom instruction.',                                                       max_per_participant: '$150 one-time', mandatory: false },
    { category: 'License Fees',         description: 'State licensing and occupational license application fees upon credential completion.',                                               max_per_participant: '$100 one-time', mandatory: false },
    { category: 'Electronic Devices',   description: 'Tablets or laptops for online/hybrid coursework where participant has no device access.',                                            max_per_participant: '$300 one-time', mandatory: false },
  ];

  reimb_categories.forEach((cat, i) => {
    checkY(20);
    rect(ML, y - 4, contentW, 18, i % 2 === 0 ? C.rowAlt : C.white);
    txt(cat.category, ML + 4, y + 4, bold, 8, C.black);
    const descLines = wrapText(cat.description, 230, regular, 7.5);
    txt(descLines[0] ?? '', ML + 100, y + 4, regular, 7.5, C.darkGray);
    if (descLines[1]) txt(descLines[1], ML + 100, y - 5, regular, 7.5, C.darkGray);
    txt(cat.max_per_participant, ML + 340, y + 4, regular, 8, C.black);
    const typeLabel = cat.mandatory ? 'MANDATORY' : 'Optional';
    const typeColor = cat.mandatory ? C.green : C.gray;
    txt(typeLabel, ML + 440, y + 4, cat.mandatory ? bold : regular, 7.5, typeColor);
    y -= 20;
    rule(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
  });
  y -= 8;

  // Childcare waitlist policy
  if (data.childcare_waitlist_policy) {
    checkY(40);
    subHeader('Childcare Waiting List Policy');
    para(data.childcare_waitlist_policy, 0, 8);
  }
  y -= 8;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 7 — E&T COMPONENTS (Tables G.I.–G.XI.)
  // ════════════════════════════════════════════════════════════════════════════
  sectionHeader('E&T Components — Tables G.I.–G.XI.', '7');

  const COMPONENT_LABELS: Record<string, string> = {
    SJS:   'Table G.I.   — Supervised Job Search (SJS)',
    JST:   'Table G.II.  — Job Search Training (JST)',
    SET:   'Table G.III. — Self-Employment Training (SET)',
    Workfare: 'Table G.IV. — Workfare',
    JR:    'Table G.V.   — Job Retention (JR)',
    EPB:   'Table G.VI.  — Basic & Foundational Skills Instruction',
    EPC:   'Table G.VII. — Career & Technical Education / Vocational Training',
    EPEL:  'Table G.VIII.— English Language Acquisition (ELA)',
    EPIE:  'Table G.IX.  — Integrated Education & Training / Bridge Programs',
    EPWRT: 'Table G.X.   — Work Readiness Training (WRT)',
    EPO:   'Table G.XI.  — Other (Case Management & Wraparound Support)',
  };

  const components = data.non_work_components ?? [];

  for (const comp of components) {
    const label = COMPONENT_LABELS[comp.component] ?? `Table — ${comp.component}`;
    checkY(30);
    subHeader(`${label}  [${comp.offered ? 'OFFERED' : 'NOT OFFERED'}]`);

    if (!comp.offered) {
      txt(`This component is not offered by ${PLATFORM_DEFAULTS.orgName} at this time.`, ML + 6, y, italic, 8.5, C.gray);
      y -= 16;
      continue;
    }

    const desc = comp.description ?? comp.summary ?? '';
    if (desc) { txt('Description:', ML, y, bold, 7.5, C.gray); y -= 11; para(desc, 6, 8.5); }

    if (comp.target_population) { txt('Target Population:', ML, y, bold, 7.5, C.gray); y -= 11; para(comp.target_population, 6, 8.5); }
    if (comp.criteria)          { txt('Eligibility Criteria:', ML, y, bold, 7.5, C.gray); y -= 11; para(comp.criteria, 6, 8.5); }
    if (comp.geographic_area)   { txt('Geographic Area:', ML, y, bold, 7.5, C.gray); y -= 11; para(comp.geographic_area, 6, 8.5); }
    if (comp.providers)         { txt('Service Providers:', ML, y, bold, 7.5, C.gray); y -= 11; para(comp.providers, 6, 8.5); }

    if (comp.projected_annual_participants || comp.estimated_annual_cost) {
      checkY(16);
      fieldRow([
        { label: 'Projected Annual Participants', value: comp.projected_annual_participants ?? '—' },
        { label: 'Estimated Annual Cost', value: comp.estimated_annual_cost ?? '—' },
      ]);
    }

    if (comp.not_supplanting) {
      checkY(20);
      txt('Non-Supplanting Statement:', ML, y, bold, 7.5, C.gray);
      y -= 11;
      para(comp.not_supplanting, 6, 8);
    }
    if (comp.cost_parity) {
      checkY(20);
      txt('Cost Parity Statement:', ML, y, bold, 7.5, C.gray);
      y -= 11;
      para(comp.cost_parity, 6, 8);
    }
    if (comp.direct_link) {
      checkY(20);
      txt('Direct Linkage to Employment:', ML, y, bold, 7.5, C.gray);
      y -= 11;
      para(comp.direct_link, 6, 8);
    }
    y -= 6;
  }
  y -= 8;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 8 — EMPLOYER & PROGRAM HOLDER PARTNERS
  // ════════════════════════════════════════════════════════════════════════════
  sectionHeader('Employer & Program Holder Partners', '8');

  const partners = data.employer_partners ?? [];

  if (partners.length > 0) {
    // Table header
    checkY(20);
    rect(ML, y - 3, contentW, 16, C.headerBg);
    txt('Organization Name', ML + 4, y + 5, bold, 7.5, C.headerText);
    txt('Industry / Type', ML + 180, y + 5, bold, 7.5, C.headerText);
    txt('Location', ML + 320, y + 5, bold, 7.5, C.headerText);
    txt('Programs', ML + 400, y + 5, bold, 7.5, C.headerText);
    y -= 20;

    partners.forEach((p, i) => {
      const progStr = p.programs.join(', ');
      const progLines = wrapText(progStr, 190, regular, 7.5);
      const rowH = Math.max(16, progLines.length * 11 + 6);
      checkY(rowH + 4);
      rect(ML, y - rowH + 10, contentW, rowH, i % 2 === 0 ? C.rowAlt : C.white);
      txt(p.name, ML + 4, y + 2, bold, 8, C.black);
      txt(p.industry, ML + 180, y + 2, regular, 7.5, C.darkGray);
      txt(p.city, ML + 320, y + 2, regular, 7.5, C.darkGray);
      progLines.forEach((line, li) => txt(line, ML + 400, y + 2 - li * 11, regular, 7.5, C.darkGray));
      y -= rowH;
      rule(y + 1, 0.3, rgb(0.88, 0.88, 0.88));
    });
  }
  y -= 12;

  // Partner categories note
  checkY(50);
  rect(ML, y - 38, contentW, 46, rgb(0.97, 0.97, 1), { color: C.rule, width: 0.5 });
  txt('Partner Categories:', ML + 8, y - 2, bold, 8, C.subText);
  const partnerNotes = [
    'Program Holders (MOU Signed): Ameco\'s Enterprise, Center of Destiny, First Class Training Center, LoopRoots Foundation, Doreen Hawkins',
    'Program Holders (MOU Pending): Mesmerized by Beauty Cosmetology Academy, Better Days at Better Life Home Care, Kountry Kutz Barbershop',
    'Employer Partners (MOU Outreach Sent): Guiding Angels Care, Harmony Heights Care, Cradle to Crayons Academy',
    'CDL Referral Partner: Driver Solutions (CDL staffing and placement)',
  ];
  partnerNotes.forEach((note, i) => {
    txt(`\u2022  ${note}`, ML + 8, y - 14 - i * 10, regular, 7.5, C.darkGray);
  });
  y -= 58;
  y -= 8;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 9 — COMPLIANCE & CERTIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════
  sectionHeader('Compliance & Certifications', '9');

  checkRow('Listed on Indiana ETPL (Eligible Training Provider List)', data.etpl_listed);
  checkRow('DOL Registered Apprenticeship Sponsor — RAPIDS #2025-IN-132301', data.dol_registered);
  checkRow('General liability insurance in force', data.liability_insurance);
  checkRow('Background check policy for all staff working with participants', data.background_check_policy);
  checkRow('Written data privacy / FERPA compliance policy in place', data.data_privacy_policy);
  y -= 6;

  if (data.compliance_notes) {
    subHeader('Additional Compliance Notes');
    para(data.compliance_notes, 0, 8.5);
  }
  y -= 12;

  // Signature block
  checkY(120);
  subHeader('Certification & Authorized Signature');

  checkY(100);
  const certText = 'I certify that the information contained in this application is accurate and complete to the best of my knowledge. I understand that any false, fictitious, or fraudulent information may subject me to criminal, civil, or administrative penalties. I certify that the organization named herein meets all applicable requirements for participation as a Third Party Provider in the Indiana SNAP Employment & Training program, and that all program activities will be conducted in accordance with 7 CFR 273.7 and applicable State and Federal regulations.';
  para(certText, 0, 8.5);
  y -= 16;

  // Signature lines
  const sigFields = [
    { label: 'Authorized Representative Signature', width: 260 },
    { label: 'Date', width: 120 },
  ];
  let sx = ML;
  for (const sf of sigFields) {
    checkY(40);
    rule(y - 20, 0.75, C.black);
    txt(sf.label, sx, y - 32, regular, 7.5, C.gray);
    sx += sf.width + 20;
  }
  y -= 48;

  const sigFields2 = [
    { label: 'Printed Name', width: 200 },
    { label: 'Title', width: 180 },
  ];
  sx = ML;
  for (const sf of sigFields2) {
    rule(y - 20, 0.75, C.black);
    txt(sf.label, sx, y - 32, regular, 7.5, C.gray);
    sx += sf.width + 20;
  }
  y -= 48;

  rule(y - 20, 0.75, C.black);
  txt('Organization Name', ML, y - 32, regular, 7.5, C.gray);
  y -= 48;

  // ════════════════════════════════════════════════════════════════════════════
  // FOOTER — all pages except cover
  // ════════════════════════════════════════════════════════════════════════════
  const allPages = doc.getPages();
  allPages.forEach((pg, i) => {
    if (pg === coverPage) return;
    addRunningHeader(pg, i); // page number = index (cover is 0, content starts at 1)
    pg.drawLine({ start: { x: ML, y: MB + 14 }, end: { x: W - MR, y: MB + 14 }, thickness: 0.5, color: C.rule });
    pg.drawText(`${PLATFORM_DEFAULTS.orgLegalName}  ·  8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240  ·  ${PLATFORM_DEFAULTS.supportPhone}`, {
      x: ML, y: MB + 4, size: 6.5, font: regular, color: C.lightGray,
    });
    pg.drawText(`Page ${i} of ${allPages.length - 1}`, {
      x: W - MR - 50, y: MB + 4, size: 6.5, font: regular, color: C.lightGray,
    });
  });

  return doc.save();
}
