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
    key: 'mainstream_epatest',
    company: 'Mainstream Engineering Corporation (EPATest)',
    contactName: 'Missy Tucker-Simmen',
    email: 'info@epatest.com',
    phone: '321-631-3550 ext. 5404',
    status: 'active',
    // ADMIN ONLY — NEVER share or display this ID publicly.
    proctorId: 'SYZXYXSE',
    notes: [
      'Proctor ID issued — active authorized site. Account holder: Elizabeth Greene.',
      'Login: www.epatest.com → PROCTOR ACCESS tab → Proctor ID + last name (Greene).',
      'To start an exam: locate candidate by last name or confirmation code, verify ID, launch session.',
      'Course materials: log in → EDUCATION → "start here" next to QV5210 (QwikProducts 15-week course). Download full course or by section. Includes syllabus, test bank, and weekly slides.',
      'Free student study kits available — contact Missy to order for each semester.',
      'Optional: 200+ page Reference Manual available at cost ($31.82 vendor / $98 retail).',
      'Online exam vendor base: $26.51 (unlimited retakes included at vendor level).',
      'Paper exam vendor base: $31.82.',
      'Additional self-paced certifications available: R-410a, PMTech, Indoor Air Quality, Green, 609, HC/HFO.',
    ],
  },
];

/**
 * Returns the active EPA partner, or null if none are active yet.
 * Use this to gate public-facing EPA online enrollment — don't show
 * the online enrollment flow until the partner status is 'active'.
 */
export function getActiveEpaPartner(): EpaPartner | null {
  return EPA_PARTNERS.find((p) => p.status === 'active') ?? null;
}

/**
 * Admin helper — returns margin dollars and percent for a product.
 * Never call this from public-facing components.
 */
export function getMargin(
  vendorBase: number,
  retailPrice: number,
): { dollars: number; percent: number } {
  const dollars = Number((retailPrice - vendorBase).toFixed(2));
  const percent =
    vendorBase > 0 ? Number((((retailPrice - vendorBase) / retailPrice) * 100).toFixed(1)) : 0;
  return { dollars, percent };
}
