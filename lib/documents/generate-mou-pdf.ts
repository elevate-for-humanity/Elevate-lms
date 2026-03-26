/**
 * Generates a signed MOU PDF for barbershop apprenticeship partners.
 * Uses pdf-lib — no browser required, runs in Node.js API routes.
 */

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';

export type MOUPDFData = {
  shop_name: string;
  signer_name: string;
  signer_title: string;
  supervisor_name?: string;
  supervisor_license?: string;
  compensation_model?: string;
  compensation_rate?: string;
  signed_at: string;
  signature_data?: string; // base64 PNG data URL
  ip_address?: string;
  mou_version?: string;
};

const SPONSOR = '2Exclusive LLC-S (DBA: Elevate for Humanity Technical and Career Institute)';
const SPONSOR_SIGNER = 'Elizabeth Greene';
const SPONSOR_TITLE = 'Founder & Chief Executive Officer';
const RAPIDS = '2025-IN-132301';
const CAGE = '0QH19';
const UEI = 'VX2GK5S8SZH8';
const ADDRESS = '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240';
const PHONE = '(317) 314-3757';

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
  color = rgb(0, 0, 0)
): number {
  const lines = wrapText(text, maxWidth, font, fontSize);
  for (const line of lines) {
    page.drawText(line, { x, y, size: fontSize, font, color });
    y -= lineHeight;
  }
  return y;
}

