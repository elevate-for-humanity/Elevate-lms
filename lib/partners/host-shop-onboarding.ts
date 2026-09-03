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

/** One canonical authenticated Host Shop route tree for every trade. */
export const HOST_SHOP_ONBOARDING_PATHS: Record<
  HostShopProgramType,
  { signMou: string; forms: string; documents: string; dashboard: string }
> = {
  barber: {
    signMou: '/host-shop/onboarding/mou',
    forms: '/host-shop/onboarding/profile',
    documents: '/host-shop/onboarding/documents',
    dashboard: '/host-shop/dashboard',
  },
  cosmetology: {
    signMou: '/host-shop/onboarding/mou',
    forms: '/host-shop/onboarding/profile',
    documents: '/host-shop/onboarding/documents',
    dashboard: '/host-shop/dashboard',
  },
  nail_technician: {
    signMou: '/host-shop/onboarding/mou',
    forms: '/host-shop/onboarding/profile',
    documents: '/host-shop/onboarding/documents',
    dashboard: '/host-shop/dashboard',
  },
  esthetician: {
    signMou: '/host-shop/onboarding/mou',
    forms: '/host-shop/onboarding/profile',
    documents: '/host-shop/onboarding/documents',
    dashboard: '/host-shop/dashboard',
  },
};

const DEFAULT_REQUIREMENTS: Record<HostShopProgramType, HostShopDocumentRequirement[]> = {
  barber: [
    requirement('barber', 'ein_letter', 'EIN / W-9 Business Identity Record', 'IRS CP 575/147C EIN verification or an acceptable W-9 business identity record.'),
    requirement('barber', 'barbershop_license', 'Indiana Barbershop License', 'Current Indiana barbershop establishment license.', true),
    requirement('barber', 'workers_comp', "Workers' Compensation Certificate", "Workers' compensation certificate or valid Indiana exemption."),
    requirement('barber', 'liability_insurance', 'General Liability Insurance Certificate', 'Certificate of general liability insurance for the host shop.', true),
    requirement('barber', 'supervisor_license', 'Supervising Barber License', 'Indiana barber license for the direct apprentice supervisor.', true),
    requirement('barber', 'business_license', 'City/County Business or Occupancy Document', 'Local business license or occupancy document, if applicable.', false, false),
  ],
  cosmetology: [
    requirement('cosmetology', 'ein_letter', 'EIN / W-9 Business Identity Record', 'IRS CP 575/147C EIN verification or an acceptable W-9 business identity record.'),
    requirement('cosmetology', 'salon_license', 'Indiana Cosmetology Salon License', 'Current Indiana cosmetology salon license.', true),
    requirement('cosmetology', 'workers_comp', "Workers' Compensation Certificate", "Workers' compensation certificate or valid Indiana exemption."),
    requirement('cosmetology', 'liability_insurance', 'General Liability Insurance Certificate', 'Certificate of general liability insurance for the host salon.', true),
    requirement('cosmetology', 'supervisor_license', 'Supervising Cosmetologist License', 'Indiana cosmetology license for the designated apprentice supervisor.', true),
    requirement('cosmetology', 'business_license', 'City/County Business or Occupancy Document', 'Local business license or occupancy document, if applicable.', false, false),
  ],
  nail_technician: [
    requirement('nail_technician', 'ein_letter', 'EIN / W-9 Business Identity Record', 'IRS CP 575/147C EIN verification or an acceptable W-9 business identity record.'),
    requirement('nail_technician', 'salon_license', 'Indiana Nail Salon License', 'Current Indiana nail salon license.', true),
    requirement('nail_technician', 'workers_comp', "Workers' Compensation Certificate", "Workers' compensation certificate or valid Indiana exemption."),
    requirement('nail_technician', 'liability_insurance', 'General Liability Insurance Certificate', 'Certificate of general liability insurance for the host salon.', true),
    requirement('nail_technician', 'supervisor_license', 'Supervising Nail Technician License', 'Indiana nail technician license for the apprentice supervisor.', true),
    requirement('nail_technician', 'business_license', 'City/County Business License', 'Local business license or occupancy permit, if applicable.', false, false),
  ],
  esthetician: [
    requirement('esthetician', 'ein_letter', 'EIN / W-9 Business Identity Record', 'IRS CP 575/147C EIN verification or an acceptable W-9 business identity record.'),
    requirement('esthetician', 'salon_license', 'Indiana Esthetician Establishment License', 'Current Indiana esthetics establishment license.', true),
    requirement('esthetician', 'workers_comp', "Workers' Compensation Certificate", "Workers' compensation certificate or valid Indiana exemption."),
    requirement('esthetician', 'liability_insurance', 'General Liability Insurance Certificate', 'Certificate of general liability insurance for the host spa.', true),
    requirement('esthetician', 'supervisor_license', 'Supervising Esthetician License', 'Indiana esthetician license for the apprentice supervisor.', true),
    requirement('esthetician', 'business_license', 'City/County Business License', 'Local business license or occupancy permit, if applicable.', false, false),
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

function normalizeLegacyRequirement(
  raw: Record<string, unknown>,
  program: HostShopProgramType,
): Record<string, unknown> | null {
  const rawType = String(raw.document_type ?? '').trim();
  if (!rawType || rawType === 'mou') return null;

  let documentType = rawType;
  if (rawType === 'establishment_license') {
    documentType = program === 'barber' ? 'barbershop_license' : 'salon_license';
  } else if (rawType === 'insurance_coi') {
    documentType = 'liability_insurance';
  } else if (rawType === 'w9') {
    documentType = 'ein_letter';
  }

  const normalized: Record<string, unknown> = {
    ...raw,
    id: raw.id ?? `${program}-${documentType}`,
    document_type: documentType,
    program_id: program,
  };

  if (documentType === 'ein_letter') {
    normalized.document_name = 'EIN / W-9 Business Identity Record';
    normalized.description = 'IRS CP 575/147C EIN verification or an acceptable W-9 business identity record.';
    normalized.is_required = true;
  }
  if (documentType === 'business_license') normalized.is_required = false;
  return normalized;
}

export function mergeHostShopDocumentRequirements(
  dbRequirements: Array<Record<string, unknown>> | null | undefined,
  program: HostShopProgramType,
) {
  const defaults = getDefaultHostShopDocumentRequirements(program);
  const byType = new Map<string, Record<string, unknown>>();
  for (const req of defaults) byType.set(req.document_type, req);
  for (const raw of dbRequirements ?? []) {
    const req = normalizeLegacyRequirement(raw, program);
    if (!req) continue;
    const documentType = String(req.document_type ?? '');
    if (!documentType) continue;
    const existing = byType.get(documentType) ?? {};
    byType.set(documentType, { ...existing, ...req, id: req.id ?? `${program}-${documentType}` });
  }
  return Array.from(byType.values());
}
