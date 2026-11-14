/**
 * Date formatting utilities with timeZone: 'UTC' pinned.
 *
 * Always use these instead of calling toLocaleDateString/toLocaleString directly.
 * Pinning timeZone prevents server/client hydration mismatches — the server runs
 * in UTC, but browsers default to the user's local timezone, producing different
 * output for the same timestamp.
 */

/** "Apr 15" */
export function fmtDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  });
}

/** "Apr 15, 2026" */
export function fmtDateLong(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "Apr 15, 2026, 3:04 PM" */
export function fmtDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "3:04 PM" */
export function fmtTime(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "Mon, Apr 15" */
export function fmtDateWeekday(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Days since a timestamp — uses a fixed reference point to avoid Date.now() in render */
export function ageDays(iso: string | null | undefined, referenceIso?: string): number {
  if (!iso) return 0;
  const ref = referenceIso ? new Date(referenceIso).getTime() : Date.now();
  return Math.floor((ref - new Date(iso).getTime()) / 86_400_000);
}
