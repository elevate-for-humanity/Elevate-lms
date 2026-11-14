import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateNumber: string;
  programHours?: number;
}

export function generateCertificateNumber(): string {
  return `EFH-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
}

export async function generateCertificatePDF(data: CertificateData): Promise<Blob> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([792, 612]);
  const { width, height } = page.getSize();
  const roman = await doc.embedFont(StandardFonts.TimesRoman);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const orange = rgb(0.976, 0.451, 0.086);
  const dark = rgb(0.118, 0.161, 0.231);
  const gray = rgb(0.278, 0.333, 0.412);
  const light = rgb(0.58, 0.639, 0.722);

  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: orange, borderWidth: 8, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 32, y: 32, width: width - 64, height: height - 64, borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 1 });

  const centered = (text: string, size: number, font: typeof bold, y: number, color = dark) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
  };

  centered('Certificate of Completion', 36, bold, height - 120, orange);
  centered('This certifies that', 16, italic, height - 175, gray);
  centered(data.studentName, 32, bold, height - 225);
  const nameWidth = Math.max(bold.widthOfTextAtSize(data.studentName, 32), 300);
  page.drawLine({ start: { x: (width - nameWidth) / 2, y: height - 232 }, end: { x: (width + nameWidth) / 2, y: height - 232 }, thickness: 1, color: light });
  centered('has successfully completed', 16, italic, height - 270, gray);
  centered(data.courseName, 24, bold, height - 310, orange);
  if (data.programHours) centered(`${data.programHours} Program Hours`, 14, roman, height - 340, gray);
  centered(`Completed on ${data.completionDate}`, 14, roman, height - 380, gray);
  centered(`${PLATFORM_DEFAULTS.orgName} Career & Technical Institute`, 16, bold, 100);
  centered('Career & Technical Institute', 12, roman, 82, gray);
  centered(`Certificate #${data.certificateNumber}`, 9, sans, 50, light);

  const bytes = await doc.save();
  const stableBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([stableBuffer], { type: 'application/pdf' });
}
