/** An explicit accepted zero must never fall back to the original claim. */
export function recordedHours(row: { accepted_hours?: unknown; hours?: unknown; hours_claimed?: unknown }) {
  const value = Number(row.accepted_hours ?? row.hours_claimed ?? row.hours ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function isOjlEntry(row: { source_type?: string | null; category?: string | null }) {
  return row.category !== 'transfer' &&
    ['ojl', 'timeclock', 'manual', 'host_shop'].includes(row.source_type || '');
}
