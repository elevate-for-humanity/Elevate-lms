/**
 * Netlify Function: PDF Export
 * 
 * Handles PDF generation for data exports.
 * Isolated from Next.js to keep heavy PDF libraries out of the main server handler.
 */

import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const payload = event.body ? JSON.parse(event.body) : null;
    if (!payload) {
      return { statusCode: 400, body: "Missing body" };
    }

    // Dynamic import keeps heavy PDF libs in this function bundle only
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { data, options, filename } = payload;
    const title = options?.title || "Data Export";
    const subtitle = options?.subtitle || "";
    const columns = options?.columns || [];

    // Create first page
    let page = pdfDoc.addPage([612, 792]); // Letter size
    let y = 750;
    const margin = 50;
    const pageWidth = 612;

    // Title
    page.drawText(title, {
      x: margin,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    y -= 25;

    // Subtitle
    if (subtitle) {
      page.drawText(subtitle, {
        x: margin,
        y,
        size: 12,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 20;
    }

    // Generated date
    page.drawText(`Generated: ${new Date().toLocaleString()}`, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    y -= 30;

    // Table header
    if (columns.length > 0 && data && data.length > 0) {
      const colWidth = (pageWidth - margin * 2) / columns.length;
      
      // Draw header row
      columns.forEach((col: { key: string; label: string }, i: number) => {
        page.drawText(col.label || col.key, {
          x: margin + i * colWidth,
          y,
          size: 10,
          font: boldFont,
          color: rgb(0.16, 0.5, 0.73),
        });
      });
      y -= 5;
      
      // Header underline
      page.drawLine({
        start: { x: margin, y },
        end: { x: pageWidth - margin, y },
        thickness: 1,
        color: rgb(0.16, 0.5, 0.73),
      });
      y -= 15;

      // Data rows
      for (const row of data) {
        if (y < 50) {
          // New page
          page = pdfDoc.addPage([612, 792]);
          y = 750;
        }

        columns.forEach((col: { key: string; label: string }, i: number) => {
          const value = String(row[col.key] ?? "");
          const truncated = value.length > 30 ? value.substring(0, 27) + "..." : value;
          page.drawText(truncated, {
            x: margin + i * colWidth,
            y,
            size: 9,
            font,
            color: rgb(0, 0, 0),
          });
        });
        y -= 15;
      }
    } else if (data && data.length > 0) {
      // No columns specified, just dump the data
      for (const row of data) {
        if (y < 50) {
          page = pdfDoc.addPage([612, 792]);
          y = 750;
        }
        const text = JSON.stringify(row).substring(0, 100);
        page.drawText(text, {
          x: margin,
          y,
          size: 9,
          font,
          color: rgb(0, 0, 0),
        });
        y -= 15;
      }
    }

    // Footer on last page
    page.drawText("Elevate for Humanity", {
      x: pageWidth / 2 - 50,
      y: 30,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename || 'export.pdf'}"`,
        "Cache-Control": "no-store",
      },
      body: Buffer.from(pdfBytes).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e: any) {
    console.error("PDF export error:", e);
    return { statusCode: 500, body: e?.message ?? "PDF export failed" };
  }
};
