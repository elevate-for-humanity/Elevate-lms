export type HostShopProgramType = 'barber' | 'cosmetology' | 'nail_technician' | 'esthetician';

export type HostShopDocumentRequirement = {
  id: string;
  document_type: string;
  document_name: string;
  description: string;
  is_required: boolean;
  requires_expiration: boolean;
  program_id: string;
  state: string;
};

const PROGRAM_ALIASES: Record<string, HostShopProgramType> = {
  barber: 'barber',
  barbershop: 'barber',
  'barber-apprenticeship': 'barber',
  barber_apprenticeship: 'barber',
  training_site: 'barber',
  cosmetology: 'cosmetology',
  'cosmetology-apprenticeship': 'cosmetology',
  cosmetology_apprenticeship: 'cosmetology',
  salon: 'cosmetology',
  nail: 'nail_technician',
  nail_technician: 'nail_technician',
  nail_tech: 'nail_technician',
  'nail-tech': 'nail_technician',
  'nail-technician-apprenticeship': 'nail_technician',
  esthetician: 'esthetician',
  'esthetician-apprenticeship': 'esthetician',
};

/**
 * One canonical authenticated Host Shop onboarding flow for every trade.
 * Program is a query parameter, not a parallel route tree.
 */
export const HOST_SHOP_ONBOARDING_PATHS: Record<
  HostShopProgramType,
  { signMou: string; forms: string; documents: string; dashboard: string }
> = {
  barber: {
    signMou: '/host-shop/mou?program=barber',
    forms: '/host-shop/onboarding?program=barber',
    documents: '/host-shop/dashboard/documents',
    dashboard: '/host-shop/dashboard/board',
  },
  cosmetology: {
    signMou: '/host-shop/mou?program=cosmetology',
    forms: '/host-shop/onboarding?program=cosmetology',
    documents: '/host-shop/dashboard/documents',
    dashboard: '/host-shop/dashboard/board',
  },
  nail_technician: {
    signMou: '/host-shop/mou?program=nail',
    forms: '/host-shop/onboarding?program=nail',
    documents: '/host-shop/dashboard/documents',
    dashboard: '/host-shop/dashboard/board',
  },
  esthetician: {
    signMou: '/host-shop/mou?program=esthetician',
    forms: '/host-shop/onboarding?program=esthetician',
    documents: '/host-shop/dashboard/documents',
    dashboard: '/host-shop/dashboard/board',
  },
};

const DOCUMENT_TYPE_ALIASES: Record<string, string> = {
  barbershop_license: 'establishment_license',
  salon_license: 'establishment_license',
  shop_license: 'establishment_license',
  business_license: 'establishment_license',
  liability_insurance: 'insurance_coi',
  insurance: 'insurance_coi',
  ein_letter: 'w9',
  ein: 'w9',
};

export function canonicalHostShopDocumentType(value: unknown): string {
  const raw = String(value ?? '').trim().toLowerCase();
  return DOCUMENT_TYPE_ALIASES[raw] ?? raw;
}

