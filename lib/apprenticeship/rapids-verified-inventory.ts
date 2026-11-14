/**
 * Read-only observation of the authenticated U.S. DOL RAPIDS sponsor record.
 * November 1, 2026: Occupation Information, Active filter, six items.
 * This inventory establishes registration status. It does not replace signed
 * occupation outlines, verify delivery readiness or authorize learner completion.
 * CB displayed terms are RAPIDS metadata, not newly imposed fixed OJL thresholds.
 */
export const RAPIDS_VERIFIED_INVENTORY = {
  sponsor: '2Exclusive llc-s',
  registrationNumber: '2025-IN-132301',
  observedOn: '2026-11-01',
  authority: 'U.S. Department of Labor RAPIDS 2.0',
  source: 'https://entbpmp.dol.gov/suite/sites/oa',
  filter: 'Active',
  occupations: [
  {
    "title": "Barber",
    "code": "0030CB",
    "version": "V1",
    "approach": "competency-based",
    "slug": "barber-apprenticeship",
    "displayedTerm": "2,000 hours",
    "activeApprentices": 4,
    "status": "Registered",
    "probationHours": 500
  },
  {
    "title": "Esthetician",
    "code": "2089CB",
    "version": "V1",
    "approach": "competency-based",
    "slug": "esthetician-apprenticeship",
    "displayedTerm": "2,000 hours",
    "activeApprentices": 0,
    "status": "Registered",
    "probationHours": 500
  },
  {
    "title": "Hair Stylist / Cosmetologist",
    "code": "0096HY",
    "version": "V1",
    "approach": "hybrid",
    "slug": "cosmetology-apprenticeship",
    "displayedTerm": "2,000–2,500 hours",
    "activeApprentices": 4,
    "status": "Registered",
    "probationHours": 500
  },
  {
    "title": "Nail Tech / Manicurist",
    "code": "2090CB",
    "version": "V1",
    "approach": "competency-based",
    "slug": "nail-technician-apprenticeship",
    "displayedTerm": "2,000 hours",
    "activeApprentices": 0,
    "status": "Registered",
    "probationHours": 500
  },
  {
    "title": "Building Services Technician",
    "code": "0688CB",
    "version": "V1",
    "approach": "competency-based",
    "slug": "building-services-technician",
    "displayedTerm": "6,000 hours",
    "activeApprentices": 0,
    "status": "Registered",
    "probationHours": 500
  },
  {
    "title": "Youth Culinary / Production Cook",
    "code": "3010CB",
    "version": "V1",
    "approach": "competency-based",
    "slug": "culinary-apprenticeship",
    "displayedTerm": "2,000 hours",
    "activeApprentices": 0,
    "status": "Registered",
    "probationHours": 500
  }
]
} as const;
