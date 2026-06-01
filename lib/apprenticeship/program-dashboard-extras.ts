/**
 * Per-program copy and compliance links for apprenticeship portal dashboards.
 */

export interface ProgramDashboardExtras {
  brandSubtitle?: string;
  rtiCourseTitle?: string;
  complianceBasePath?: string;
}

const EXTRAS: Record<string, ProgramDashboardExtras> = {
  'barber-apprenticeship': {
    brandSubtitle: 'Prestige Elevation™ — Indiana Barber RTI',
    rtiCourseTitle: 'Barber Apprenticeship RTI',
    complianceBasePath: '/compliance/competency-verification/barber',
  },
  'cosmetology-apprenticeship': {
    brandSubtitle: 'Indiana Cosmetology Apprenticeship RTI',
    rtiCourseTitle: 'Cosmetology Apprenticeship RTI',
    complianceBasePath: '/compliance/competency-verification/cosmetology',
  },
  'esthetician-apprenticeship': {
    brandSubtitle: 'Indiana Esthetician Apprenticeship RTI',
    rtiCourseTitle: 'Esthetician Apprenticeship RTI',
  },
  'nail-technician-apprenticeship': {
    brandSubtitle: 'Indiana Nail Technician Apprenticeship RTI',
    rtiCourseTitle: 'Nail Technician Apprenticeship RTI',
  },
  'culinary-apprenticeship': {
    brandSubtitle: 'Indiana Culinary Apprenticeship RTI',
    rtiCourseTitle: 'Culinary Apprenticeship RTI',
  },
  electrical: {
    brandSubtitle: 'Indiana Electrical Apprenticeship RTI',
    rtiCourseTitle: 'Electrical Apprenticeship RTI',
  },
  plumbing: {
    brandSubtitle: 'Indiana Plumbing Apprenticeship RTI',
    rtiCourseTitle: 'Plumbing Apprenticeship RTI',
  },
};

export function getProgramDashboardExtras(programSlug: string): ProgramDashboardExtras {
  return EXTRAS[programSlug] ?? {};
}

export function complianceLinksForProgram(programSlug: string): { label: string; href: string }[] {
  const base = EXTRAS[programSlug]?.complianceBasePath;
  if (!base) return [];
  return [
    { label: 'OJT hours log', href: `${base}/ojt-hours-log` },
    { label: 'Competency verification', href: base },
    { label: 'Monthly OJT evaluation', href: `${base}/monthly-ojt-evaluation` },
  ];
}
