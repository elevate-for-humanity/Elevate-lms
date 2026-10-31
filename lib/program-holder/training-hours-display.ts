import { isEpaTestingProgram } from './enrollment-identity';
export function trainingHoursDisplay(row: {
  total_hours_completed?: unknown;
  program_slug?: unknown;
  hours_required?: unknown;
}) {
  const raw = row.total_hours_completed;
  const actual = raw == null || raw === '' ? null : Number(raw);
  if (actual == null || !Number.isFinite(actual) || actual < 0) return 'Not recorded';
  const required =
    row.hours_required == null || row.hours_required === '' ? null : Number(row.hours_required);
  const target = isEpaTestingProgram(row.program_slug)
    ? 48
    : required != null && Number.isFinite(required) && required > 0
      ? required
      : null;
  return target ? `${actual} of ${target} recorded` : `${actual} hours recorded`;
}
