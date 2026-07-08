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

export const HOST_SHOP_ONBOARDING_PATHS: Record<
  HostShopProgramType,
  { signMou: string; forms: string; documents: string; dashboard: string }
> = {
  barber: {
    signMou: '/partners/barber-host-shop/sign-mou',
    forms: '/partners/barber-host-shop/forms',
    documents: '/partners/barber-host-shop/documents',
    dashboard: '/partner/board',
  },
  cosmetology: {
    signMou: '/partners/cosmetology-host-shop/sign-mou',
    forms: '/partners/cosmetology-host-shop/forms',
    documents: '/partners/cosmetology-host-shop/documents',
    dashboard: '/partner/board',
  },
  nail_technician: {
    signMou: '/partners/nail-technician-apprenticeship/sign-mou',
    forms: '/partners/nail-technician-apprenticeship/forms',
    documents: '/partners/nail-technician-apprenticeship/documents',
    dashboard: '/partner/board',
  },
  esthetician: {
    signMou: '/partners/esthetician-apprenticeship/sign-mou',
    forms: '/partners/esthetician-apprenticeship/forms',
    documents: '/partners/esthetician-apprenticeship/documents',
    dashboard: '/partner/board',
  },
};

const DEFAULT_REQUIREMENTS: Record<HostShopProgramType, HostShopDocumentRequirement[]> = {
  barber: [
    requirement('barber', 'ein_letter', 'IRS EIN Assignment Letter', 'IRS CP 575 or 147C letter confirming the shop EIN.'),
    requirement('barber', 'w9', 'IRS W-9', 'Completed W-9 for partner payout and tax records.'),
    requirement('barber', 'barbershop_license', 'Indiana Barbershop License', 'Current Indiana barbershop establishment license.', true),
    requirement('barber', 'workers_comp', "Workers' Compensation Certificate", "Workers' compensation certificate or valid Indiana exemption."),
    requirement('barber', 'liability_insurance', 'General Liability Insurance Certificate', 'Certificate of general liability insurance for the host shop.', true),
    requirement('barber', 'supervisor_license', 'Supervising Barber License', 'Indiana barber license for the direct apprentice supervisor.', true),
  ],
  cosmetology: [
    requirement('cosmetology', 'ein_letter', 'IRS EIN Assignment Letter', 'IRS CP 575 or 147C letter confirming the salon EIN.'),
    requirement('cosmetology', 'w9', 'IRS W-9', 'Completed W-9 for partner payout and tax records.'),
    requirement('cosmetology', 'salon_license', 'Indiana Cosmetology Salon License', 'Current Indiana cosmetology salon license.', true),
    requirement('cosmetology', 'workers_comp', "Workers' Compensation Certificate", "Workers' compensation certificate or valid Indiana exemption."),
    requirement('cosmetology', 'liability_insurance', 'General Liability Insurance Certificate', 'Certificate of general liability insurance for the host salon.', true),
    requirement('cosmetology', 'supervisor_license', 'Supervising Cosmetologist License', 'Indiana cosmetology license for the designated apprentice supervisor.', true),
  ],
  nail_technician: [
    requirement('nail_technician', 'ein_letter', 'IRS EIN Assignment Letter', 'IRS CP 575 or 147C letter confirming the salon EIN.'),
    requirement('nail_technician', 'salon_license', 'Indiana Nail Salon License', 'Current Indiana nail salon license.', true),
    requirement('nail_technician', 'workers_comp', "Workers' Compensation Certificate", "Workers' compensation certificate or valid Indiana exemption."),
    requirement('nail_technician', 'supervisor_license', 'Supervising Nail Technician License', 'Indiana nail technician license for the apprentice supervisor.', true),
    requirement('nail_technician', 'business_license', 'City/County Business License', 'Local business license or occupancy permit, if applicable.', false),
  ],
  esthetician: [
    requirement('esthetician', 'ein_letter', 'IRS EIN Assignment Letter', 'IRS CP 575 or 147C letter confirming the spa EIN.'),
    requirement('esthetician', 'salon_license', 'Indiana Esthetician Establishment License', 'Current Indiana esthetics establishment license.', true),
    requirement('esthetician', 'workers_comp', "Workers' Compensation Certificate", "Workers' compensation certificate or valid Indiana exemption."),
    requirement('esthetician', 'supervisor_license', 'Supervising Esthetician License', 'Indiana esthetician license for the apprentice supervisor.', true),
    requirement('esthetician', 'business_license', 'City/County Business License', 'Local business license or occupancy permit, if applicable.', false),
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
    const documentType = String(req.document_type ?? '');
    if (!documentType) continue;
    byType.set(documentType, { ...req, id: req.id ?? `${program}-${documentType}` });
  }

  return Array.from(byType.values());
}
