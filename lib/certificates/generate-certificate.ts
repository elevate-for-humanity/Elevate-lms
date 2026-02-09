import QRCode from 'qrcode';

interface CertificateData {
  studentName: string;
  programTitle: string;
  completionDate: string;
  certificateNumber: string;
  totalHours: number;
  credentialType?: string;
  instructorName?: string;
}

export async function generateCertificate(data: CertificateData): Promise<Buffer> {
  // Dynamic import to reduce bundle size
  const { jsPDF } = await import('jspdf');
  
  // Create PDF in landscape mode
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: 'letter', // 11 x 8.5 inches
  });

  const pageWidth = 11;
  const pageHeight = 8.5;

  // Background - Professional gradient
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Border - Double line
  doc.setDrawColor(0, 51, 102); // Dark blue
  doc.setLineWidth(0.05);
  doc.rect(0.5, 0.5, pageWidth - 1, pageHeight - 1);
  doc.setLineWidth(0.02);
  doc.rect(0.6, 0.6, pageWidth - 1.2, pageHeight - 1.2);

  // Header - Organization name
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.setFont('helvetica', 'bold');
  doc.text('ELEVATE FOR HUMANITY', pageWidth / 2, 1.2, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Career & Technical Institute', pageWidth / 2, 1.5, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('ETPL Approved Provider • DOL Registered Apprenticeship Sponsor', pageWidth / 2, 1.75, { align: 'center' });

  // Title - Certificate of Completion
  doc.setFontSize(42);
  doc.setTextColor(0, 51, 102);
  doc.setFont('helvetica', 'bold');
  doc.text('Certificate of Completion', pageWidth / 2, 2.8, { align: 'center' });

  // Decorative line
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.02);
  doc.line(3, 3.1, pageWidth - 3, 3.1);

  // "This certifies that"
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text('This certifies that', pageWidth / 2, 3.6, { align: 'center' });

  // Student Name - Large and prominent
  doc.setFontSize(32);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(data.studentName, pageWidth / 2, 4.3, { align: 'center' });

  // Decorative line under name
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.01);
  doc.line(3.5, 4.5, pageWidth - 3.5, 4.5);

  // "has successfully completed"
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text('has successfully completed', pageWidth / 2, 4.9, { align: 'center' });

  // Program Title
  doc.setFontSize(22);
  doc.setTextColor(0, 51, 102);
  doc.setFont('helvetica', 'bold');
  doc.text(data.programTitle, pageWidth / 2, 5.5, { align: 'center' });

  // Training Hours
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.totalHours} Training Hours`, pageWidth / 2, 6.0, { align: 'center' });

  // Credential Type (if provided)
  if (data.credentialType) {
    doc.setFontSize(11);
    doc.setTextColor(0, 102, 204);
    doc.setFont('helvetica', 'italic');
    doc.text(data.credentialType, pageWidth / 2, 6.4, { align: 'center' });
  }

  // Completion Date
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date of Completion: ${data.completionDate}`, pageWidth / 2, 6.8, { align: 'center' });

  // Certificate Number
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Certificate Number: ${data.certificateNumber}`, pageWidth / 2, 7.1, { align: 'center' });

  // Signature Section
  const sigY = 7.6;

  // Left signature - Executive Director
  doc.setLineWidth(0.01);
  doc.setDrawColor(0, 0, 0);
  doc.line(2, sigY, 4, sigY);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Elizabeth Greene', 3, sigY + 0.25, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Chief Executive Officer', 3, sigY + 0.45, { align: 'center' });

  // Right signature - Instructor (if provided)
  if (data.instructorName) {
    doc.setLineWidth(0.01);
    doc.line(pageWidth - 4, sigY, pageWidth - 2, sigY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(data.instructorName, pageWidth - 3, sigY + 0.25, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Program Instructor', pageWidth - 3, sigY + 0.45, { align: 'center' });
  }

  // QR Code for verification
  try {
    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/certificates/verify/${data.certificateNumber}`;
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 100,
      margin: 1,
      color: {
        dark: '#003366',
        light: '#FFFFFF',
      },
    });

    doc.addImage(qrDataUrl, 'PNG', pageWidth - 1.5, 0.7, 0.8, 0.8);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Scan to verify', pageWidth - 1.1, 1.6, { align: 'center' });
  } catch (error) { /* Error handled silently */ 
    // Error: $1
  }

  // Footer - Repository Reference
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'This certificate is stored in the official repository and verifies successful completion of the stated program.',
    pageWidth / 2,
    pageHeight - 0.5,
    { align: 'center' }
  );
  doc.text(
    'Verify authenticity at www.elevateforhumanity.org/certificates/verify or scan QR code above',
    pageWidth / 2,
    pageHeight - 0.3,
    { align: 'center' }
  );

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

// Generate certificate and return base64 for preview
export async function generateCertificateBase64(data: CertificateData): Promise<string> {
  const buffer = await generateCertificate(data);
  return buffer.toString('base64');
}
