import { hostStudentCertificatePdf } from './host-shop-student-pdf';

type CompletionDocument = {
  certificateNumber: string; studentName: string; studentId: string;
  courseTitle: string; startDate: string; completionDate: string; issuedAt?: string;
};

/** Institutional course completion only. Never infers an EPA/ESB exam award. */
export function validateCompletionDocument(input: CompletionDocument) {
  for (const value of [input.startDate, input.completionDate]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value + 'T12:00:00Z')) ||
      new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) !== value) throw new Error('Verified training dates are required');
  }
  if (input.startDate > input.completionDate || input.completionDate > new Date().toISOString().slice(0, 10))
    throw new Error('Training completion dates are inconsistent');
  if (!input.courseTitle.trim() || !input.studentName.trim() || !input.certificateNumber.trim())
    throw new Error('Verified student, course and certificate reference are required');
}

export async function programCompletionPdf(input: CompletionDocument) {
  validateCompletionDocument(input);
  return hostStudentCertificatePdf({
    id: input.certificateNumber, reference: input.certificateNumber,
    studentName: input.studentName, studentId: input.studentId,
    shopId: '', shopName: 'Elevate Certificate of Completion', program: input.courseTitle,
    title: 'Certificate of Completion', status: 'enrolled', recordDate: input.issuedAt || new Date().toISOString(),
    completion: { startDate: input.startDate, completionDate: input.completionDate },
  });
}
