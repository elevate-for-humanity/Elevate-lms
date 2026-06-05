import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';

// PUBLIC ROUTE: internal-only — called from /api/cert/pdf on the same runtime container.
// Not exposed externally (no auth header needed — same-origin fetch only).

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    const providedSecret = req.headers.get('x-internal-secret');
    if (!secret || providedSecret !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentName, courseName, completionDate, certificateNumber, verifyUrl } =
      await req.json();

    if (
      !studentName ||
      !courseName ||
      !completionDate ||
      !certificateNumber ||
      !verifyUrl ||
      String(studentName).length > 160 ||
      String(courseName).length > 200 ||
      String(certificateNumber).length > 120 ||
      String(verifyUrl).length > 500
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([792, 612]); // Landscape letter
    const { width, height } = page.getSize();

    // Background
    page.drawRectangle({
      x: 0, y: 0, width, height,
      color: rgb(0.98, 0.98, 1),
    });

    // Border
    page.drawRectangle({
      x: 20, y: 20, width: width - 40, height: height - 40,
      borderColor: rgb(0.16, 0.5, 0.73),
      borderWidth: 3,
      color: rgb(1, 1, 1),
    });

    // Title
    page.drawText('CERTIFICATE OF COMPLETION', {
      x: width / 2 - 180, y: height - 100,
      size: 28, font: boldFont,
      color: rgb(0.16, 0.5, 0.73),
    });

    // Subtitle
    page.drawText('This certifies that', {
      x: width / 2 - 70, y: height - 160,
      size: 14, font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Student name
    page.drawText(studentName, {
      x: width / 2 - (studentName.length * 10), y: height - 210,
      size: 32, font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Course
    page.drawText('has successfully completed', {
      x: width / 2 - 100, y: height - 260,
      size: 14, font,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(courseName, {
      x: width / 2 - (courseName.length * 7), y: height - 300,
      size: 20, font: boldFont,
      color: rgb(0.16, 0.5, 0.73),
    });

    // Date
    page.drawText(`Completed: ${completionDate}`, {
      x: width / 2 - 80, y: height - 360,
      size: 12, font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Certificate number
    page.drawText(`Certificate #: ${certificateNumber}`, {
      x: width / 2 - 80, y: height - 385,
      size: 10, font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Verify URL
    page.drawText(`Verify at: ${verifyUrl}`, {
      x: width / 2 - 120, y: height - 405,
      size: 9, font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Issuer
    page.drawText('Elevate for Humanity Career & Technical Institute', {
      x: width / 2 - 175, y: 60,
      size: 11, font: boldFont,
      color: rgb(0.16, 0.5, 0.73),
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e: unknown) {
    logger.error('cert-pdf generation failed', { error: e });
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
