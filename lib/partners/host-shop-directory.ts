type DirectoryPartner = {
  status?: string | null;
  approval_status?: string | null;
  is_active?: boolean | null;
  partner_type?: string | null;
  program_type?: string | null;
  programs?: string[] | null;
};

/** Directory visibility is not operational approval. Pending shops need an audited onboarding preview. */
export function isCurrentHostShopPartner(partner: DirectoryPartner): boolean {
  if (partner.status !== 'active' || partner.is_active === false) return false;
  if (['rejected', 'revoked', 'suspended'].includes(partner.approval_status || '')) return false;
  const type = String(partner.partner_type || '')
    .trim()
    .toLowerCase();
  // A provider's assigned beauty programs do not make the provider a Host Shop.
  if (
    [
      'program_holder',
      'site_coordinator',
      'internal_site',
      'website_business',
      'employer',
      'training_provider',
      'certification_provider',
      'credentialing_body',
      'certification',
      'government',
      'workforce',
      'workforce_agency',
    ].includes(type)
  )
    return false;
  const typeText = [
    type,
    partner.program_type,
    ...(Array.isArray(partner.programs) ? partner.programs : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /(barber|cosmet|nail|esthetic|salon|shop|training_site)/.test(typeText);
}
