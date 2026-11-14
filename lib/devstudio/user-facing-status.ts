/**
 * Return actionable Studio errors to authenticated administrators.
 *
 * Do not collapse provider/runtime failures into a generic wrapper: Admin Studio
 * needs the underlying diagnostic in order to identify and repair failed AI
 * capabilities. This final display boundary also redacts credential values when an upstream
 * SDK includes them in diagnostic messages.
 */
export function studioUserFacingError(value: unknown): string {
  const raw = value instanceof Error ? value.message : String(value ?? '');
  if (!raw.trim()) return 'The operation did not complete. Review its evidence or retry it.';

  if (/^PAID_INFERENCE_AUTHORIZATION_REQUIRED\b/.test(raw)) {
    return 'This AI request needs authorization before paid inference can start. Saved work is preserved.';
  }
  // Keep the affected provider and HTTP status useful to an administrator,
  // while removing credential values even if an upstream SDK missed them.
  return raw
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/-]+=*/gi, '$1 [REDACTED]')
    .replace(/(["']?(?:authorization|password|token|secret|api[_-]?key|service[_-]?role[_-]?key)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;}&]+)/gi, '$1[REDACTED]')
    .replace(/\b(?:sk-[A-Za-z0-9_-]{6,}|gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)/g, '[REDACTED]')
    .slice(0, 1200);
}

export function studioUserFacingToolName(value: string | null | undefined): string {
  if (!value) return 'Studio capability';
  return value;
}
