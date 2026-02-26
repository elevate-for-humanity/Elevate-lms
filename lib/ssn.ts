/** Strip non-digits, cap at 9. */
export function normalizeSsn(input: string): string {
  return (input || '').replace(/\D/g, '').slice(0, 9);
}

/** Format digits as XXX-XX-XXXX for display. */
export function formatSsn(digits: string): string {
  const d = normalizeSsn(digits);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

/** True when input contains exactly 9 digits (dashes ignored). */
export function isValidSsn(input: string): boolean {
  return normalizeSsn(input).length === 9;
}
