// Temporary restriction until the approved EMT provider, syllabus and clinical plan are verified.
export const EMT_PROGRAM_SLUG = 'emt-apprenticeship';
export const EMT_INQUIRY_HREF = '/contact?program=emt-apprenticeship#contact-form';
export const EMT_INQUIRY_MESSAGE = 'EMT is open for inquiries only. Enrollment and payment are not open.';

export function isEmtInterviewSelection(value: unknown): boolean {
  if (isEmtInquiryOnly(value)) return true;
  if (typeof value !== 'string') return false;
  return /^(?:emt(?: training| apprenticeship)?|emergency medical technician(?: \(emt\))?(?: training| apprenticeship)?)$/i
    .test(value.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, ''));
}

export function isEmtInquiryOnly(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const slug = value.trim().toLowerCase();
  return slug === EMT_PROGRAM_SLUG || slug === 'emt';
}

/** Preserve only the canonical EMT context in a native contact form redirect. */
export function getContactFormReturnPath(status: 'submitted' | 'invalid' | 'error', program: unknown): string {
  const result = status === 'submitted' ? 'submitted=1' : `error=${status}`;
  return isEmtInquiryOnly(program)
    ? `/contact?program=${EMT_PROGRAM_SLUG}&${result}#contact-form`
    : `/contact?${result}`;
}
