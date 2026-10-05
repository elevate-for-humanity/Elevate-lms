/**
 * Return actionable Studio errors to authenticated administrators.
 *
 * Do not collapse provider/runtime failures into a generic wrapper: Admin Studio
 * needs the underlying diagnostic in order to identify and repair failed AI
 * capabilities. Upstream error normalization remains responsible for preventing
 * secrets or credential values from being included in error messages.
 */
export function studioUserFacingError(value: unknown): string {
  const raw = value instanceof Error ? value.message : String(value ?? '');
  if (!raw.trim()) return 'The operation did not complete. Review its evidence or retry it.';

  return raw.slice(0, 1200);
}

export function studioUserFacingToolName(value: string | null | undefined): string {
  if (!value) return 'Studio capability';
  return value;
}
