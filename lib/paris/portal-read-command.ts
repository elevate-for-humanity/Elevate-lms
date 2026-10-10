/** Deterministic read commands run before the text model. Writes never enter this path. */
export type PortalReadCommand = 'applicants' | 'students' | 'hours' | 'overview';
export function parsePortalReadCommand(text: string): PortalReadCommand | null {
  if (
    /\b(send|submit|approve|reject|delete|update|change|record|log|enroll|pay|sign|draft|write)\b/i.test(
      text,
    )
  )
    return null;
  if (/\b(overview|dashboard summary|shop status|organization status)\b/i.test(text))
    return 'overview';
  if (!/\b(how many|count|total|number of)\b/i.test(text)) return null;
  if (/\b(hours?|logs?)\b/i.test(text)) return 'hours';
  if (/\b(applicants?|applications?)\b/i.test(text)) return 'applicants';
  if (/\b(students?|learners?|apprentices?)\b/i.test(text)) return 'students';
  return null;
}
