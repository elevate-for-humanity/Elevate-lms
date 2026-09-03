/**
 * Guards against literal template placeholders leaking from env or platform_settings.
 * If an admin pastes `{PLATFORM_DEFAULTS.orgName}` into site_name, we fall back instead of showing it publicly.
 */

const PLACEHOLDER_RE =
  /\{?\$?\{?\s*PLATFORM_DEFAULTS\.[a-zA-Z]+\s*\}?/;

export function isPlatformPlaceholderString(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return PLACEHOLDER_RE.test(value.trim());
}

export function sanitizePlatformValue(
  value: string | null | undefined,
  fallback: string,
): string {
  const trimmed = value?.trim();
  if (!trimmed || isPlatformPlaceholderString(trimmed)) return fallback;
  return trimmed;
}

/** Build program hero alt text with a resolved org name (never a raw placeholder). */
export function programHeroImageAlt(programLabel: string, orgName: string): string {
  const safeOrg = sanitizePlatformValue(orgName, 'Elevate for Humanity');
  return `${programLabel} training at ${safeOrg}`;
}
