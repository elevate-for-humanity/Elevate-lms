/**
 * lib/documents/generate-signed-pdf.ts
 *
 * Generates a signed PDF from a signature_document record.
 *
 * Two paths:
 *   1. PDF template — fetch the uploaded template from Storage, fill field_map
 *      positions with field_values, embed signature image at the signature field.
 *   2. HTML body — render the document body as a new PDF page, append signature.
 *
 * Returns a Uint8Array of the completed PDF.
 */

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';

export interface FieldMapEntry {
  name: string;
  label: string;
  type: 'text' | 'date' | 'signature' | 'checkbox';
  page: number; // 1-based
  x: number; // points from left
  y: number; // points from bottom
  width: number;
  height: number;
  required?: boolean;
}

export interface SignedPDFInput {
  documentTitle: string;
  documentBody?: string; // HTML/plain text body (used when no template)
  pdfTemplateBytes?: Uint8Array; // raw bytes of uploaded PDF template
  fieldMap?: FieldMapEntry[];
  fieldValues?: Record<string, string>;
  signerName: string;
  signerEmail: string;
  signatureData?: string; // base64 PNG data URL (draw mode)
  typedName?: string; // typed name (typed mode)
  signatureType: 'draw' | 'typed';
  signedAt: string; // ISO string
  ipAddress?: string;
}

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
): number {
  const lines = wrapText(text, maxWidth, font, fontSize);
  for (const line of lines) {
    page.drawText(line, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
    y -= lineHeight;
  }
  return y;
}

export async function generateSignedPDF(input: SignedPDFInput): Promise<Uint8Array> {
  let pdfDoc: PDFDocument;

  if (input.pdfTemplateBytes) {
    // ── Path 1: Fill existing PDF template ───────────────────────────────────
    pdfDoc = await PDFDocument.load(input.pdfTemplateBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    if (input.fieldMap && input.fieldValues) {
      for (const field of input.fieldMap) {
        const pageIndex = (field.page || 1) - 1;
        const page = pages[pageIndex];
        if (!page) continue;

        if (field.type === 'signature') {
          // Embed signature image or typed name
          if (input.signatureType === 'draw' && input.signatureData) {
            const base64 = input.signatureData.replace(/^data:image\/png;base64,/, '');
            const sigBytes = Buffer.from(base64, 'base64');
            const sigImage = await pdfDoc.embedPng(sigBytes);
            page.drawImage(sigImage, {
              x: field.x,
              y: field.y,
              width: field.width,
              height: field.height,
            });
          } else if (input.signatureType === 'typed' && input.typedName) {
            page.drawText(input.typedName, {
              x: field.x,
              y: field.y + field.height / 4,
              size: Math.min(field.height * 0.6, 24),
              font: boldFont,
              color: rgb(0.1, 0.1, 0.5),
            });
          }
        } else {
          const value = input.fieldValues[field.name] ?? '';
          if (value) {
            page.drawText(value, {
              x: field.x + 2,
              y: field.y + field.height / 4,
              size: Math.min(field.height * 0.55, 12),
              font,
              color: rgb(0, 0, 0),
            });
          }
        }
      }
    }
  } else {
    // ── Path 2: Generate PDF from document body ───────────────────────────────
    pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 60;
    const pageWidth = 612; // US Letter
    const pageHeight = 792;
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 16;
    const fontSize = 11;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Title
    page.drawText(input.documentTitle, {
      x: margin,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    y -= 32;

    // Horizontal rule
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 20;

    // Body text — strip HTML tags for plain rendering
    const bodyText = (input.documentBody ?? '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .trim();

    for (const paragraph of bodyText.split('\n')) {
      if (!paragraph.trim()) {
        y -= lineHeight * 0.5;
        continue;
      }
      // New page if needed
      if (y < margin + 120) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      y = drawWrappedText(
        page,
        paragraph.trim(),
        margin,
        y,
        contentWidth,
        font,
        fontSize,
        lineHeight,
      );
      y -= 4;
    }

    // ── Signature block ───────────────────────────────────────────────────────
    if (y < margin + 160) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    y -= 30;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 20;

    page.drawText('ELECTRONIC SIGNATURE', {
      x: margin,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 24;

    if (input.signatureType === 'draw' && input.signatureData) {
      const base64 = input.signatureData.replace(/^data:image\/png;base64,/, '');
      const sigBytes = Buffer.from(base64, 'base64');
      const sigImage = await pdfDoc.embedPng(sigBytes);
      const sigWidth = 200;
      const sigHeight = 80;
      page.drawImage(sigImage, { x: margin, y: y - sigHeight, width: sigWidth, height: sigHeight });
      y -= sigHeight + 8;
    } else if (input.signatureType === 'typed' && input.typedName) {
      page.drawText(input.typedName, {
        x: margin,
        y,
        size: 28,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.5),
      });
      y -= 36;
    }

    // Signature line
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + 250, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    y -= 14;

    page.drawText(`${input.signerName}`, {
      x: margin,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    y -= 14;
    page.drawText(input.signerEmail, { x: margin, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
    y -= 14;
    page.drawText(
      `Signed: ${new Date(input.signedAt).toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })}`,
      {
        x: margin,
        y,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      },
    );
    if (input.ipAddress) {
      y -= 14;
      page.drawText(`IP: ${input.ipAddress}`, {
        x: margin,
        y,
        size: 8,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });
    }
  }

  return pdfDoc.save();
}
