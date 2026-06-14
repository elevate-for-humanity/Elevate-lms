/**
 * Generates a detailed multi-program MOU PDF for complex partner agreements.
 * Used when a single partner covers multiple programs, has revenue-share terms,
 * or requires FSSA/WIOA-specific compliance language.
 * Uses pdf-lib — runs in Node.js API routes only.
 */

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export type ProgramTerm = {
  program_name: string;
  credential: string;
  duration: string;
  weekly_hours: number;
  tuition: number;
  partner_share_pct?: number; // e.g. 33 for 1/3
};

export type DetailedMOUPDFData = {
  partner_name: string;
  partner_role: string; // e.g. 'Program Delivery Partner', 'Employer Training Site'
  signer_name: string;
  signer_title: string;
  contact_email?: string;
  contact_phone?: string;
  partner_address?: string;
  partner_ein?: string;
  programs: ProgramTerm[];
  revenue_share_model?: string; // narrative description
  fssa_snap_et?: boolean;       // include SNAP E&T compliance language
  wioa_eligible?: boolean;      // include WIOA language
  signed_at: string;
  signature_data?: string;      // base64 PNG data URL
  ip_address?: string;
  mou_version?: string;
};

const SPONSOR = '2Exclusive LLC-S (DBA: ' + PLATFORM_DEFAULTS.orgName + ' Technical and Career Institute)';
const SPONSOR_SIGNER = 'Elizabeth Greene';
const SPONSOR_TITLE = 'Founder & Chief Executive Officer';
const ADDRESS = '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240';
const PHONE = PLATFORM_DEFAULTS.supportPhone;
const EMAIL = 'elevate4humanityedu@gmail.com';

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current: string;
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

function wrappedLineCount(text: string, maxWidth: number, font: PDFFont, fontSize: number): number {
  return wrapText(text, maxWidth, font, fontSize).length;
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: PDFFont,
  fontSize: number,
  lineHeight: number,
  color = rgb(0, 0, 0),
): number {
  const lines = wrapText(text, maxWidth, font, fontSize);
  for (const line of lines) {
    page.drawText(line, { x, y, size: fontSize, font, color });
    y -= lineHeight;
  }
  return y;
}

function drawLabelValue(
  page: PDFPage,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  labelFont: PDFFont,
  valueFont: PDFFont,
  fontSize: number,
  lineHeight: number,
): number {
  page.drawText(label, { x, y, size: fontSize, font: labelFont, color: rgb(0.25, 0.25, 0.25) });
  y -= lineHeight - 1;
  return drawWrappedText(page, value, x + 8, y, maxWidth - 8, valueFont, fontSize, lineHeight, rgb(0.1, 0.1, 0.1));
}

import { formatCurrency } from '@/lib/format';

