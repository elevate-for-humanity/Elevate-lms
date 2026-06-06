/**
 * C1 CDL Training Program — Student / Sponsor MOU PDF Generator
 * Covers Class A and Class B programs. Mirrors the official MOU document
 * including goals, costs, format, attendance, job placement, and dismissal policy.
 * Uses pdf-lib — runs in Node.js API routes only.
 */

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export type CDLStudentMOUData = {
  // Signing party
  signer_type: 'student' | 'employer' | 'agency' | 'funding_partner';
  signer_name: string;
  signer_title?: string;
  organization_name?: string; // employer/agency/funder name
  contact_email?: string;
  contact_phone?: string;
  // Program selection
  cdl_class: 'A' | 'B';
  // Student info (if signer_type === 'student')
  student_name?: string;
  // Metadata
  signed_at: string;
  signature_data?: string; // base64 PNG data URL
  ip_address?: string;
  mou_version?: string;
};

const SPONSOR = '2Exclusive LLC-S (DBA: ' + PLATFORM_DEFAULTS.orgName + ' Technical and Career Institute)';
const SPONSOR_SIGNER = 'Elizabeth Greene';
const SPONSOR_TITLE = 'Founder & Chief Executive Officer';
const ADDRESS = '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240';
const PHONE = PLATFORM_DEFAULTS.supportPhone;
const EMAIL = 'elevate4humanityedu@gmail.com';

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function drawWrapped(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: PDFFont,
  fontSize: number,
  lineHeight: number,
  color = rgb(0.15, 0.15, 0.15),
): number {
  const lines = wrapText(text, maxWidth, font, fontSize);
  for (const line of lines) {
    page.drawText(line, { x, y, size: fontSize, font, color });
    y -= lineHeight;
  }
  return y;
}

// ── Main generator ────────────────────────────────────────────────────────────

