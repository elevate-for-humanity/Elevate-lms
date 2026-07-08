/**
 * Platform configuration loader.
 *
 * Reads from `platform_settings` (the admin-editable key/value table) with
 * env var fallbacks for build-time and cold-start scenarios.
 *
 * Usage (server components / API routes):
 *   import { getPlatformConfig } from '@/lib/config/platform-config';
 *   const cfg = await getPlatformConfig();
 *   cfg.orgName   // "Elevate for Humanity"
 *   cfg.siteUrl   // "https://www.elevateforhumanity.org"
 *
 * Usage (client components — static values baked at build time):
 *   import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
 *   PLATFORM_DEFAULTS.orgName
 */

import { cache } from 'react';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// ── Build-time / env-var defaults ─────────────────────────────────────────────
// These are the fallback values used when platform_settings has no row for a key.
// Override via environment variables in ECS task definition or .env.local.

export const PLATFORM_DEFAULTS = {
  orgName: process.env.NEXT_PUBLIC_ORG_NAME ?? 'Elevate for Humanity',
  orgLegalName:
    process.env.NEXT_PUBLIC_ORG_LEGAL_NAME ??
    'Elevate for Humanity Career & Technical Institute',
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org',
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@elevateforhumanity.org',
  supportPhone:
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '(317) 314-3757',
  emailFromName:
    process.env.NEXT_PUBLIC_EMAIL_FROM_NAME ?? 'Elevate for Humanity',
  emailFromAddress:
    process.env.NEXT_PUBLIC_EMAIL_FROM_ADDRESS ?? 'noreply@elevateforhumanity.org',
  certificateHolder:
    process.env.NEXT_PUBLIC_CERT_HOLDER ?? 'Elevate for Humanity',
  canonicalDomain:
    process.env.NEXT_PUBLIC_CANONICAL_DOMAIN ?? 'www.elevateforhumanity.org',
} as const;

export type PlatformConfig = typeof PLATFORM_DEFAULTS;

// ── Server-side loader (cached per request) ───────────────────────────────────

/**
 * Returns platform config merged from platform_settings DB rows + env defaults.
 * DB values take priority over env vars.
 * Safe to call from any server component or API route — uses service-role client.
 */
export const getPlatformConfig = cache(async (): Promise<PlatformConfig> => {
  try {
    const db = await requireAdminClient();
    const { data: rows, error } = await db
      .from('platform_settings')
      .select('key, value')
      .in('key', [
        'site_name',
        'org_legal_name',
        'site_url',
        'support_email',
        'contact_phone',
        'email_from_name',
        'email_from_address',
        'certificate_holder',
        'canonical_domain',
      ]);

    if (error) {
      logger.warn('[getPlatformConfig] platform_settings query failed — using env defaults', error);
      return PLATFORM_DEFAULTS;
    }

    const s: Record<string, string> = Object.fromEntries(
      (rows ?? []).map((r: { key: string; value: string }) => [r.key, r.value]),
    );

    return {
      orgName: s['site_name'] || PLATFORM_DEFAULTS.orgName,
      orgLegalName: s['org_legal_name'] || PLATFORM_DEFAULTS.orgLegalName,
      siteUrl: s['site_url'] || PLATFORM_DEFAULTS.siteUrl,
      supportEmail: s['support_email'] || PLATFORM_DEFAULTS.supportEmail,
      supportPhone: s['contact_phone'] || PLATFORM_DEFAULTS.supportPhone,
      emailFromName: s['email_from_name'] || PLATFORM_DEFAULTS.emailFromName,
      emailFromAddress: s['email_from_address'] || PLATFORM_DEFAULTS.emailFromAddress,
      certificateHolder: s['certificate_holder'] || PLATFORM_DEFAULTS.certificateHolder,
      canonicalDomain: s['canonical_domain'] || PLATFORM_DEFAULTS.canonicalDomain,
    };
  } catch (err) {
    logger.warn('[getPlatformConfig] unexpected error — using env defaults', err);
    return PLATFORM_DEFAULTS;
  }
});
