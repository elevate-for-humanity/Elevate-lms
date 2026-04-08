/**
 * EPA 608 testing partners for Elevate Testing Center.
 *
 * Status meanings:
 *   pending  — application submitted, awaiting partner review
 *   approved — partner approved, proctor ID not yet issued
 *   active   — proctor ID issued, exams can be administered
 *
 * Admin only — never render partner contact details on public pages.
 */

import type { EpaPartner } from '@/types/epa';

export const EPA_PARTNERS: EpaPartner[] = [
  {
    key:         'mainstream_epatest',
    company:     'Mainstream Engineering Corporation (EPATest)',
    contactName: 'Missy Tucker-Simmen',
    email:       'info@epatest.com',
    phone:       '321-631-3550 ext. 5404',
    status:      'active',
    notes: [
      'Proctor ID issued — active authorized site.',
      'EPA 608 Universal Certification available via online and paper exam.',
      'Free student study kits included by vendor at no additional charge.',
      'Online exams include unlimited retakes at the vendor platform level.',
      'Additional self-paced certifications available once active: R-410a, PMTech, Indoor Air Quality, Green, 609, HC/HFO.',
      'Online exam vendor base: $26.51. Paper exam vendor base: $31.82.',
    ],
  },
];

/**
 * Returns the active EPA partner, or null if none are active yet.
 * Use this to gate public-facing EPA online enrollment — don't show
 * the online enrollment flow until the partner status is 'active'.
 */
export function getActiveEpaPartner(): EpaPartner | null {
  return EPA_PARTNERS.find(p => p.status === 'active') ?? null;
}

/**
 * Admin helper — returns margin dollars and percent for a product.
 * Never call this from public-facing components.
 */
export function getMargin(
  vendorBase: number,
  retailPrice: number
): { dollars: number; percent: number } {
  const dollars  = Number((retailPrice - vendorBase).toFixed(2));
  const percent  = vendorBase > 0
    ? Number((((retailPrice - vendorBase) / retailPrice) * 100).toFixed(1))
    : 0;
  return { dollars, percent };
}
