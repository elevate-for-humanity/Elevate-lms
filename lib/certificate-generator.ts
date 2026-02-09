/**
 * Certificate PDF Generation System
 * Generates completion certificates for programs and courses
 */

export interface CertificateData {
  recipientName: string;
  programName: string;
  completionDate: string;
  certificateNumber: string;
  instructorName?: string;
  organizationName?: string;
  hours?: number;
  credentialType?: string;
}

// Type for jsPDF instance
type jsPDFInstance = any;

export class CertificateGenerator {
  private doc: jsPDFInstance;

  private constructor(doc: jsPDFInstance) {
    this.doc = doc;
  }

  /**
   * Create a new CertificateGenerator instance
   * Uses dynamic import to reduce bundle size
   */
  static async create(): Promise<CertificateGenerator> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'letter'
    });
    return new CertificateGenerator(doc);
  }

  /**
   * Generate a professional certificate
   */
  generateCertificate(data: CertificateData): jsPDFInstance {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const pageHeight = this.doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;

    // Border
    this.doc.setLineWidth(2);
    this.doc.setDrawColor(218, 165, 32); // Gold
    this.doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    this.doc.setLineWidth(0.5);
    this.doc.setDrawColor(218, 165, 32);
    this.doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

    // Organization Name
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      data.organizationName || 'Elevate for Humanity',
      centerX,
      30,
      { align: 'center' }
    );

    // Certificate Title
    this.doc.setFontSize(36);
    this.doc.setFont('times', 'bold');
    this.doc.setTextColor(218, 165, 32); // Gold
    this.doc.text('Certificate of Completion', centerX, 50, { align: 'center' });

    // Decorative line
    this.doc.setLineWidth(0.5);
    this.doc.setDrawColor(218, 165, 32);
    this.doc.line(centerX - 60, 55, centerX + 60, 55);

    // "This certifies that"
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('This certifies that', centerX, 70, { align: 'center' });

    // Recipient Name
    this.doc.setFontSize(28);
    this.doc.setFont('times', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(data.recipientName, centerX, 85, { align: 'center' });

    // Underline for name
    this.doc.setLineWidth(0.3);
    this.doc.setDrawColor(0, 0, 0);
    const nameWidth = this.doc.getTextWidth(data.recipientName);
    this.doc.line(
      centerX - nameWidth / 2 - 5,
      87,
      centerX + nameWidth / 2 + 5,
      87
    );

    // "has successfully completed"
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('has successfully completed', centerX, 100, { align: 'center' });

    // Program Name
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(data.programName, centerX, 115, { align: 'center' });

    // Hours (if provided)
    if (data.hours) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        `${data.hours} Training Hours`,
        centerX,
        125,
        { align: 'center' }
      );
    }

    // Completion Date
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `Completed on ${data.completionDate}`,
      centerX,
      data.hours ? 135 : 130,
      { align: 'center' }
    );

    // Signature Lines
    const signatureY = pageHeight - 50;
    const leftX = pageWidth * 0.25;
    const rightX = pageWidth * 0.75;

    // Left signature line (Instructor)
    this.doc.setLineWidth(0.3);
    this.doc.line(leftX - 30, signatureY, leftX + 30, signatureY);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      data.instructorName || 'Program Instructor',
      leftX,
      signatureY + 5,
      { align: 'center' }
    );
    this.doc.setFontSize(8);
    this.doc.text('Instructor', leftX, signatureY + 10, { align: 'center' });

    // Right signature line (Director)
    this.doc.setLineWidth(0.3);
    this.doc.line(rightX - 30, signatureY, rightX + 30, signatureY);
    this.doc.setFontSize(10);
    this.doc.text('Elizabeth L. Greene', rightX, signatureY + 5, { align: 'center' });
    this.doc.setFontSize(8);
    this.doc.text('Executive Director', rightX, signatureY + 10, { align: 'center' });

    // Certificate Number (bottom right)
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(
      `Certificate No: ${data.certificateNumber}`,
      pageWidth - 15,
      pageHeight - 15,
      { align: 'right' }
    );

    // Verification URL
    this.doc.text(
      'Verify at: www.elevateforhumanity.org/verify',
      15,
      pageHeight - 15
    );

    return this.doc;
  }

  /**
   * Generate and download certificate
   */
  downloadCertificate(data: CertificateData, filename?: string): void {
    this.generateCertificate(data);
    const fileName = filename || `certificate-${data.certificateNumber}.pdf`;
    this.doc.save(fileName);
  }

  /**
   * Generate certificate as blob for upload
   */
  async getCertificateBlob(data: CertificateData): Promise<Blob> {
    this.generateCertificate(data);
    return this.doc.output('blob');
  }

  /**
   * Generate certificate as base64 string
   */
  getCertificateBase64(data: CertificateData): string {
    this.generateCertificate(data);
    return this.doc.output('dataurlstring');
  }
}

/**
 * Helper function to generate certificate number
 */
export function generateCertificateNumber(
  programCode: string,
  userId: number,
  year: number
): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${programCode}-${year}-${userId}-${timestamp}`;
}

/**
 * Format date for certificate
 */
export function formatCertificateDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Example usage:
 *
 * const generator = new CertificateGenerator();
 * const certificateData = {
 *   recipientName: 'John Doe',
 *   programName: 'Certified Nursing Assistant (CNA)',
 *   completionDate: formatCertificateDate(new Date()),
 *   certificateNumber: generateCertificateNumber('CNA', 123, 2024),
 *   instructorName: 'Jane Smith, RN',
 *   organizationName: 'Elevate for Humanity',
 *   hours: 120
 * };
 *
 * generator.downloadCertificate(certificateData);
 */
