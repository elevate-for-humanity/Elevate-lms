export interface MOUPDFData {
  programHolderName: string;
  payoutShare: number;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  siteAddress?: string;
  date: string;
}

export async function generateMOUPDF(data: MOUPDFData): Promise<Uint8Array> {
  // Dynamic import to reduce bundle size
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
  
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const payoutPercent = (data.payoutShare * 100).toFixed(1);

  // Page 1
  let page = pdfDoc.addPage([612, 792]); // Letter size
  let y = 750;
  const margin = 50;
  const pageWidth = 612;
  const contentWidth = pageWidth - margin * 2;

  // Helper function to add text
  const addText = (
    text: string,
    size: number,
    font: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>,
    yPos: number,
    bold = false
  ) => {
    page.drawText(text, {
      x: margin,
      y: yPos,
      size,
      font,
      color: rgb(0, 0, 0),
    });
    return yPos - size - 4;
  };

  // Helper function to add wrapped text
  const addWrappedText = (
    text: string,
    size: number,
    font: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>,
    yPos: number,
    lineHeight = size + 4
  ) => {
    const words = text.split(' ');
    let line = '';
    let currentY = yPos;

    for (const word of words) {
      const testLine = line + word + ' ';
      const width = font.widthOfTextAtSize(testLine, size);

      if (width > contentWidth && line !== '') {
        page.drawText(line.trim(), {
          x: margin,
          y: currentY,
          size,
          font,
          color: rgb(0, 0, 0),
        });
        line = word + ' ';
        currentY -= lineHeight;

        // Check if we need a new page
        if (currentY < 50) {
          page = pdfDoc.addPage([612, 792]);
          currentY = 750;
        }
      } else {
        line = testLine;
      }
    }

    if (line.trim() !== '') {
      page.drawText(line.trim(), {
        x: margin,
        y: currentY,
        size,
        font,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    }

    return currentY;
  };

  // Title
  y = addText(
    'ELEVATE FOR HUMANITY CAREER & TECHNICAL INSTITUTE',
    14,
    timesRomanBold,
    y
  );
  y = addText('PROGRAM HOLDER / TRAINING PROVIDER', 12, timesRomanBold, y);
  y = addText('MEMORANDUM OF UNDERSTANDING (MOU)', 12, timesRomanBold, y);
  y -= 20;

  // Introduction
  y = addWrappedText(
    'This Memorandum of Understanding ("MOU") outlines the partnership between:',
    11,
    timesRomanFont,
    y
  );
  y -= 10;

  y = addText(
    'Elevate for Humanity Career & Technical Institute',
    11,
    timesRomanBold,
    y
  );
  y = addWrappedText(
    '("Elevate", "EFH", or "Training Sponsor")',
    11,
    timesRomanFont,
    y
  );
  y -= 10;

  y = addText('and', 11, timesRomanFont, y);
  y -= 10;

  y = addText(data.programHolderName, 11, timesRomanBold, y);
  y = addWrappedText(
    '("Program Holder" or "Training Provider")',
    11,
    timesRomanFont,
    y
  );
  y -= 10;

  y = addWrappedText(
    'together referred to as the "Parties."',
    11,
    timesRomanFont,
    y
  );
  y -= 20;

  // Section 1
  y = addText('1. PURPOSE OF THIS MOU', 12, timesRomanBold, y);
  y -= 5;
  y = addWrappedText(
    'The purpose of this MOU is to establish a clear, written understanding of how Elevate and the Program Holder will work together to deliver workforce training programs (for example: WRG, WIOA, JRI, EmployIndy, DOL-registered apprenticeships, and other aligned initiatives) and how revenue will be shared for eligible, funded participants who complete training and/or earn credentials.',
    10,
    timesRomanFont,
    y,
    14
  );
  y -= 15;

  // Section 2
  y = addText('2. ROLES AND RESPONSIBILITIES', 12, timesRomanBold, y);
  y -= 10;

  y = addText('2.1 Elevate for Humanity will:', 11, timesRomanBold, y);
  y -= 5;

  const elevateResponsibilities = [
    'a. Serve as the primary training sponsor and system of record for the programs listed in this MOU.',
    'b. Provide and maintain the Elevate Learning Management System (LMS), participant portal, case notes, certificates, and reporting tools.',
    'c. Coordinate with state and local workforce agencies, credentialing partners, and funding sources to keep programs compliant and in good standing.',
    'd. Enroll participants into approved training tracks and track participation, training hours, completions, and certifications.',
    'e. Manage collection of funds from workforce programs and other funders.',
    `f. Calculate and issue revenue share payments to Program Holder according to the compensation structure described in Section 4.`,
  ];

  for (const resp of elevateResponsibilities) {
    y = addWrappedText(resp, 10, timesRomanFont, y, 14);
    y -= 5;
  }

  y -= 10;
  y = addText('2.2 Program Holder will:', 11, timesRomanBold, y);
  y -= 5;

  const holderResponsibilities = [
    'a. Provide a safe, professional training environment for participants, including physical space and day-to-day supervision at the worksite or classroom.',
    'b. Deliver hands-on training, coaching, and supervision consistent with the curriculum, scope of work, and compliance requirements provided by Elevate and/or credentialing partners.',
    'c. Maintain reasonable attendance expectations, sign-in procedures, and communication with participants.',
    'd. Enter case notes, progress updates, and follow-up information into the Elevate portal as requested.',
    "e. Notify Elevate promptly of any issues that may impact a participant's participation, safety, or eligibility.",
    'f. Comply with all applicable laws, policies, and regulations relating to workplace safety, nondiscrimination, confidentiality, and workforce programs.',
  ];

  for (const resp of holderResponsibilities) {
    // Check if we need a new page
    if (y < 100) {
      page = pdfDoc.addPage([612, 792]);
      y = 750;
    }
    y = addWrappedText(resp, 10, timesRomanFont, y, 14);
    y -= 5;
  }

  // Continue with remaining sections on new pages as needed
  // Section 3 - Programs Covered
  if (y < 150) {
    page = pdfDoc.addPage([612, 792]);
    y = 750;
  }

  y -= 15;
  y = addText('3. PROGRAMS COVERED', 12, timesRomanBold, y);
  y -= 5;
  y = addWrappedText(
    'This MOU may cover one or more training tracks, including but not limited to: Barber/Beauty Apprenticeship, CNA/Patient Care, HVAC/Construction, Peer Support/Recovery Coach, Financial Literacy, and other industry-recognized credential programs.',
    10,
    timesRomanFont,
    y,
    14
  );
  y -= 15;

  // Section 4 - Compensation
  y = addText('4. COMPENSATION AND REVENUE SHARE', 12, timesRomanBold, y);
  y -= 10;

  y = addText('4.1 Definition of Net Program Revenue', 11, timesRomanBold, y);
  y -= 5;
  y = addWrappedText(
    `For each funded participant, Elevate may receive program revenue from one or more sources. Net Program Revenue means: Total eligible training revenue actually received by Elevate for that participant MINUS direct, required program costs including credentialing partner fees, background checks, learner toolkits, and platform fees.`,
    10,
    timesRomanFont,
    y,
    14
  );
  y -= 15;

  y = addText(
    `4.2 Program Holder Share (${payoutPercent}% Model)`,
    11,
    timesRomanBold,
    y
  );
  y -= 5;
  y = addWrappedText(
    `For each eligible participant who is officially enrolled, funded, and started training under this MOU, the Program Holder will receive ${payoutPercent}% of the Net Program Revenue associated with that participant's training track, paid to Program Holder after the participant's enrollment has been verified, agreed-upon credentialing and toolkit costs are accounted for, and funds have been received and cleared by Elevate.`,
    10,
    timesRomanFont,
    y,
    14
  );
  y -= 15;

  // Remaining sections abbreviated for space
  y = addText('5. DATA, REPORTING, AND CASE NOTES', 12, timesRomanBold, y);
  y -= 5;
  y = addWrappedText(
    'Elevate will provide Program Holder with secure access to the delegate portal to enter case notes, statuses, and follow-up dates for participants. Program Holder agrees to record reasonable case notes and updates to support compliance with workforce program documentation and audits.',
    10,
    timesRomanFont,
    y,
    14
  );
  y -= 15;

  // New page for signatures
  page = pdfDoc.addPage([612, 792]);
  y = 750;

  y = addText('6. TERM AND TERMINATION', 12, timesRomanBold, y);
  y -= 5;
  y = addWrappedText(
    'This MOU becomes effective on the date of the last signature below and remains in effect until terminated by either party with 30 days written notice.',
    10,
    timesRomanFont,
    y,
    14
  );
  y -= 20;

  y = addText('7. INDEPENDENT CONTRACTOR RELATIONSHIP', 12, timesRomanBold, y);
  y -= 5;
  y = addWrappedText(
    'The Parties agree that Program Holder is an independent contractor. This MOU does not create an employment relationship, partnership, or joint venture.',
    10,
    timesRomanFont,
    y,
    14
  );
  y -= 30;

  // Signature section
  y = addText('SIGNATURES', 12, timesRomanBold, y);
  y -= 20;

  y = addText(
    'ELEVATE FOR HUMANITY CAREER & TECHNICAL INSTITUTE',
    11,
    timesRomanBold,
    y
  );
  y -= 40;

  // Elevate signature line
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: margin + 200, y: y },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  y -= 15;
  y = addText('Authorized Signature', 9, timesRomanFont, y);
  y -= 5;
  y = addText(`Date: ${data.date}`, 9, timesRomanFont, y);
  y -= 40;

  // Program Holder signature section
  y = addText('PROGRAM HOLDER / TRAINING PROVIDER', 11, timesRomanBold, y);
  y -= 5;
  y = addText(`Organization: ${data.programHolderName}`, 10, timesRomanFont, y);
  y -= 35;

  // Program Holder signature line (this will be filled by e-signature)
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: margin + 200, y: y },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  y -= 15;
  y = addText('Authorized Signature', 9, timesRomanFont, y);
  y -= 5;
  y = addText(
    `Name: ${data.contactName || '___________________________'}`,
    9,
    timesRomanFont,
    y
  );
  y -= 5;
  y = addText(`Date: ${data.date}`, 9, timesRomanFont, y);

  // Footer
  y -= 30;
  y = addWrappedText(
    `This MOU was generated on ${data.date} via the Elevate for Humanity Training Provider Portal. For questions or to request modifications, contact: admin@www.elevateforhumanity.org`,
    8,
    timesRomanFont,
    y,
    12
  );

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
