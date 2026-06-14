/**
 * Generates a signed MOU PDF for CDL training site partners.
 * CDL-specific: covers Class A/B licensing, DOT compliance, and
 * behind-the-wheel training site obligations.
 * Uses pdf-lib — runs in Node.js API routes only.
 */

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export type CDLMOUPDFData = {
  company_name: string;
  signer_name: string;
  signer_title: string;
  dot_number?: string;
  mc_number?: string;
  cdl_class?: 'A' | 'B' | 'C';
  training_site_address?: string;
  contact_email?: string;
  contact_phone?: string;
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

export async function generateCDLMOUPdf(data: CDLMOUPDFData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await doc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 60;
  const contentWidth = pageWidth - margin * 2;
  const lineH = 14;
  const cdlClass = data.cdl_class ?? 'A';
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

  // ── Header — dark orange/amber for CDL/transportation ────────────────────────
  page.drawRectangle({
    x: 0,
    y: pageHeight - 90,
    width: pageWidth,
    height: 90,
    color: rgb(0.55, 0.27, 0.07),
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
  page.drawText(`Technical and Career Institute  ·  CDL Class ${cdlClass} Training Program`, {
    x: textX,
    y: pageHeight - 54,
    size: 8,
    font: regularFont,
    color: rgb(1, 0.85, 0.65),
  });
  page.drawText(`${ADDRESS}  ·  ${PHONE}`, {
    x: textX,
    y: pageHeight - 68,
    size: 7.5,
    font: regularFont,
    color: rgb(0.95, 0.78, 0.55),
  });

  y = pageHeight - 100;

  // ── Title ───────────────────────────────────────────────────────────────────
  page.drawText('CDL TRAINING SITE', {
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
    color: rgb(0.55, 0.27, 0.07),
  });
  y -= 16;
  page.drawText(`Indiana CDL Class ${cdlClass} Apprenticeship & Training Partnership`, {
    x: margin,
    y,
    size: 11,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 12;
  page.drawText(
    `Version ${data.mou_version ?? '2025-cdl-01'}  ·  Effective: ${signedDate}`,
    { x: margin, y, size: 9, font: italicFont, color: rgb(0.5, 0.5, 0.5) },
  );
  y -= 20;
  drawLine(y);
  y -= 16;

  // ── Parties ─────────────────────────────────────────────────────────────────
  page.drawText('PARTIES', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.55, 0.27, 0.07),
  });
  y -= lineH;
  y = drawWrappedText(page, `Sponsor: ${SPONSOR}`, margin, y, contentWidth, regularFont, 9, lineH);
  y = drawWrappedText(
    page,
    `Training Site: ${data.company_name}${data.training_site_address ? ` — ${data.training_site_address}` : ''}`,
    margin,
    y,
    contentWidth,
    regularFont,
    9,
    lineH,
  );
  if (data.dot_number) {
    page.drawText(`DOT #: ${data.dot_number}${data.mc_number ? `  ·  MC #: ${data.mc_number}` : ''}`, {
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

  // ── Purpose ─────────────────────────────────────────────────────────────────
  checkY(80);
  page.drawText('PURPOSE', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.55, 0.27, 0.07),
  });
  y -= lineH;
  y = drawWrappedText(
    page,
    `This MOU establishes ${data.company_name} ("Training Site") as an approved behind-the-wheel and on-the-job training partner for ${PLATFORM_DEFAULTS.orgName}'s CDL Class ${cdlClass} program. The Training Site provides supervised driving hours, equipment access, and industry mentorship required for Indiana CDL licensure.`,
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

  // ── Training Site Obligations ────────────────────────────────────────────────
  checkY(140);
  page.drawText('TRAINING SITE OBLIGATIONS', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.55, 0.27, 0.07),
  });
  y -= lineH;

  const siteObligations = [
    `Provide access to Class ${cdlClass} commercial vehicles in safe, DOT-compliant operating condition.`,
    'Assign a qualified CDL holder (minimum 2 years experience) to supervise all behind-the-wheel training.',
    'Maintain current FMCSA operating authority and all required insurance during the term of this MOU.',
    'Log and certify trainee driving hours on Elevate-provided forms for state licensing submission.',
    'Comply with all applicable FMCSA, Indiana BMV, and DOT regulations during training activities.',
    'Notify Elevate immediately of any safety incidents, equipment failures, or regulatory actions.',
    'Not charge trainees directly for equipment use or supervision covered under this MOU.',
  ];

  for (const item of siteObligations) {
    checkY(20);
    y = drawWrappedText(page, `• ${item}`, margin + 10, y, contentWidth - 10, regularFont, 9, lineH);
    y -= 4;
  }
  y -= 6;
  drawLine(y);
  y -= 16;

  // ── Elevate Obligations ──────────────────────────────────────────────────────
  checkY(120);
  page.drawText('ELEVATE OBLIGATIONS', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.55, 0.27, 0.07),
  });
  y -= lineH;

  const elevateObligations = [
    'Provide classroom and pre-trip inspection instruction prior to behind-the-wheel placement.',
    'Screen trainees for eligibility (valid Indiana learner permit, medical certificate, drug screen).',
    'Coordinate scheduling with the Training Site to minimize operational disruption.',
    'Maintain liability insurance covering training activities and provide certificate upon request.',
    'Submit all required documentation to Indiana BMV for trainee licensing.',
    'Pay the Training Site the agreed equipment-use stipend per the attached rate schedule, if applicable.',
  ];

  for (const item of elevateObligations) {
    checkY(20);
    y = drawWrappedText(page, `• ${item}`, margin + 10, y, contentWidth - 10, regularFont, 9, lineH);
    y -= 4;
  }
  y -= 6;
  drawLine(y);
  y -= 16;

  // ── Compliance & Safety ──────────────────────────────────────────────────────
  checkY(100);
  page.drawText('COMPLIANCE & SAFETY', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.55, 0.27, 0.07),
  });
  y -= lineH;
  y = drawWrappedText(
    page,
    'All training activities must comply with 49 CFR Parts 380–384 (FMCSA Entry-Level Driver Training rules), Indiana Code IC 9-24, and applicable OSHA standards. The Training Site must maintain a current DOT drug and alcohol testing program. Trainees are subject to pre-employment drug screening before any behind-the-wheel activity.',
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

  // ── Term ─────────────────────────────────────────────────────────────────────
  checkY(60);
  page.drawText('TERM', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.55, 0.27, 0.07),
  });
  y -= lineH;
  y = drawWrappedText(
    page,
    `Effective ${signedDate}. Renews annually unless terminated by either party with 30 days written notice. Either party may terminate immediately for safety violations or regulatory non-compliance.`,
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
    color: rgb(0.55, 0.27, 0.07),
  });
  y -= 20;

  const colW = (contentWidth - 20) / 2;
  const col2X = margin + colW + 20;

  page.drawText('SPONSOR', {
    x: margin,
    y,
    size: 9,
    font: boldFont,
    color: rgb(0.55, 0.27, 0.07),
  });
  page.drawText('CDL TRAINING SITE', {
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

  // Training site signature
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
  page.drawText(`Organization: ${data.company_name}`, { x: col2X, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  y -= lineH;
  page.drawText(`Date: ${signedDate}`, { x: margin, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Date: ${signedDate}`, { x: col2X, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });

  // ── Footer ───────────────────────────────────────────────────────────────────
  y -= 30;
  drawLine(y);
  y -= 12;
  page.drawText(
    `Document ID: MOU-CDL-${Date.now()}  ·  Signed: ${signedDate}  ·  IP: ${data.ip_address ?? 'on file'}`,
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