export async function generateMOUPdf(data: MOUPDFData): Promise<Uint8Array> {
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
    year: 'numeric', month: 'long', day: 'numeric',
  });

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const newPage = () => {
    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const checkY = (needed = 60) => { if (y < margin + needed) newPage(); };

  const drawLine = (yPos: number) => {
    page.drawLine({ start: { x: margin, y: yPos }, end: { x: pageWidth - margin, y: yPos }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
  };

  // ── Header ──────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: pageHeight - 80, width: pageWidth, height: 80, color: rgb(0.1, 0.1, 0.18) });
  page.drawText('ELEVATE FOR HUMANITY', { x: margin, y: pageHeight - 35, size: 16, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('Technical and Career Institute  ·  DOL Registered Apprenticeship', { x: margin, y: pageHeight - 52, size: 9, font: regularFont, color: rgb(0.7, 0.7, 0.7) });
  page.drawText(`RAPIDS: ${RAPIDS}  ·  CAGE: ${CAGE}  ·  UEI: ${UEI}`, { x: margin, y: pageHeight - 66, size: 8, font: regularFont, color: rgb(0.6, 0.6, 0.6) });

  y = pageHeight - 100;

  // ── Title ───────────────────────────────────────────────────────────────────
  page.drawText('EMPLOYER TRAINING SITE', { x: margin, y, size: 11, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
  y -= 18;
  page.drawText('Memorandum of Understanding', { x: margin, y, size: 18, font: boldFont, color: rgb(0.1, 0.1, 0.18) });
  y -= 16;
  page.drawText('Barber Apprenticeship Program', { x: margin, y, size: 11, font: regularFont, color: rgb(0.3, 0.3, 0.3) });
  y -= 12;
  page.drawText(`Version ${data.mou_version || '2.0'}  ·  Effective: ${signedDate}`, { x: margin, y, size: 9, font: italicFont, color: rgb(0.5, 0.5, 0.5) });
  y -= 20;
  drawLine(y);
  y -= 16;

  // ── Parties ─────────────────────────────────────────────────────────────────
  page.drawText('PARTIES', { x: margin, y, size: 10, font: boldFont, color: rgb(0.1, 0.1, 0.18) });
  y -= lineH;
  y = drawWrappedText(page, `Sponsor: ${SPONSOR}`, margin, y, contentWidth, regularFont, 9, lineH);
  y = drawWrappedText(page, `Employer Training Site: ${data.shop_name}`, margin, y, contentWidth, regularFont, 9, lineH);
  y -= 8;

  // ── MOU Sections ────────────────────────────────────────────────────────────
  const sections = [
    {
      title: '1. Purpose',
      body: `This MOU establishes the terms under which ${data.shop_name} ("Employer") will serve as a training site for the DOL Registered Barber Apprenticeship Program sponsored by ${SPONSOR} ("Sponsor"), RAPIDS Program No. ${RAPIDS}, governed by 29 CFR Parts 29 and 30.`,
    },
    {
      title: '2. Employer Responsibilities',
      body: `The Employer agrees to: (a) Provide 2,000 hours/year of On-the-Job Learning (OJL) per apprentice; (b) Assign a licensed Indiana journeyperson barber as mentor (max 1:4 ratio); (c) Maintain a current Indiana Barber Shop License throughout the term; (d) Pay apprentices per the progressive wage schedule in the Standards of Apprenticeship; (e) Submit monthly OJL hour reports to the Sponsor; (f) Provide full copies of all barber licenses upon request; (g) Comply with 29 CFR Part 30 equal opportunity requirements; (h) Notify Sponsor within 5 business days of any apprentice status change; (i) Allow DOL and Sponsor audits of the training site.`,
    },
    {
      title: '3. Sponsor Responsibilities',
      body: `The Sponsor agrees to: (a) Recruit, screen, and enroll qualified apprentice candidates; (b) Provide all Related Technical Instruction (RTI) — minimum 144 hours/year; (c) Register each apprentice in RAPIDS within 30 days of enrollment; (d) Provide ongoing case management and compliance support; (e) Issue Certificates of Completion upon program completion; (f) Handle all WIOA, WRG, and grant compliance reporting.`,
    },
    {
      title: '4. Supervising Barber',
      body: `Primary Supervising Barber: ${data.supervisor_name || 'As designated by Employer'}. Indiana Barber License: ${data.supervisor_license || 'On file'}. The supervising barber must hold a current Indiana journeyperson barber license throughout the term of this MOU.`,
    },
    {
      title: '5. Compensation',
      body: `Compensation Model: ${data.compensation_model || 'As agreed'}. Rate: ${data.compensation_rate || 'Per Standards of Apprenticeship progressive wage schedule'}. Apprentices must be paid no less than Indiana minimum wage ($7.25/hr). Commission models must average at least minimum wage per pay period. Apprentices keep 100% of tips.`,
    },
    {
      title: '6. Term & Termination',
      body: `This MOU is effective from the date signed and continues until the apprentice completes the program, withdraws, or the agreement is terminated. Either party may terminate with 30 days written notice. The Sponsor may terminate immediately for cause including: license revocation, failure to pay apprentice wages, unsafe working conditions, or material breach of DOL Standards of Apprenticeship.`,
    },
    {
      title: '7. Equal Opportunity',
      body: `Both parties agree to provide equal opportunity without discrimination based on race, color, religion, national origin, sex, sexual orientation, age, or disability, in accordance with 29 CFR Part 30 and all applicable federal and state laws.`,
    },
    {
      title: '8. Governing Law',
      body: `This MOU is governed by the laws of the State of Indiana and applicable federal regulations, including 29 CFR Parts 29 and 30. Disputes shall be resolved in Marion County, Indiana.`,
    },
  ];

  for (const section of sections) {
    checkY(60);
    page.drawText(section.title, { x: margin, y, size: 10, font: boldFont, color: rgb(0.1, 0.1, 0.18) });
    y -= lineH;
    y = drawWrappedText(page, section.body, margin + 10, y, contentWidth - 10, regularFont, 9, lineH);
    y -= 8;
  }

  // ── Signature Page ───────────────────────────────────────────────────────────
  checkY(200);
  y -= 10;
  drawLine(y);
  y -= 20;
  page.drawText('SIGNATURES', { x: margin, y, size: 12, font: boldFont, color: rgb(0.1, 0.1, 0.18) });
  y -= 20;

  const colW = (contentWidth - 20) / 2;
  const col2X = margin + colW + 20;

  // Sponsor column header
  page.drawText('SPONSOR', { x: margin, y, size: 9, font: boldFont, color: rgb(0.1, 0.1, 0.18) });
  page.drawText('EMPLOYER TRAINING SITE', { x: col2X, y, size: 9, font: boldFont, color: rgb(0.75, 0.22, 0.17) });
  y -= 16;

  // Sponsor name
  page.drawText(SPONSOR_SIGNER, { x: margin, y, size: 18, font: italicFont, color: rgb(0.1, 0.1, 0.18) });
  y -= 4;
  page.drawLine({ start: { x: margin, y }, end: { x: margin + colW, y }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });

  // Employer signature image or typed name
  if (data.signature_data && data.signature_data.startsWith('data:image/')) {
    try {
      const base64 = data.signature_data.replace(/^data:image\/\w+;base64,/, '');
      const imgBytes = Buffer.from(base64, 'base64');
      const img = await doc.embedPng(imgBytes).catch(() => doc.embedJpg(imgBytes));
      page.drawImage(img, { x: col2X, y: y - 20, width: colW, height: 36 });
    } catch {
      page.drawText(data.signer_name, { x: col2X, y, size: 18, font: italicFont, color: rgb(0.1, 0.1, 0.18) });
    }
  } else {
    page.drawText(data.signer_name, { x: col2X, y, size: 18, font: italicFont, color: rgb(0.1, 0.1, 0.18) });
  }
  y -= 4;
  page.drawLine({ start: { x: col2X, y }, end: { x: col2X + colW, y }, thickness: 1, color: rgb(0.75, 0.22, 0.17) });

  y -= 14;
  page.drawText(`Name: ${SPONSOR_SIGNER}`, { x: margin, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Name: ${data.signer_name}`, { x: col2X, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  y -= lineH;
  page.drawText(`Title: ${SPONSOR_TITLE}`, { x: margin, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Title: ${data.signer_title}`, { x: col2X, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  y -= lineH;
  page.drawText(`Organization: ${SPONSOR}`, { x: margin, y, size: 7, font: regularFont, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(`Organization: ${data.shop_name}`, { x: col2X, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  y -= lineH;
  page.drawText(`Date: ${signedDate}`, { x: margin, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Date: ${signedDate}`, { x: col2X, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });

  // ── Footer ───────────────────────────────────────────────────────────────────
  y -= 30;
  drawLine(y);
  y -= 12;
  page.drawText(`Document ID: MOU-${Date.now()}  ·  Signed: ${signedDate}  ·  IP: ${data.ip_address || 'on file'}`, {
    x: margin, y, size: 7, font: regularFont, color: rgb(0.6, 0.6, 0.6),
  });
  y -= 10;
  page.drawText(`${SPONSOR}  ·  ${ADDRESS}  ·  ${PHONE}`, {
    x: margin, y, size: 7, font: regularFont, color: rgb(0.6, 0.6, 0.6),
  });
  y -= 10;
  page.drawText('This document was executed electronically under the Indiana Uniform Electronic Transactions Act (IC 26-2-8) and the federal ESIGN Act.', {
    x: margin, y, size: 7, font: italicFont, color: rgb(0.6, 0.6, 0.6),
  });

  return doc.save();
}
