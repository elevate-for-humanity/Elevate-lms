/**
 * PDF generation stubs for MOU and compliance report routes.
 * These routes use jsPDF — install it or replace with a server-side PDF lib.
 * For now, returns a minimal jsPDF-compatible object so the build passes.
 */

export interface MOUOptions {
  partyAName: string;
  partyBName: string;
  effectiveDate: string;
  expirationDate: string;
  purpose: string;
  terms: string[];
  signatureDate: string;
}

export interface ComplianceReportOptions {
  reportDate: string;
  reportingPeriod: string;
  programName: string;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  complianceRate: number;
  details: { metric: string; value: string; status: string }[];
}

interface PDFDoc {
  output(type: 'arraybuffer'): ArrayBuffer;
}

function buildPDF(lines: string[]): PDFDoc {
  // Minimal text-based PDF so the route returns a valid response
  // without requiring jsPDF at build time.
  const body = lines.join('\n');
  const content = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${body.length + 50}>>
stream
BT /F1 12 Tf 50 750 Td (${body.replace(/\n/g, ') Tj T* (')}) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
trailer<</Size 6/Root 1 0 R>>
startxref
%%EOF`;

  const buf = Buffer.from(content, 'utf-8');
  return {
    output(): ArrayBuffer {
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    },
  };
}

export function generateMOUPDF(opts: MOUOptions): PDFDoc {
  const lines = [
    `MEMORANDUM OF UNDERSTANDING`,
    `Between: ${opts.partyAName}`,
    `And: ${opts.partyBName}`,
    `Effective: ${opts.effectiveDate}`,
    `Expires: ${opts.expirationDate}`,
    `Purpose: ${opts.purpose}`,
    ...opts.terms.map((t, i) => `${i + 1}. ${t}`),
    `Signed: ${opts.signatureDate}`,
  ];
  return buildPDF(lines);
}

export function generateComplianceReportPDF(opts: ComplianceReportOptions): PDFDoc {
  const lines = [
    `COMPLIANCE REPORT`,
    `Program: ${opts.programName}`,
    `Date: ${opts.reportDate}`,
    `Period: ${opts.reportingPeriod}`,
    `Total Students: ${opts.totalStudents}`,
    `Active: ${opts.activeStudents}`,
    `Completed: ${opts.completedStudents}`,
    `Compliance Rate: ${opts.complianceRate}%`,
    ...opts.details.map((d) => `${d.metric}: ${d.value} (${d.status})`),
  ];
  return buildPDF(lines);
}
