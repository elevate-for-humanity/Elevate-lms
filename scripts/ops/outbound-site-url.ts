/**
 * Production URL for outbound ops emails (MOU, host shop, program holder).
 * Never use localhost — .env.local often sets NEXT_PUBLIC_SITE_URL for dev.
 */
const PRODUCTION_SITE_URL = 'https://www.elevateforhumanity.org';

export function outboundSiteUrl(): string {
  const raw = (process.env.OUTBOUND_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL).replace(
    /\/$/,
    '',
  );
  if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(raw)) {
    if (process.env.OUTBOUND_SITE_URL && !/localhost|127\.0\.0\.1/i.test(process.env.OUTBOUND_SITE_URL)) {
      return process.env.OUTBOUND_SITE_URL.replace(/\/$/, '');
    }
    console.warn(
      `⚠️  NEXT_PUBLIC_SITE_URL is "${raw}" — outbound email links will use ${PRODUCTION_SITE_URL}`,
    );
    return PRODUCTION_SITE_URL;
  }
  return raw;
}