export async function generateCDLStudentMOUPdf(data: CDLStudentMOUData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const W = 612;
  const H = 792;
  const M = 60; // margin
  const CW = W - M * 2; // content width
  const LH = 13; // base line height
  const BODY = 9;
  const SECTION_COLOR = rgb(0.55, 0.27, 0.07); // amber/brown — CDL brand
  const RULE_COLOR = rgb(0.78, 0.78, 0.78);

  const cdlClass = data.cdl_class ?? 'A';
  const classPrice = cdlClass === 'A' ? '$4,995' : '$3,495';
  const classWeeks = cdlClass === 'A' ? 'three weeks' : 'one week';
  const signedDate = new Date(data.signed_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  let page = doc.addPage([W, H]);
  let y = H - M;

  const newPage = () => { page = doc.addPage([W, H]); y = H - M; };
  const checkY = (needed = 60) => { if (y < M + needed) newPage(); };
  const rule = () => {
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: RULE_COLOR });
  };
  const sectionHead = (title: string) => {
    checkY(80);
    page.drawText(title, { x: M, y, size: 10, font: bold, color: SECTION_COLOR });
    y -= LH + 2;
  };
  const body = (text: string, indent = 0) => {
    y = drawWrapped(page, text, M + indent, y, CW - indent, regular, BODY, LH);
    y -= 3;
  };
  const bullet = (text: string, indent = 10) => {
    y = drawWrapped(page, `\u2022  ${text}`, M + indent, y, CW - indent, regular, BODY, LH);
    y -= 2;
  };
  const subBullet = (text: string) => {
    y = drawWrapped(page, `\u25e6  ${text}`, M + 22, y, CW - 22, regular, BODY, LH);
    y -= 2;
  };
  const gap = (n = 8) => { y -= n; };
  const ruleGap = () => { gap(6); rule(); gap(14); };

  // ── Header bar ───────────────────────────────────────────────────────────────
  // Taller header to give the logo room
  const HEADER_H = 100;
  page.drawRectangle({ x: 0, y: H - HEADER_H, width: W, height: HEADER_H, color: rgb(0.55, 0.27, 0.07) });

  // Logo — file is JPEG despite .png extension; try JPEG embed first
  let logoImg: Awaited<ReturnType<typeof doc.embedJpg>> | null = null;
  try {
    const fs = await import('fs');
    const path = await import('path');
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      logoImg = await doc.embedJpg(logoBytes).catch(async () => {
        // Genuine PNG fallback
        return doc.embedPng(logoBytes).catch(() => null);
      });
    }
  } catch { /* fall back to text-only header */ }

  // Logo: fit inside header with 8px padding top/bottom → max height 84px
  const LOGO_MAX_H = 84;
  const LOGO_MAX_W = 180; // cap width so text has room
  let logoW = 0;

  if (logoImg) {
    const nativeW = logoImg.width;
    const nativeH = logoImg.height;
    // Scale to fit within LOGO_MAX_H and LOGO_MAX_W
    const scaleH = LOGO_MAX_H / nativeH;
    const scaleW = LOGO_MAX_W / nativeW;
    const scale = Math.min(scaleH, scaleW);
    logoW = nativeW * scale;
    const lh = nativeH * scale;
    // Center vertically in header
    const logoY = H - HEADER_H + (HEADER_H - lh) / 2;
    page.drawImage(logoImg, { x: M, y: logoY, width: logoW, height: lh });
  }

  // Text block — sits to the right of the logo (or at margin if no logo)
  const hx = logoImg ? M + logoW + 14 : M;
  const textBlockW = W - hx - M;

  // Vertically center the three text lines in the header
  page.drawText('ELEVATE FOR HUMANITY', {
    x: hx, y: H - 36, size: 14, font: bold, color: rgb(1, 1, 1),
  });
  // Truncate if needed so it doesn't overflow
  const subLine = `Technical and Career Institute  ·  C1 CDL Class ${cdlClass} Training Program`;
  page.drawText(subLine, {
    x: hx, y: H - 52, size: 8, font: regular, color: rgb(1, 0.85, 0.65),
  });
  page.drawText(`${ADDRESS}  ·  ${PHONE}`, {
    x: hx, y: H - 65, size: 7.5, font: regular, color: rgb(0.95, 0.78, 0.55),
  });

  y = H - HEADER_H - 12;

  // ── Document title ───────────────────────────────────────────────────────────
  page.drawText('MEMORANDUM OF UNDERSTANDING', { x: M, y, size: 14, font: bold, color: SECTION_COLOR });
  y -= 16;
  page.drawText(`Program Goals, Objectives, Structure & Expectations — Class ${cdlClass} CDL Training`, {
    x: M, y, size: 10, font: regular, color: rgb(0.3, 0.3, 0.3),
  });
  y -= 12;
  page.drawText(`Version ${data.mou_version ?? '2025-cdl-student-01'}  ·  Effective: ${signedDate}`, {
    x: M, y, size: 8, font: italic, color: rgb(0.5, 0.5, 0.5),
  });
  y -= 10;
  ruleGap();

  // ── I. Purpose ───────────────────────────────────────────────────────────────
  sectionHead('I.  PURPOSE OF AGREEMENT');
  body(
    `This MOU outlines the goals, objectives, structure, costs, and expectations of the C1 CDL Training Program. ` +
    `The intent is to clearly define the responsibilities of both the training provider, the student, and the ` +
    `student's employer, agency, or sponsor in pursuit of either a Class A or Class B Commercial Driver's License (CDL).`
  );
  ruleGap();

  // ── II. Program Goals & Objectives ──────────────────────────────────────────
  sectionHead('II.  PROGRAM GOALS & OBJECTIVES');

  page.drawText('1.  Primary Objective — Class A CDL Program', { x: M, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  body(
    'To provide students with the knowledge, skills, and hands-on driving experience required to successfully ' +
    'obtain a Class A Commercial Driver\'s License and begin a career as a professional commercial driver.',
    10
  );
  gap(4);

  page.drawText('2.  Primary Objective — Class B CDL Program', { x: M, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  body(
    'To equip students with the competencies necessary to obtain a Class B Commercial Driver\'s License and ' +
    'enter the workforce as a qualified commercial vehicle operator.',
    10
  );
  gap(4);

  page.drawText('3.  Overall Program Goals', { x: M, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  bullet('Deliver high-quality classroom, range, and road instruction in compliance with federal and state CDL standards.');
  bullet('Prepare each student for the CDL skills test.');
  bullet('Support students through employment preparation and job placement assistance to ensure strong career outcomes.');
  ruleGap();

  // ── III. Program Costs ───────────────────────────────────────────────────────
  sectionHead('III.  PROGRAM COSTS');

  page.drawText('1.  Class A CDL Training Program', { x: M, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  page.drawText('Full Program Price: $4,995', { x: M + 10, y, size: BODY, font: bold, color: SECTION_COLOR });
  y -= LH;
  page.drawText('Includes:', { x: M + 10, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  subBullet('Classroom instruction (online or in-person)');
  subBullet('Behind-the-wheel range training');
  subBullet('Road training');
  page.drawText('Does Not Include:', { x: M + 10, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  subBullet('State licensing and CDL issuance fees');
  gap(6);

  page.drawText('2.  Class B CDL Training Program', { x: M, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  page.drawText('Full Program Price: $3,495', { x: M + 10, y, size: BODY, font: bold, color: SECTION_COLOR });
  y -= LH;
  page.drawText('Includes:', { x: M + 10, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  subBullet('Classroom instruction (online or in-person)');
  subBullet('Behind-the-wheel range training');
  subBullet('Road training');
  page.drawText('Does Not Include:', { x: M + 10, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  subBullet('State licensing and CDL issuance fees');
  ruleGap();

  // ── III-A. Referral Partner Financial Agreement ──────────────────────────────
  checkY(160);
  sectionHead('III-A.  REFERRAL PARTNER FINANCIAL AGREEMENT');

  // Highlight box
  const boxH = 52;
  page.drawRectangle({
    x: M, y: y - boxH, width: CW, height: boxH + 8,
    color: rgb(0.97, 0.95, 0.88),
    borderColor: rgb(0.55, 0.27, 0.07),
    borderWidth: 1,
  });
  page.drawText('Referral Partner Contribution', { x: M + 10, y: y - 4, size: BODY, font: bold, color: SECTION_COLOR });
  page.drawText('$500 per enrolled student — due at class start', {
    x: M + 10, y: y - 16, size: 11, font: bold, color: rgb(0.55, 0.27, 0.07),
  });
  page.drawText(`${PLATFORM_DEFAULTS.orgName} covers the remaining program balance on behalf of the student.`, {
    x: M + 10, y: y - 30, size: BODY, font: regular, color: rgb(0.2, 0.2, 0.2),
  });
  y -= boxH + 16;

  body(
    'Referral partners entering into this MOU agree to submit a $500 referral contribution per student at the ' +
      `time of class start. ${PLATFORM_DEFAULTS.orgName} will fund the remaining balance of the program cost (up to the ` +
      'full program price less $500) on behalf of the referred student. The referral partner is not responsible ' +
      'for any additional tuition beyond the $500 per-student contribution.',
  );
  gap(4);

  page.drawText('Division of Responsibilities', { x: M, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH + 2;

  // Two-column responsibility table
  const tColW = (CW - 10) / 2;
  const tCol2 = M + tColW + 10;

  page.drawRectangle({ x: M, y: y - 14, width: tColW, height: 18, color: SECTION_COLOR });
  page.drawRectangle({ x: tCol2, y: y - 14, width: tColW, height: 18, color: rgb(0.75, 0.22, 0.17) });
  page.drawText(PLATFORM_DEFAULTS.orgName, { x: M + 6, y: y - 10, size: BODY, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Referral Partner', { x: tCol2 + 6, y: y - 10, size: BODY, font: bold, color: rgb(1, 1, 1) });
  y -= 22;

  const elevateResponsibilities = [
    'Student intake & enrollment processing',
    'FMCSA ELDT reporting & compliance',
    'All classroom & behind-the-wheel instruction',
    'Credential testing coordination',
    'Job placement assistance & carrier connections',
    'Remaining program balance funding',
  ];
  const partnerResponsibilities = [
    '$500 referral contribution at class start',
    'Student identification & pre-screening',
    'Confirming student eligibility & readiness',
    'Ensuring student transportation to training',
    'Communication relay between student & Elevate',
  ];

  const maxRows = Math.max(elevateResponsibilities.length, partnerResponsibilities.length);
  for (let i = 0; i < maxRows; i++) {
    checkY(16);
    const rowColor = i % 2 === 0 ? rgb(0.97, 0.97, 0.97) : rgb(1, 1, 1);
    page.drawRectangle({ x: M, y: y - 12, width: tColW, height: 16, color: rowColor });
    page.drawRectangle({ x: tCol2, y: y - 12, width: tColW, height: 16, color: rowColor });
    if (elevateResponsibilities[i]) {
      page.drawText(`\u2022  ${elevateResponsibilities[i]}`, { x: M + 6, y: y - 9, size: 7.5, font: regular, color: rgb(0.15, 0.15, 0.15) });
    }
    if (partnerResponsibilities[i]) {
      page.drawText(`\u2022  ${partnerResponsibilities[i]}`, { x: tCol2 + 6, y: y - 9, size: 7.5, font: regular, color: rgb(0.15, 0.15, 0.15) });
    }
    y -= 16;
  }
  ruleGap();

  // ── IV. Program Format & Structure ──────────────────────────────────────────
  checkY(120);
  sectionHead('IV.  PROGRAM FORMAT & STRUCTURE');

  page.drawText('1.  Classroom Training — Both Class A & Class B', { x: M, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  bullet('Duration: One week');
  bullet('Delivery Options: Online or in-person');
  bullet('Curriculum includes required FMCSA ELDT theory material, safety, regulations, and foundational knowledge.');
  gap(4);

  page.drawText('2.  Behind-the-Wheel, Range & Road Training', { x: M, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  bullet(`Class A CDL: Three weeks of range and road instruction, followed by a CDL skills test.`);
  bullet(`Class B CDL: One week of range and road instruction, followed by a CDL skills test.`);
  ruleGap();

  // ── V. Attendance & Conduct ──────────────────────────────────────────────────
  checkY(140);
  sectionHead('V.  ATTENDANCE & CONDUCT EXPECTATIONS');

  page.drawText('1.  Attendance Requirement', { x: M, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  bullet('Students may have no more than two absences during the program.');
  bullet('Exceeding the maximum absence limit may result in dismissal from the program.');
  gap(4);

  page.drawText('2.  Timeliness & Tardiness', { x: M, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  bullet('Training hours: Monday–Friday, 7:00 a.m. – 4:00 p.m.');
  bullet('Includes: One-hour lunch and two 15-minute breaks.');
  bullet('Students must arrive on time each day. Excessive tardiness may result in disciplinary action or removal from the program.');
  gap(4);

  // Note box
  checkY(40);
  page.drawRectangle({ x: M, y: y - 28, width: CW, height: 36, color: rgb(0.98, 0.96, 0.88), borderColor: rgb(0.85, 0.7, 0.3), borderWidth: 0.75 });
  page.drawText('NOTE:', { x: M + 8, y: y - 10, size: BODY, font: bold, color: rgb(0.55, 0.27, 0.07) });
  y = drawWrapped(
    page,
    'Transportation to and from CDL training each day must be provided by the student, employer, or agency funding training.',
    M + 48, y - 10, CW - 56, regular, BODY, LH
  );
  y -= 14;

  page.drawText('3.  Professional Conduct', { x: M, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  bullet('Students are expected to comply with all facility rules, safety guidelines, and instructor direction at all times.');
  ruleGap();

  // ── VI. Job Placement Support ────────────────────────────────────────────────
  checkY(100);
  sectionHead('VI.  JOB PLACEMENT SUPPORT');

  page.drawText('1.  Job Placement Coordination', { x: M, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  body(
    'Each student will be assigned support from a Job Placement Coordinator who will provide guidance on ' +
    'employment opportunities and carrier partnerships.',
    10
  );
  gap(4);

  page.drawText('2.  Career Preparation', { x: M, y, size: BODY, font: bold, color: rgb(0.15, 0.15, 0.15) });
  y -= LH;
  bullet('Students will be introduced to job opportunities beginning on day one of the program.');
  bullet('Representatives from partner carriers will regularly present to classes throughout training.');
  ruleGap();

  // ── VII. Drop & Dismissal Policy ────────────────────────────────────────────
  checkY(100);
  sectionHead('VII.  DROP & DISMISSAL POLICY');
  body('A student may be dismissed from the program for any of the following reasons:');
  bullet('Failure to meet attendance or timeliness requirements.');
  bullet('Insufficient progress or inability to meet skill requirements during training.');
  bullet('Failure or refusal of required drug screening.');
  bullet('Violation of safety rules or conduct standards, as determined by program leadership.');
  ruleGap();

  // ── VIII. Agreement & Acknowledgement ───────────────────────────────────────
  checkY(120);
  sectionHead('VIII.  AGREEMENT & ACKNOWLEDGEMENT');
  body(
    'By participating in this program, the student acknowledges and agrees to the terms, expectations, and ' +
    'responsibilities outlined in this Memorandum of Agreement.'
  );
  gap(4);
  body(
    'Companies, Employers, Agencies, and Funding Partners entering into this MOU alongside the student confirm ' +
    'that the individual enrolling has demonstrated a responsibility and willingness to uphold the requirements ' +
    'outlined in this document. By entering into this agreement, they are also assuming financial responsibility ' +
    'on behalf of the student receiving instruction and training.'
  );
  gap(6);

  // Referral note
  page.drawRectangle({ x: M, y: y - 22, width: CW, height: 28, color: rgb(0.93, 0.97, 0.93), borderColor: rgb(0.4, 0.72, 0.4), borderWidth: 0.75 });
  page.drawText('Funding referral partners will receive $195 per student class start.', {
    x: M + 10, y: y - 12, size: BODY, font: bold, color: rgb(0.15, 0.45, 0.15),
  });
  y -= 36;
  ruleGap();

  // ── Signature Page ───────────────────────────────────────────────────────────
  checkY(220);
  page.drawText('SIGNATURES', { x: M, y, size: 12, font: bold, color: SECTION_COLOR });
  y -= 20;

  const colW = (CW - 20) / 2;
  const col2X = M + colW + 20;

  // Column headers
  page.drawText('C1 TRUCK DRIVER TRAINING / ELEVATE FOR HUMANITY', {
    x: M, y, size: 7.5, font: bold, color: SECTION_COLOR,
  });
  const col2Label = data.signer_type === 'student'
    ? 'STUDENT'
    : data.signer_type === 'employer'
    ? 'EMPLOYER / COMPANY'
    : data.signer_type === 'agency'
    ? 'AGENCY / SPONSOR'
    : 'FUNDING PARTNER';
  page.drawText(col2Label, { x: col2X, y, size: 7.5, font: bold, color: rgb(0.75, 0.22, 0.17) });
  y -= 20;

  // Sponsor signature (italic script)
  page.drawText(SPONSOR_SIGNER, { x: M, y, size: 18, font: italic, color: rgb(0.1, 0.1, 0.18) });
  y -= 4;
  page.drawLine({ start: { x: M, y }, end: { x: M + colW, y }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });

  // Partner/student signature
  const sigY = y + 4;
  if (data.signature_data?.startsWith('data:image/')) {
    try {
      const base64 = data.signature_data.replace(/^data:image\/\w+;base64,/, '');
      const imgBytes = Buffer.from(base64, 'base64');
      const img = await doc.embedPng(imgBytes).catch(() => doc.embedJpg(imgBytes));
      page.drawImage(img, { x: col2X, y: sigY - 22, width: colW, height: 36 });
    } catch {
      page.drawText(data.signer_name, { x: col2X, y: sigY, size: 18, font: italic, color: rgb(0.1, 0.1, 0.18) });
    }
  } else {
    page.drawText(data.signer_name, { x: col2X, y: sigY, size: 18, font: italic, color: rgb(0.1, 0.1, 0.18) });
  }
  page.drawLine({ start: { x: col2X, y }, end: { x: col2X + colW, y }, thickness: 1, color: rgb(0.75, 0.22, 0.17) });

  y -= 14;
  page.drawText(`Name: ${SPONSOR_SIGNER}`, { x: M, y, size: BODY, font: regular, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Name: ${data.signer_name}`, { x: col2X, y, size: BODY, font: regular, color: rgb(0.2, 0.2, 0.2) });
  y -= LH;
  page.drawText(`Title: ${SPONSOR_TITLE}`, { x: M, y, size: BODY, font: regular, color: rgb(0.2, 0.2, 0.2) });
  if (data.signer_title) {
    page.drawText(`Title: ${data.signer_title}`, { x: col2X, y, size: BODY, font: regular, color: rgb(0.2, 0.2, 0.2) });
  }
  y -= LH;
  page.drawText(`Organization: ${SPONSOR}`, { x: M, y, size: 7, font: regular, color: rgb(0.4, 0.4, 0.4) });
  if (data.organization_name) {
    page.drawText(`Organization: ${data.organization_name}`, { x: col2X, y, size: BODY, font: regular, color: rgb(0.2, 0.2, 0.2) });
  }
  y -= LH;
  page.drawText(`Date: ${signedDate}`, { x: M, y, size: BODY, font: regular, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Date: ${signedDate}`, { x: col2X, y, size: BODY, font: regular, color: rgb(0.2, 0.2, 0.2) });

  // ── Footer ───────────────────────────────────────────────────────────────────
  y -= 28;
  rule();
  y -= 12;
  page.drawText(
    `Document ID: MOU-CDL-STU-${Date.now()}  ·  Signed: ${signedDate}  ·  IP: ${data.ip_address ?? 'on file'}`,
    { x: M, y, size: 7, font: regular, color: rgb(0.6, 0.6, 0.6) },
  );
  y -= 10;
  page.drawText(`${SPONSOR}  ·  ${ADDRESS}  ·  ${PHONE}  ·  ${EMAIL}`, {
    x: M, y, size: 7, font: regular, color: rgb(0.6, 0.6, 0.6),
  });
  y -= 10;
  page.drawText(
    'Executed electronically under the Indiana Uniform Electronic Transactions Act (IC 26-2-8) and the federal ESIGN Act.',
    { x: M, y, size: 7, font: italic, color: rgb(0.6, 0.6, 0.6) },
  );

  return doc.save();
}