export async function generateDetailedMOUPdf(data: DetailedMOUPDFData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await doc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 60;
  const contentWidth = pageWidth - margin * 2;
  const lineH = 14;
  const signedDate = new Date(data.signed_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const newPage = () => {
    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const checkY = (needed = 60) => {
    if (y < margin + needed) newPage();
  };

  const drawLine = (yPos: number) => {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: pageWidth - margin, y: yPos },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
  };

  // ── Header ──────────────────────────────────────────────────────────────────
  page.drawRectangle({
    x: 0,
    y: pageHeight - 90,
    width: pageWidth,
    height: 90,
    color: rgb(0.08, 0.22, 0.48),
  });

  let logoEmbedded = false;
  try {
    const fs = await import('fs');
    const path = await import('path');
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImg = await doc.embedPng(logoBytes).catch(() => null);
      if (logoImg) {
        const logoDims = logoImg.scale(0.18);
        page.drawImage(logoImg, {
          x: margin,
          y: pageHeight - 80,
          width: logoDims.width,
          height: logoDims.height,
        });
        logoEmbedded = true;
      }
    }
  } catch {
    /* fall back to text */
  }

  const textX = logoEmbedded ? margin + 120 : margin;
  page.drawText('ELEVATE FOR HUMANITY', {
    x: textX,
    y: pageHeight - 38,
    size: 15,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  page.drawText('Technical and Career Institute  ·  Multi-Program Partnership Agreement', {
    x: textX,
    y: pageHeight - 54,
    size: 8,
    font: regularFont,
    color: rgb(0.7, 0.82, 1),
  });
  page.drawText(`${ADDRESS}  ·  ${PHONE}`, {
    x: textX,
    y: pageHeight - 68,
    size: 7.5,
    font: regularFont,
    color: rgb(0.6, 0.75, 0.95),
  });

  y = pageHeight - 100;

  // ── Title ───────────────────────────────────────────────────────────────────
  page.drawText(data.partner_role.toUpperCase(), {
    x: margin,
    y,
    size: 11,
    font: boldFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 18;
  page.drawText('Memorandum of Understanding', {
    x: margin,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0.08, 0.22, 0.48),
  });
  y -= 16;
  page.drawText('Multi-Program Workforce Development Partnership', {
    x: margin,
    y,
    size: 11,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 12;
  page.drawText(
    `Version ${data.mou_version ?? '2025-detailed-01'}  ·  Effective: ${signedDate}`,
    { x: margin, y, size: 9, font: italicFont, color: rgb(0.5, 0.5, 0.5) },
  );
  y -= 20;
  drawLine(y);
  y -= 16;

  // ── Parties ─────────────────────────────────────────────────────────────────
  page.drawText('PARTIES', { x: margin, y, size: 10, font: boldFont, color: rgb(0.08, 0.22, 0.48) });
  y -= lineH;
  y = drawWrappedText(page, `Sponsor: ${SPONSOR}`, margin, y, contentWidth, regularFont, 9, lineH);
  y = drawWrappedText(
    page,
    `Partner: ${data.partner_name} (${data.partner_role})`,
    margin,
    y,
    contentWidth,
    regularFont,
    9,
    lineH,
  );
  if (data.partner_address) {
    y = drawWrappedText(
      page,
      `Partner address: ${data.partner_address}`,
      margin,
      y,
      contentWidth,
      regularFont,
      9,
      lineH,
      rgb(0.3, 0.3, 0.3),
    );
  }
  if (data.partner_ein) {
    page.drawText(`Partner EIN: ${data.partner_ein}`, {
      x: margin,
      y,
      size: 9,
      font: regularFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= lineH;
  }
  if (data.contact_email) {
    const contactLine = `Authorized contact: ${data.signer_name} · ${data.contact_email}${data.contact_phone ? ` · ${data.contact_phone}` : ''}`;
    y = drawWrappedText(page, contactLine, margin, y, contentWidth, regularFont, 9, lineH, rgb(0.3, 0.3, 0.3));
  }
  y -= 6;
  drawLine(y);
  y -= 16;

  // ── Programs Covered (stacked schedule — no column overlap) ───────────────
  page.drawText('PROGRAMS COVERED UNDER THIS MOU', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.08, 0.22, 0.48),
  });
  y -= lineH + 2;
  y = drawWrappedText(
    page,
    'The following training programs are delivered by the Partner under this agreement. Each program is listed separately to avoid ambiguity in credentialing, hours, and tuition.',
    margin,
    y,
    contentWidth,
    regularFont,
    8.5,
    12,
    rgb(0.4, 0.4, 0.4),
  );
  y -= 8;

  const programBlockPadding = 8;
  const programInnerWidth = contentWidth - programBlockPadding * 2;

  for (let i = 0; i < data.programs.length; i++) {
    const prog = data.programs[i];
    const nameLines = wrappedLineCount(prog.program_name, programInnerWidth - 14, boldFont, 9);
    const credLines = wrappedLineCount(prog.credential, programInnerWidth - 8, regularFont, 8.5);
    const durLines = wrappedLineCount(prog.duration, programInnerWidth - 8, regularFont, 8.5);
    const blockHeight =
      programBlockPadding * 2 +
      12 +
      nameLines * 12 +
      11 +
      credLines * 11 +
      11 +
      durLines * 11 +
      18;

    checkY(blockHeight + 12);

    const blockTop = y;
    const blockBottom = y - blockHeight;
    page.drawRectangle({
      x: margin,
      y: blockBottom,
      width: contentWidth,
      height: blockHeight,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 0.75,
    });

    let innerY = blockTop - 12;
    page.drawText(`${i + 1}.`, {
      x: margin + programBlockPadding,
      y: innerY,
      size: 9,
      font: boldFont,
      color: rgb(0.08, 0.22, 0.48),
    });
    innerY = drawWrappedText(
      page,
      prog.program_name,
      margin + programBlockPadding + 14,
      innerY,
      programInnerWidth - 14,
      boldFont,
      9,
      12,
      rgb(0.1, 0.1, 0.1),
    );
    innerY -= 2;
    innerY = drawLabelValue(
      page,
      'Credential',
      prog.credential,
      margin + programBlockPadding,
      innerY,
      programInnerWidth,
      boldFont,
      regularFont,
      8.5,
      11,
    );
    innerY = drawLabelValue(
      page,
      'Duration',
      prog.duration,
      margin + programBlockPadding,
      innerY,
      programInnerWidth,
      boldFont,
      regularFont,
      8.5,
      11,
    );
    const hrsTuition = `Weekly hours: ${prog.weekly_hours > 0 ? prog.weekly_hours : 'Per program schedule'}   ·   Tuition: ${formatCurrency(prog.tuition)}`;
    page.drawText(hrsTuition, {
      x: margin + programBlockPadding,
      y: innerY - 11,
      size: 8.5,
      font: regularFont,
      color: rgb(0.35, 0.35, 0.35),
    });

    y = blockBottom - 10;
  }

  y -= 4;
  drawLine(y);
  y -= 16;

  // ── Revenue Share ────────────────────────────────────────────────────────────
  if (data.revenue_share_model) {
    checkY(80);
    page.drawText('COMPENSATION MODEL', {
      x: margin,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.08, 0.22, 0.48),
    });
    y -= lineH;
    y = drawWrappedText(page, data.revenue_share_model, margin, y, contentWidth, regularFont, 9, lineH);

    // Per-program share breakdown
    const programsWithShare = data.programs.filter((p) => p.partner_share_pct);
    if (programsWithShare.length > 0) {
      y -= 6;
      page.drawText('Partner share by program (illustrative — based on actual enrolled participants):', {
        x: margin,
        y,
        size: 8,
        font: italicFont,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= lineH;
      for (const prog of programsWithShare) {
        checkY(28);
        const share = (prog.partner_share_pct! / 100) * prog.tuition;
        y = drawWrappedText(
          page,
          `• ${prog.program_name}: ${prog.partner_share_pct}% of net tuition per enrolled participant (≈ ${formatCurrency(share)}/student at full tuition)`,
          margin + 10,
          y,
          contentWidth - 10,
          regularFont,
          8,
          11,
          rgb(0.2, 0.2, 0.2),
        );
      }
      y -= 4;
      y = drawWrappedText(
        page,
        'IMPORTANT: Amounts above are examples only. Actual compensation is based on participants enrolled and tuition collected.',
        margin,
        y,
        contentWidth,
        italicFont,
        7.5,
        10,
        rgb(0.6, 0.2, 0.2),
      );
    }
    y -= 6;
    drawLine(y);
    y -= 16;
  }

  // ── SNAP E&T Compliance (conditional) ────────────────────────────────────────
  if (data.fssa_snap_et) {
    checkY(100);
    page.drawText('SNAP E&T / FSSA COMPLIANCE', {
      x: margin,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.08, 0.22, 0.48),
    });
    y -= lineH;
    y = drawWrappedText(
      page,
      'Programs delivered under this MOU may serve SNAP recipients referred through Indiana FSSA/DFR under the SNAP Employment & Training (IMPACT) program. The Partner agrees to: (1) maintain attendance records in the format required by FSSA; (2) report participant hours weekly; (3) cooperate with FSSA monitoring visits; (4) not charge SNAP participants fees beyond those approved by FSSA; and (5) comply with all applicable SNAP E&T regulations (7 CFR Part 273.7).',
      margin,
      y,
      contentWidth,
      regularFont,
      9,
      lineH,
    );
    y -= 10;
    drawLine(y);
    y -= 16;
  }

  // ── WIOA (conditional) ───────────────────────────────────────────────────────
  if (data.wioa_eligible) {
    checkY(80);
    page.drawText('WIOA TITLE I COMPLIANCE', {
      x: margin,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.08, 0.22, 0.48),
    });
    y -= lineH;
    y = drawWrappedText(
      page,
      'Programs listed herein are or may be submitted to the Indiana ETPL (Eligible Training Provider List) under WIOA Title I. The Partner agrees to cooperate with performance data reporting requirements, including credential attainment, employment, and wage outcomes, as required by the Indiana Department of Workforce Development.',
      margin,
      y,
      contentWidth,
      regularFont,
      9,
      lineH,
    );
    y -= 10;
    drawLine(y);
    y -= 16;
  }

  // ── General Terms ────────────────────────────────────────────────────────────
  checkY(120);
  page.drawText('GENERAL TERMS', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.08, 0.22, 0.48),
  });
  y -= lineH;

  const generalTerms = [
    'This MOU does not create an employment relationship between the parties.',
    'Either party may terminate with 30 days written notice; immediate termination for material breach.',
    'Disputes shall be resolved by good-faith negotiation; Indiana law governs.',
    'Student PII is protected under FERPA and applicable Indiana privacy law.',
    'This MOU supersedes all prior oral or written agreements on the same subject matter.',
  ];

  for (const term of generalTerms) {
    checkY(20);
    y = drawWrappedText(page, `• ${term}`, margin + 10, y, contentWidth - 10, regularFont, 9, lineH);
    y -= 4;
  }
  y -= 6;
  drawLine(y);
  y -= 16;

  // ── Signature Page ───────────────────────────────────────────────────────────
  checkY(220);
  if (y < margin + 220) {
    newPage();
    y -= 10;
  }
  drawLine(y);
  y -= 20;
  page.drawText('SIGNATURES', {
    x: margin,
    y,
    size: 12,
    font: boldFont,
    color: rgb(0.08, 0.22, 0.48),
  });
  y -= 20;

  const colW = (contentWidth - 20) / 2;
  const col2X = margin + colW + 20;

  page.drawText('SPONSOR', { x: margin, y, size: 9, font: boldFont, color: rgb(0.08, 0.22, 0.48) });
  page.drawText('PARTNER', { x: col2X, y, size: 9, font: boldFont, color: rgb(0.75, 0.22, 0.17) });
  y -= 16;

  // Sponsor signature
  page.drawText(SPONSOR_SIGNER, {
    x: margin,
    y,
    size: 18,
    font: italicFont,
    color: rgb(0.1, 0.1, 0.18),
  });
  y -= 4;
  page.drawLine({
    start: { x: margin, y },
    end: { x: margin + colW, y },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Partner signature
  if (data.signature_data?.startsWith('data:image/')) {
    try {
      const base64 = data.signature_data.replace(/^data:image\/\w+;base64,/, '');
      const imgBytes = Buffer.from(base64, 'base64');
      const img = await doc.embedPng(imgBytes).catch(() => doc.embedJpg(imgBytes));
      page.drawImage(img, { x: col2X, y: y - 20, width: colW, height: 36 });
    } catch {
      page.drawText(data.signer_name, {
        x: col2X,
        y,
        size: 18,
        font: italicFont,
        color: rgb(0.1, 0.1, 0.18),
      });
    }
  } else {
    page.drawText(data.signer_name, {
      x: col2X,
      y,
      size: 18,
      font: italicFont,
      color: rgb(0.1, 0.1, 0.18),
    });
  }
  y -= 4;
  page.drawLine({
    start: { x: col2X, y },
    end: { x: col2X + colW, y },
    thickness: 1,
    color: rgb(0.75, 0.22, 0.17),
  });

  y -= 14;
  page.drawText(`Name: ${SPONSOR_SIGNER}`, { x: margin, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Name: ${data.signer_name}`, { x: col2X, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  y -= lineH;
  page.drawText(`Title: ${SPONSOR_TITLE}`, { x: margin, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Title: ${data.signer_title}`, { x: col2X, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  y -= lineH;
  const orgY = y;
  page.drawText('Organization:', { x: margin, y: orgY, size: 8, font: boldFont, color: rgb(0.35, 0.35, 0.35) });
  page.drawText('Organization:', { x: col2X, y: orgY, size: 8, font: boldFont, color: rgb(0.35, 0.35, 0.35) });
  y -= lineH;
  const sponsorOrgY = drawWrappedText(
    page,
    SPONSOR,
    margin,
    y,
    colW,
    regularFont,
    7.5,
    10,
    rgb(0.4, 0.4, 0.4),
  );
  const partnerOrgY = drawWrappedText(
    page,
    data.partner_name,
    col2X,
    y,
    colW,
    regularFont,
    8.5,
    10,
    rgb(0.2, 0.2, 0.2),
  );
  y = Math.min(sponsorOrgY, partnerOrgY) - 4;
  page.drawText(`Date: ${signedDate}`, { x: margin, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Date: ${signedDate}`, { x: col2X, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });

  // ── Footer ───────────────────────────────────────────────────────────────────
  checkY(50);
  y -= 24;
  drawLine(y);
  y -= 12;
  y = drawWrappedText(
    page,
    `Document ID: MOU-DTL-${Date.now()} · Effective: ${signedDate} · IP: ${data.ip_address ?? 'on file'}`,
    margin,
    y,
    contentWidth,
    regularFont,
    7,
    9,
    rgb(0.6, 0.6, 0.6),
  );
  y = drawWrappedText(
    page,
    `${SPONSOR} · ${ADDRESS} · ${PHONE} · ${EMAIL}`,
    margin,
    y,
    contentWidth,
    regularFont,
    7,
    9,
    rgb(0.6, 0.6, 0.6),
  );
  drawWrappedText(
    page,
    'Executed electronically under the Indiana Uniform Electronic Transactions Act (IC 26-2-8) and the federal ESIGN Act.',
    margin,
    y,
    contentWidth,
    italicFont,
    7,
    9,
    rgb(0.6, 0.6, 0.6),
  );

  return doc.save();
}
