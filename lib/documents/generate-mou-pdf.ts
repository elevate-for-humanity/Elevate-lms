import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import { getHostShopMouSections } from '@/lib/partners/host-shop-mou-sections';

export type MOUPDFData = {
  shop_name: string;
  signer_name: string;
  signer_title: string;
  supervisor_name?: string;
  supervisor_license?: string;
  compensation_model?: string;
  compensation_rate?: string;
  signed_at: string;
  signature_data?: string;
  ip_address?: string;
  mou_version?: string;
};

const BARBER_CONTRACT = getRegisteredProgramStandard('barber-apprenticeship');
if (!BARBER_CONTRACT) throw new Error('REGISTERED_BARBER_CONTRACT_MISSING');

const STANDARD = BARBER_CONTRACT.standard;
const SPONSOR = BARBER_CONTRACT.sponsor;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const paragraphs = text.split(/\n+/);
  const output: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      output.push('');
      continue;
    }
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) line = candidate;
      else {
        if (line) output.push(line);
        line = word;
      }
    }
    if (line) output.push(line);
  }
  return output;
}

function drawWrapped(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size = 9,
  lineHeight = 13,
) {
  for (const line of wrapText(text, CONTENT_WIDTH, font, size)) {
    if (line) page.drawText(line, { x, y, size, font, color: rgb(0.12, 0.12, 0.16) });
    y -= lineHeight;
  }
  return y;
}

export async function generateMOUPdf(data: MOUPDFData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const newPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };
  const ensure = (needed = 70) => {
    if (y < MARGIN + needed) newPage();
  };

  page.drawText('ELEVATE FOR HUMANITY', { x: MARGIN, y, size: 16, font: bold });
  y -= 20;
  page.drawText('Barber Apprenticeship Host Shop Memorandum of Understanding', {
    x: MARGIN,
    y,
    size: 13,
    font: bold,
  });
  y -= 18;
  page.drawText(`Sponsor: ${SPONSOR.sponsor} · Registration ${SPONSOR.registrationNumber}`, {
    x: MARGIN,
    y,
    size: 9,
    font: regular,
  });
  y -= 14;
  page.drawText(`Occupation: ${STANDARD.occupationTitle} · RAPIDS ${STANDARD.rapidsCode} · ${STANDARD.approach}`, {
    x: MARGIN,
    y,
    size: 9,
    font: regular,
  });
  y -= 14;
  page.drawText(`Registered requirements: ${STANDARD.competencyCount} competencies · ${STANDARD.relatedInstructionHours} RTI hours · ${STANDARD.apprenticeToMentorRatio} mentor ratio · ${STANDARD.probationaryHours}-hour probation`, {
    x: MARGIN,
    y,
    size: 8.5,
    font: regular,
  });
  y -= 18;
  page.drawText(`Host Shop: ${data.shop_name}`, { x: MARGIN, y, size: 10, font: bold });
  y -= 14;
  page.drawText(`Effective: ${new Date(data.signed_at).toLocaleDateString('en-US')}`, { x: MARGIN, y, size: 9, font: regular });
  y -= 22;

  for (const section of getHostShopMouSections('barber')) {
    ensure(85);
    page.drawText(section.title, { x: MARGIN, y, size: 10, font: bold });
    y -= 15;
    y = drawWrapped(page, section.content, MARGIN, y, regular);
    y -= 10;
  }

  ensure(170);
  page.drawText('SIGNATURES', { x: MARGIN, y, size: 11, font: bold });
  y -= 24;
  page.drawText('Host Shop Authorized Signer', { x: MARGIN, y, size: 9, font: bold });
  y -= 18;
  page.drawText(data.signer_name, { x: MARGIN, y, size: 17, font: italic });
  y -= 16;
  page.drawText(`Title: ${data.signer_title || 'Authorized representative'}`, { x: MARGIN, y, size: 9, font: regular });
  y -= 14;
  page.drawText(`Signed: ${new Date(data.signed_at).toLocaleString('en-US')}`, { x: MARGIN, y, size: 9, font: regular });
  y -= 14;
  if (data.ip_address) page.drawText(`Recorded IP: ${data.ip_address}`, { x: MARGIN, y, size: 8, font: regular });
  y -= 20;
  page.drawText(`MOU version: ${data.mou_version || `${SPONSOR.registrationNumber}-${SPONSOR.revisionDate}`}`, { x: MARGIN, y, size: 8, font: regular });

  return doc.save();
}
