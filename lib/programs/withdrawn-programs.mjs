// Owner withdrawal: retain instructional sources and learner records privately.
export const WITHDRAWN_PROGRAM_SLUGS = new Set([
  'bookkeeping', 'bookkeeping-quickbooks', 'bookkeeping-fundamentals', 'financial-literacy',
  'elevate-bookkeeping-financial-accounting',
  'bookkeeping & quickbooks', 'bookkeeping & accounting',
  'bookkeeping & quickbooks certified user',
]);
const programId = 'bd503ebf-d8e1-4c79-9efe-a72c001589b4';
export function isWithdrawnProgram(value) {
  return typeof value === 'string' && (WITHDRAWN_PROGRAM_SLUGS.has(value.toLowerCase().trim()) || value.toLowerCase().trim() === programId);
}
export function isWithdrawnProgramRequest(pathname, program) {
  const segments = pathname.toLowerCase().split('/').filter(Boolean);
  if (['programs', 'enroll', 'courses'].includes(segments[0]) && isWithdrawnProgram(segments[1])) return true;
  return (segments[0] === 'apply' || segments[0] === 'enroll') && isWithdrawnProgram(program);
}
