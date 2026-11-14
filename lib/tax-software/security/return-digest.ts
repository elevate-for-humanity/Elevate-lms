import { createHash } from 'node:crypto';
// Canonicalize keys and document order so database row ordering cannot change authorization.
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonical).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonical(v)]),
    );
  }
  return value;
}
export function taxReturnSourceDigest(input: unknown) {
  return createHash('sha256')
    .update(JSON.stringify(canonical(input)))
    .digest('hex');
}
