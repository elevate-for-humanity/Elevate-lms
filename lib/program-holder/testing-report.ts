export function isHolderRecordId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
}
export const TESTING_REPORT_FIELDS = [
  ['exam', 'Requested exam or credential'],
  ['coursework', 'Coursework and lessons completed'],
  ['assessments', 'Assessment names, dates, and actual scores'],
  ['practical_skills', 'Practical skills demonstrated and verification method'],
  ['summary', 'Final completion summary and any remaining barriers'],
] as const;
export function validateTestingReport(body: Record<string, unknown>, today: string) {
  const date = (value: unknown) =>
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  if (
    !date(body.start) ||
    !date(body.end) ||
    String(body.start) > String(body.end) ||
    String(body.end) > today
  )
    return 'Enter valid training dates ending on or before today.';
  if (
    typeof body.hours !== 'number' ||
    !Number.isFinite(body.hours) ||
    body.hours < 0 ||
    body.hours > 100000
  )
    return 'Enter the actual completed training hours.';
  for (const [key, label] of TESTING_REPORT_FIELDS) {
    if (typeof body[key] !== 'string' || body[key].trim().length < 3 || body[key].length > 4000)
      return `Complete: ${label}.`;
  }
  if (body.certified !== true) return 'Certify the accuracy of this report before submitting.';
  if (
    !Array.isArray(body.evidenceIds) ||
    !body.evidenceIds.length ||
    body.evidenceIds.length > 20 ||
    body.evidenceIds.some((id) => !isHolderRecordId(id))
  )
    return 'Select at least one uploaded supporting record.';
  return null;
}

export function evidenceEnrollment(description: unknown): string | null {
  if (typeof description !== 'string') return null;
  try {
    const value = JSON.parse(description);
    return typeof value?.enrollment_id === 'string' ? value.enrollment_id : null;
  } catch {
    return null;
  }
}

export function testingReportToday(now = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}
