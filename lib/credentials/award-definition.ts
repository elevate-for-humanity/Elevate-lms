/** Canonical FK projection shared by learner awards and credential attempts. */
export const AWARD_DEFINITION = 'credentials:credential_registry(name,description,issuing_authority,issuer_type,metadata)';
export const PUBLIC_AWARD_DEFINITION = 'credentials:credential_registry!inner(id,name,description,issuing_authority,issuer_type,metadata)';

export function awardBadgeImage(definition: { metadata?: unknown } | null | undefined): string | null {
  const metadata = definition?.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).badge_image_url;
  return typeof value === 'string' && value.trim() ? value : null;
}
