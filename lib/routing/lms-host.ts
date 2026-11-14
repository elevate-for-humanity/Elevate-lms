/** Keep deployed LMS navigation on its current owner while allowing custom environments. */
export function resolveLmsHost(lmsUrl?: string, legacyAppUrl?: string): string {
  const host = (lmsUrl?.trim() || legacyAppUrl?.trim() || 'https://lms.elevateforhumanity.org')
    .replace(/\/+$/, '');
  return host === 'https://app.elevateforhumanity.org'
    ? 'https://lms.elevateforhumanity.org'
    : host;
}
