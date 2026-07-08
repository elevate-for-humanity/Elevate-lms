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

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents);
}

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
  if (data.contact_email) {
    page.drawText(`Contact: ${data.signer_name}  ·  ${data.contact_email}${data.contact_phone ? `  ·  ${data.contact_phone}` : ''}`, {
      x: margin,
      y,
      size: 9,
      font: regularFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= lineH;
  }
  y -= 6;
  drawLine(y);
  y -= 16;

  // ── Programs Covered ─────────────────────────────────────────────────────────
  checkY(60 + data.programs.length * 30);
  page.drawText('PROGRAMS COVERED UNDER THIS MOU', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.08, 0.22, 0.48),
  });
  y -= lineH + 4;

  // Table header
  const col1 = margin;
  const col2 = margin + 160;
  const col3 = margin + 280;
  const col4 = margin + 360;
  const col5 = margin + 430;

  page.drawText('Program', { x: col1, y, size: 8, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Credential', { x: col2, y, size: 8, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Duration', { x: col3, y, size: 8, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Hrs/Wk', { x: col4, y, size: 8, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Tuition', { x: col5, y, size: 8, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  y -= 4;
  drawLine(y);
  y -= lineH;

  for (const prog of data.programs) {
    checkY(20);
    page.drawText(prog.program_name, { x: col1, y, size: 8, font: regularFont, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(prog.credential, { x: col2, y, size: 8, font: regularFont, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(prog.duration, { x: col3, y, size: 8, font: regularFont, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(String(prog.weekly_hours), { x: col4, y, size: 8, font: regularFont, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(formatCurrency(prog.tuition), { x: col5, y, size: 8, font: regularFont, color: rgb(0.1, 0.1, 0.1) });
    y -= lineH;
  }
  y -= 6;
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
        checkY(16);
        const share = ((prog.partner_share_pct! / 100) * prog.tuition);
        page.drawText(
          `• ${prog.program_name}: ${prog.partner_share_pct}% of net tuition per enrolled participant (≈ ${formatCurrency(share)}/student at full tuition)`,
          { x: margin + 10, y, size: 8, font: regularFont, color: rgb(0.2, 0.2, 0.2) },
        );
        y -= lineH;
      }
      y -= 4;
      page.drawText(
        'IMPORTANT: Amounts above are examples only. Actual compensation is based on participants enrolled and tuition collected.',
        { x: margin, y, size: 7.5, font: italicFont, color: rgb(0.6, 0.2, 0.2) },
      );
      y -= lineH;
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
  checkY(200);
  y -= 10;
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
  page.drawText(`Organization: ${SPONSOR}`, { x: margin, y, size: 7, font: regularFont, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(`Organization: ${data.partner_name}`, { x: col2X, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  y -= lineH;
  page.drawText(`Date: ${signedDate}`, { x: margin, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Date: ${signedDate}`, { x: col2X, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });

  // ── Footer ───────────────────────────────────────────────────────────────────
  y -= 30;
  drawLine(y);
  y -= 12;
  page.drawText(
    `Document ID: MOU-DTL-${Date.now()}  ·  Signed: ${signedDate}  ·  IP: ${data.ip_address ?? 'on file'}`,
    { x: margin, y, size: 7, font: regularFont, color: rgb(0.6, 0.6, 0.6) },
  );
  y -= 10;
  page.drawText(`${SPONSOR}  ·  ${ADDRESS}  ·  ${PHONE}  ·  ${EMAIL}`, {
    x: margin,
    y,
    size: 7,
    font: regularFont,
    color: rgb(0.6, 0.6, 0.6),
  });
  y -= 10;
  page.drawText(
    'Executed electronically under the Indiana Uniform Electronic Transactions Act (IC 26-2-8) and the federal ESIGN Act.',
    { x: margin, y, size: 7, font: italicFont, color: rgb(0.6, 0.6, 0.6) },
  );

  return doc.save();
}