const DEFAULT_REQUIREMENTS: Record<HostShopProgramType, HostShopDocumentRequirement[]> = {
  barber: [
    requirement('barber', 'establishment_license', 'Indiana Business / Barbershop License', 'Current Indiana business or barbershop establishment license.', true),
    requirement('barber', 'insurance_coi', 'Liability Insurance Certificate', 'Current commercial/general liability insurance certificate of insurance.', true),
    requirement('barber', 'workers_comp', "Workers' Compensation Certificate / Exemption", "Current workers' compensation certificate or valid Indiana exemption."),
    requirement('barber', 'supervisor_license', 'Supervising Barber License', 'Current Indiana barber license for the direct apprentice supervisor.', true),
    requirement('barber', 'w9', 'EIN Verification / IRS W-9', 'IRS EIN verification or completed W-9 confirming the business tax identity.'),
    requirement('barber', 'local_business', 'Occupancy / Local Business Document', 'Local occupancy permit or business document when applicable.', false, false),
  ],
  cosmetology: [
    requirement('cosmetology', 'establishment_license', 'Indiana Business / Salon License', 'Current Indiana business or cosmetology salon establishment license.', true),
    requirement('cosmetology', 'insurance_coi', 'Liability Insurance Certificate', 'Current commercial/general liability insurance certificate of insurance.', true),
    requirement('cosmetology', 'workers_comp', "Workers' Compensation Certificate / Exemption", "Current workers' compensation certificate or valid Indiana exemption."),
    requirement('cosmetology', 'supervisor_license', 'Supervising Cosmetologist License', 'Current Indiana cosmetology license for the designated apprentice supervisor.', true),
    requirement('cosmetology', 'w9', 'EIN Verification / IRS W-9', 'IRS EIN verification or completed W-9 confirming the business tax identity.'),
    requirement('cosmetology', 'local_business', 'Occupancy / Local Business Document', 'Local occupancy permit or business document when applicable.', false, false),
  ],
  nail_technician: [
    requirement('nail_technician', 'establishment_license', 'Indiana Business / Nail Salon License', 'Current Indiana business or nail salon establishment license.', true),
    requirement('nail_technician', 'insurance_coi', 'Liability Insurance Certificate', 'Current commercial/general liability insurance certificate of insurance.', true),
    requirement('nail_technician', 'workers_comp', "Workers' Compensation Certificate / Exemption", "Current workers' compensation certificate or valid Indiana exemption."),
    requirement('nail_technician', 'supervisor_license', 'Supervising Nail Technician License', 'Current Indiana nail technician license for the apprentice supervisor.', true),
    requirement('nail_technician', 'w9', 'EIN Verification / IRS W-9', 'IRS EIN verification or completed W-9 confirming the business tax identity.'),
    requirement('nail_technician', 'local_business', 'Occupancy / Local Business Document', 'Local occupancy permit or business document when applicable.', false, false),
  ],
  esthetician: [
    requirement('esthetician', 'establishment_license', 'Indiana Business / Esthetics License', 'Current Indiana business or esthetics establishment license.', true),
    requirement('esthetician', 'insurance_coi', 'Liability Insurance Certificate', 'Current commercial/general liability insurance certificate of insurance.', true),
    requirement('esthetician', 'workers_comp', "Workers' Compensation Certificate / Exemption", "Current workers' compensation certificate or valid Indiana exemption."),
    requirement('esthetician', 'supervisor_license', 'Supervising Esthetician License', 'Current Indiana esthetician license for the apprentice supervisor.', true),
    requirement('esthetician', 'w9', 'EIN Verification / IRS W-9', 'IRS EIN verification or completed W-9 confirming the business tax identity.'),
    requirement('esthetician', 'local_business', 'Occupancy / Local Business Document', 'Local occupancy permit or business document when applicable.', false, false),
  ],
};

function requirement(
  program: HostShopProgramType,
  type: string,
  name: string,
  description: string,
  requiresExpiration = false,
  required = true,
): HostShopDocumentRequirement {
  return {
    id: `${program}-${type}`,
    document_type: type,
    document_name: name,
    description,
    is_required: required,
    requires_expiration: requiresExpiration,
    program_id: program,
    state: 'Indiana',
  };
}

export function normalizeHostShopProgram(value: unknown): HostShopProgramType | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeHostShopProgram(item);
      if (normalized) return normalized;
    }
    return null;
  }
  const key = String(value).trim().toLowerCase().replace(/\s+/g, '-');
  return PROGRAM_ALIASES[key] ?? PROGRAM_ALIASES[key.replace(/-/g, '_')] ?? null;
}

export function resolveHostShopProgram(partner: Record<string, unknown> | null | undefined): HostShopProgramType {
  return (
    normalizeHostShopProgram(partner?.program_type) ??
    normalizeHostShopProgram(partner?.partner_type) ??
    normalizeHostShopProgram(partner?.programs) ??
    'barber'
  );
}

export function getHostShopOnboardingPaths(program: HostShopProgramType) {
  return HOST_SHOP_ONBOARDING_PATHS[program];
}

export function getDefaultHostShopDocumentRequirements(program: HostShopProgramType) {
  return DEFAULT_REQUIREMENTS[program];
}

export function mergeHostShopDocumentRequirements(
  dbRequirements: Array<Record<string, unknown>> | null | undefined,
  program: HostShopProgramType,
) {
  const defaults = getDefaultHostShopDocumentRequirements(program);
  const byType = new Map<string, Record<string, unknown>>();

  for (const req of defaults) {
    byType.set(req.document_type, req);
  }

  for (const req of dbRequirements ?? []) {
    const originalType = String(req.document_type ?? '');
    const documentType = canonicalHostShopDocumentType(originalType);
    if (!documentType || documentType === 'mou') continue;
    if (!byType.has(documentType)) continue;

    const existing = byType.get(documentType) ?? {};
    byType.set(documentType, {
      ...existing,
      ...req,
      id: req.id ?? `${program}-${documentType}`,
      document_type: documentType,
      program_id: program,
    });
  }

  return Array.from(byType.values());
}
