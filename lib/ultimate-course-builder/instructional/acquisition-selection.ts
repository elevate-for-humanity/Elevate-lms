/** A match score ranks a library candidate; it does not establish scene
 * coverage. Keep every usable approved item available for the later licensed
 * scene-assignment gate rather than discarding lower-ranked relevant files. */
export function selectApprovedAcquisitionMatches<T extends {
  lesson_id: unknown;
  entitlement_id: unknown;
  match_score?: unknown;
  id?: unknown;
}>(matches: T[]): T[] {
  const selected = new Map<string, T>();
  for (const match of [...matches].sort((a, b) =>
    Number(b.match_score ?? 0) - Number(a.match_score ?? 0) ||
    String(a.id ?? '').localeCompare(String(b.id ?? '')),
  )) {
    const key = JSON.stringify([String(match.lesson_id), String(match.entitlement_id)]);
    if (!selected.has(key)) selected.set(key, match);
  }
  return [...selected.values()];
}
