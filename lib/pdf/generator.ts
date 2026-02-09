/**
 * PDF Generation Library
 * Uses jsPDF for lightweight PDF generation compatible with Vercel
 */

export async function generateCertificatePDF(data: {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateNumber: string;
  instructorName?: string;
}) {
  // Dynamic import to reduce bundle size
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setLineWidth(2);
  doc.setDrawColor(41, 128, 185);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  doc.setLineWidth(0.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  doc.setFontSize(40);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text('CERTIFICATE', pageWidth / 2, 40, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('OF COMPLETION', pageWidth / 2, 50, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.setDrawColor(41, 128, 185);
  doc.line(60, 55, pageWidth - 60, 55);

  doc.setFontSize(14);
  doc.setTextColor(80, 80, 80);
  doc.text('This certifies that', pageWidth / 2, 70, { align: 'center' });

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(data.studentName, pageWidth / 2, 85, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('has successfully completed', pageWidth / 2, 100, { align: 'center' });

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text(data.courseName, pageWidth / 2, 115, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Completion Date: ${data.completionDate}`, pageWidth / 2, 130, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Certificate #${data.certificateNumber}`, pageWidth / 2, 140, { align: 'center' });

  const signatureY = pageHeight - 40;
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(40, signatureY, 100, signatureY);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(data.instructorName || 'Instructor', 70, signatureY + 5, { align: 'center' });
  doc.text('Elevate for Humanity', 70, signatureY + 10, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Elevate for Humanity Institute', pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text('www.elevateforhumanity.org', pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc;
}

export function generateComplianceReportPDF(data: {
  reportDate: string;
  reportingPeriod: string;
  programName: string;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  complianceRate: number;
  details: Array<{ metric: string; value: string; status: string }>;
}) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('COMPLIANCE REPORT', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Date: ${data.reportDate}`, 20, 35);
  doc.text(`Reporting Period: ${data.reportingPeriod}`, 20, 42);
  doc.text(`Program: ${data.programName}`, 20, 49);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', 20, 65);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Students: ${data.totalStudents}`, 20, 75);
  doc.text(`Active Students: ${data.activeStudents}`, 20, 82);
  doc.text(`Completed Students: ${data.completedStudents}`, 20, 89);
  doc.text(`Compliance Rate: ${data.complianceRate}%`, 20, 96);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Metrics', 20, 115);

  const tableData = data.details.map(d => [d.metric, d.value, d.status]);

  doc.autoTable({
    startY: 120,
    head: [['Metric', 'Value', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Elevate for Humanity Institute', 105, 285, { align: 'center' });

  return doc;
}

export function generateMOUPDF(data: {
  partyAName: string;
  partyBName: string;
  effectiveDate: string;
  expirationDate: string;
  purpose: string;
  terms: string[];
  signatureDate?: string;
}) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('MEMORANDUM OF UNDERSTANDING', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Between:', 20, 40);

  doc.setFont('helvetica', 'normal');
  doc.text(data.partyAName, 20, 48);
  doc.text('and', 20, 56);
  doc.text(data.partyBName, 20, 64);

  doc.setFont('helvetica', 'bold');
  doc.text('Effective Date:', 20, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(data.effectiveDate, 60, 80);

  doc.setFont('helvetica', 'bold');
  doc.text('Expiration Date:', 20, 88);
  doc.setFont('helvetica', 'normal');
  doc.text(data.expirationDate, 60, 88);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Purpose:', 20, 105);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const purposeLines = doc.splitTextToSize(data.purpose, 170);
  doc.text(purposeLines, 20, 113);

  let yPos = 113 + (purposeLines.length * 7) + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms and Conditions:', 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  data.terms.forEach((term, index) => {
    const termLines = doc.splitTextToSize(`${index + 1}. ${term}`, 170);
    doc.text(termLines, 20, yPos);
    yPos += termLines.length * 7 + 3;

    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
  });

  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos += 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Signatures:', 20, yPos);

  yPos += 15;
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 90, yPos);
  doc.line(120, yPos, 190, yPos);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.partyAName, 55, yPos + 5, { align: 'center' });
  doc.text(data.partyBName, 155, yPos + 5, { align: 'center' });

  if (data.signatureDate) {
    doc.text(`Date: ${data.signatureDate}`, 55, yPos + 12, { align: 'center' });
    doc.text(`Date: ${data.signatureDate}`, 155, yPos + 12, { align: 'center' });
  }

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Elevate for Humanity Institute', 105, 285, { align: 'center' });

  return doc;
}

export function generateAccreditationReportPDF(data: {
  institutionName: string;
  reportDate: string;
  accreditationStatus: string;
  programsAccredited: number;
  complianceScore: number;
  findings: string[];
}) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('ACCREDITATION REPORT', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Institution: ${data.institutionName}`, 20, 40);
  doc.text(`Report Date: ${data.reportDate}`, 20, 48);
  doc.text(`Status: ${data.accreditationStatus}`, 20, 56);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 20, 75);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Programs Accredited: ${data.programsAccredited}`, 20, 85);
  doc.text(`Compliance Score: ${data.complianceScore}%`, 20, 92);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Findings', 20, 110);

  let yPos = 120;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  data.findings.forEach((finding, index) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${finding}`, 170);
    doc.text(lines, 20, yPos);
    yPos += lines.length * 7 + 5;

    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
  });

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Elevate for Humanity Institute', 105, 285, { align: 'center' });

  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}

export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output('blob');
}

export function getPDFBase64(doc: jsPDF): string {
  return doc.output('dataurlstring');
}
