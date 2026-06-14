/**
 * Generates a signed MOU PDF for general employer partners.
 * Used for non-apprenticeship employer hiring agreements.
 * Uses pdf-lib — runs in Node.js API routes only.
 */

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export type EmployerMOUPDFData = {
  employer_name: string;
  signer_name: string;
  signer_title: string;
  contact_email?: string;
  contact_phone?: string;
  industry?: string;
  city?: string;
  state?: string;
  programs?: string[];       // program names covered by this MOU
  signed_at: string;
  signature_data?: string;   // base64 PNG data URL
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

export async function generateEmployerMOUPdf(data: EmployerMOUPDFData): Promise<Uint8Array> {
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
  page.drawText('Technical and Career Institute  ·  Workforce Development Partner', {
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
  page.drawText('EMPLOYER PARTNERSHIP', {
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
  page.drawText('Workforce Development & Graduate Hiring Agreement', {
    x: margin,
    y,
    size: 11,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 12;
  page.drawText(
    `Version ${data.mou_version || '2025-employer-01'}  ·  Effective: ${signedDate}`,
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
    `Employer Partner: ${data.employer_name}${data.city ? `, ${data.city}` : ''}${data.state ? `, ${data.state}` : ''}`,
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

  // ── Purpose ─────────────────────────────────────────────────────────────────
  checkY(80);
  page.drawText('PURPOSE', { x: margin, y, size: 10, font: boldFont, color: rgb(0.08, 0.22, 0.48) });
  y -= lineH;
  y = drawWrappedText(
    page,
    `This Memorandum of Understanding ("MOU") establishes a formal partnership between ${PLATFORM_DEFAULTS.orgLegalName} ("Elevate") and ${data.employer_name} ("Employer") to support workforce development, graduate hiring, and career pathway programs in the Indianapolis metropolitan area.`,
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

  // ── Programs Covered ─────────────────────────────────────────────────────────
  if (data.programs && data.programs.length > 0) {
    checkY(60);
    page.drawText('PROGRAMS COVERED', {
      x: margin,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.08, 0.22, 0.48),
    });
    y -= lineH;
    for (const program of data.programs) {
      checkY(20);
      page.drawText(`• ${program}`, { x: margin + 10, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
      y -= lineH;
    }
    y -= 6;
    drawLine(y);
    y -= 16;
  }

  // ── Employer Commitments ─────────────────────────────────────────────────────
  checkY(120);
  page.drawText('EMPLOYER COMMITMENTS', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.08, 0.22, 0.48),
  });
  y -= lineH;

  const employerCommitments = [
    'Consider qualified Elevate graduates for open positions in relevant fields.',
    'Provide timely feedback on candidate qualifications and hiring outcomes.',
    'Participate in job fairs, mock interviews, or career panels when available.',
    'Notify Elevate of relevant job openings to share with program graduates.',
    'Maintain a non-discriminatory hiring process consistent with applicable law.',
  ];

  for (const item of employerCommitments) {
    checkY(20);
    y = drawWrappedText(page, `• ${item}`, margin + 10, y, contentWidth - 10, regularFont, 9, lineH);
    y -= 4;
  }
  y -= 6;
  drawLine(y);
  y -= 16;

  // ── Elevate Commitments ──────────────────────────────────────────────────────
  checkY(120);
  page.drawText('ELEVATE COMMITMENTS', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.08, 0.22, 0.48),
  });
  y -= lineH;

  const elevateCommitments = [
    'Provide industry-aligned training that meets employer skill requirements.',
    'Share graduate profiles and credentials with the Employer upon request.',
    'Coordinate with the Employer on curriculum alignment and skill gap feedback.',
    'Maintain program quality standards and credential integrity.',
    'Serve as a long-term workforce pipeline partner for the Employer.',
  ];

  for (const item of elevateCommitments) {
    checkY(20);
    y = drawWrappedText(page, `• ${item}`, margin + 10, y, contentWidth - 10, regularFont, 9, lineH);
    y -= 4;
  }
  y -= 6;
  drawLine(y);
  y -= 16;

  // ── Term & Termination ───────────────────────────────────────────────────────
  checkY(80);
  page.drawText('TERM & TERMINATION', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.08, 0.22, 0.48),
  });
  y -= lineH;
  y = drawWrappedText(
    page,
    `This MOU is effective as of ${signedDate} and remains in effect for one (1) year, automatically renewing annually unless terminated by either party with thirty (30) days written notice. This MOU does not create an employment relationship, guarantee hiring, or obligate financial compensation between the parties.`,
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

  // ── Confidentiality ──────────────────────────────────────────────────────────
  checkY(60);
  page.drawText('CONFIDENTIALITY', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.08, 0.22, 0.48),
  });
  y -= lineH;
  y = drawWrappedText(
    page,
    'Both parties agree to maintain the confidentiality of student/candidate personally identifiable information (PII) in accordance with FERPA, applicable Indiana law, and their respective privacy policies. Neither party shall disclose the other\'s proprietary information without prior written consent.',
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
  page.drawText('EMPLOYER PARTNER', {
    x: col2X,
    y,
    size: 9,
    font: boldFont,
    color: rgb(0.75, 0.22, 0.17),
  });
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

  // Employer signature
  if (data.signature_data && data.signature_data.startsWith('data:image/')) {
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
  page.drawText(`Organization: ${data.employer_name}`, { x: col2X, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  y -= lineH;
  page.drawText(`Date: ${signedDate}`, { x: margin, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Date: ${signedDate}`, { x: col2X, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });

  if (data.contact_email) {
    y -= lineH;
    page.drawText(`Email: ${data.contact_email}`, { x: col2X, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  y -= 30;
  drawLine(y);
  y -= 12;
  page.drawText(
    `Document ID: MOU-EMP-${Date.now()}  ·  Signed: ${signedDate}  ·  IP: ${data.ip_address || 'on file'}`,
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
    'This document was executed electronically under the Indiana Uniform Electronic Transactions Act (IC 26-2-8) and the federal ESIGN Act.',
    { x: margin, y, size: 7, font: italicFont, color: rgb(0.6, 0.6, 0.6) },
  );

  return doc.save();
}
