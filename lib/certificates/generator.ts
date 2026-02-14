import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateNumber: string;
  programHours?: number;
}

export function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `EFH-${timestamp}-${random}`.toUpperCase();
}

/**
 * Generate a real PDF certificate using pdf-lib.
 * Returns a Blob suitable for download responses.
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Blob> {
  const doc = await PDFDocument.create();

  // Landscape letter: 792 x 612
  const page = doc.addPage([792, 612]);
  const { width, height } = page.getSize();

  const timesRoman = await doc.embedFont(StandardFonts.TimesRoman);
  const timesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);

  const brandOrange = rgb(0.976, 0.451, 0.086); // #f97316
  const darkSlate = rgb(0.118, 0.161, 0.231);   // #1e293b
  const medGray = rgb(0.278, 0.333, 0.412);      // #475569
  const lightGray = rgb(0.580, 0.639, 0.722);    // #94a3b8

  // Border
  const borderWidth = 8;
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: brandOrange,
    borderWidth,
    color: rgb(1, 1, 1),
  });

  // Inner border
  page.drawRectangle({
    x: 32,
    y: 32,
    width: width - 64,
    height: height - 64,
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  });

  // Title
  const title = 'Certificate of Completion';
  const titleWidth = timesBold.widthOfTextAtSize(title, 36);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height - 120,
    size: 36,
    font: timesBold,
    color: brandOrange,
  });

  // "This certifies that"
  const certText = 'This certifies that';
  const certWidth = timesItalic.widthOfTextAtSize(certText, 16);
  page.drawText(certText, {
    x: (width - certWidth) / 2,
    y: height - 175,
    size: 16,
    font: timesItalic,
    color: medGray,
  });

  // Student name
  const nameWidth = timesBold.widthOfTextAtSize(data.studentName, 32);
  page.drawText(data.studentName, {
    x: (width - nameWidth) / 2,
    y: height - 225,
    size: 32,
    font: timesBold,
    color: darkSlate,
  });

  // Underline
  page.drawLine({
    start: { x: (width - Math.max(nameWidth, 300)) / 2, y: height - 232 },
    end: { x: (width + Math.max(nameWidth, 300)) / 2, y: height - 232 },
    thickness: 1,
    color: lightGray,
  });

  // "has successfully completed"
  const completedText = 'has successfully completed';
  const completedWidth = timesItalic.widthOfTextAtSize(completedText, 16);
  page.drawText(completedText, {
    x: (width - completedWidth) / 2,
    y: height - 270,
    size: 16,
    font: timesItalic,
    color: medGray,
  });

  // Course name
  const courseWidth = timesBold.widthOfTextAtSize(data.courseName, 24);
  page.drawText(data.courseName, {
    x: (width - courseWidth) / 2,
    y: height - 310,
    size: 24,
    font: timesBold,
    color: brandOrange,
  });

  // Program hours
  if (data.programHours) {
    const hoursText = `${data.programHours} Program Hours`;
    const hoursWidth = timesRoman.widthOfTextAtSize(hoursText, 14);
    page.drawText(hoursText, {
      x: (width - hoursWidth) / 2,
      y: height - 340,
      size: 14,
      font: timesRoman,
      color: medGray,
    });
  }

  // Completion date
  const dateText = `Completed on ${data.completionDate}`;
  const dateWidth = timesRoman.widthOfTextAtSize(dateText, 14);
  page.drawText(dateText, {
    x: (width - dateWidth) / 2,
    y: height - 380,
    size: 14,
    font: timesRoman,
    color: medGray,
  });

  // Issuer
  const issuer = 'Elevate For Humanity';
  const issuerWidth = timesBold.widthOfTextAtSize(issuer, 16);
  page.drawText(issuer, {
    x: (width - issuerWidth) / 2,
    y: 100,
    size: 16,
    font: timesBold,
    color: darkSlate,
  });

  const subtitle = 'Career & Technical Institute';
  const subtitleWidth = timesRoman.widthOfTextAtSize(subtitle, 12);
  page.drawText(subtitle, {
    x: (width - subtitleWidth) / 2,
    y: 82,
    size: 12,
    font: timesRoman,
    color: medGray,
  });

  // Certificate number
  const certNumText = `Certificate #${data.certificateNumber}`;
  const certNumWidth = helvetica.widthOfTextAtSize(certNumText, 9);
  page.drawText(certNumText, {
    x: (width - certNumWidth) / 2,
    y: 50,
    size: 9,
    font: helvetica,
    color: lightGray,
  });

  const pdfBytes = await doc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
