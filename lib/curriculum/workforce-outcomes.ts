/**
 * lib/curriculum/workforce-outcomes.ts
 *
 * O*NET / DOL workforce outcome alignment.
 *
 * Maps Elevate programs to real occupational data from O*NET OnLine.
 * Used by the pathway orchestrator to prove employer relevance and
 * generate accurate workforce outcome statements.
 *
 * O*NET API: https://services.onetcenter.org/ws
 * Requires: ONET_API_KEY (free registration at https://services.onetcenter.org)
 *
 * Static fallback: pre-mapped SOC codes for all current Elevate programs.
 * The static map is used when the API is unavailable or unconfigured.
 */

import { logger } from '@/lib/logger';

// ── Static SOC code map for all current Elevate programs ─────────────────────
// Source: O*NET OnLine — verified against current program offerings

export interface WorkforceOutcome {
  socCode: string;
  title: string;
  medianWage: number; // Annual, USD
  projectedGrowth: string; // e.g. "Much faster than average (15%+)"
  typicalEducation: string;
  topEmployers: string[];
  relatedCertifications: string[];
  indianaJobOpenings?: number; // Approximate annual openings in Indiana
}

export const PROGRAM_WORKFORCE_OUTCOMES: Record<string, WorkforceOutcome> = {
  'cna': {
    socCode: '31-1131.00',
    title: 'Nursing Assistants',
    medianWage: 38200,
    projectedGrowth: 'Faster than average (5-8%)',
    typicalEducation: 'Postsecondary nondegree award',
    topEmployers: ['IU Health', 'Ascension St. Vincent', 'Community Health Network', 'Kindred Healthcare', 'Trilogy Health Services'],
    relatedCertifications: ['Indiana CNA License (ISDH)', 'CPR/BLS', 'Alzheimer\'s Care Certificate'],
    indianaJobOpenings: 4200,
  },
  'medical-assistant': {
    socCode: '31-9092.00',
    title: 'Medical Assistants',
    medianWage: 42000,
    projectedGrowth: 'Much faster than average (15%+)',
    typicalEducation: 'Postsecondary nondegree award',
    topEmployers: ['IU Health', 'Eskenazi Health', 'Community Health Network', 'Franciscan Health', 'American Health Network'],
    relatedCertifications: ['CCMA (NHA)', 'CMA (AAMA)', 'CPR/BLS'],
    indianaJobOpenings: 2800,
  },
  'qma': {
    socCode: '31-9092.00',
    title: 'Medication Aides / Qualified Medication Aides',
    medianWage: 40000,
    projectedGrowth: 'Faster than average',
    typicalEducation: 'Postsecondary nondegree award',
    topEmployers: ['Trilogy Health Services', 'American Senior Communities', 'Signature Healthcare', 'Diversicare'],
    relatedCertifications: ['Indiana QMA License (ISDH)', 'CNA License'],
    indianaJobOpenings: 1200,
  },
  'hvac-technician': {
    socCode: '49-9021.00',
    title: 'Heating, Air Conditioning, and Refrigeration Mechanics and Installers',
    medianWage: 57300,
    projectedGrowth: 'Faster than average (6-9%)',
    typicalEducation: 'Postsecondary nondegree award',
    topEmployers: ['Carrier', 'Trane Technologies', 'Johnson Controls', 'Service Experts', 'One Hour Heating & Air Conditioning'],
    relatedCertifications: ['EPA 608 Universal', 'NATE Certification', 'R-410A Safety'],
    indianaJobOpenings: 1800,
  },
  'barber-apprenticeship': {
    socCode: '39-5011.00',
    title: 'Barbers',
    medianWage: 38000,
    projectedGrowth: 'Average (3-5%)',
    typicalEducation: 'Postsecondary nondegree award',
    topEmployers: ['Sport Clips', 'Great Clips', 'Floyd\'s 99 Barbershop', 'Independent salon owners'],
    relatedCertifications: ['Indiana Barber License (PLA)', 'Barbicide Certification'],
    indianaJobOpenings: 600,
  },
  'cosmetology-apprenticeship': {
    socCode: '39-5012.00',
    title: 'Hairdressers, Hairstylists, and Cosmetologists',
    medianWage: 35000,
    projectedGrowth: 'Average',
    typicalEducation: 'Postsecondary nondegree award',
    topEmployers: ['Great Clips', 'Supercuts', 'Regis Salons', 'Independent salon owners'],
    relatedCertifications: ['Indiana Cosmetology License (PLA)'],
    indianaJobOpenings: 900,
  },
  'it-help-desk': {
    socCode: '15-1232.00',
    title: 'Computer User Support Specialists',
    medianWage: 57910,
    projectedGrowth: 'Average (5%)',
    typicalEducation: 'Some college, no degree',
    topEmployers: ['Salesforce', 'Amazon', 'Eli Lilly', 'Cummins', 'Rolls-Royce', 'Geek Squad'],
    relatedCertifications: ['CompTIA A+', 'Google IT Support Certificate', 'MTA: Windows OS', 'IC3 Digital Literacy'],
    indianaJobOpenings: 2100,
  },
  'cybersecurity-analyst': {
    socCode: '15-1212.00',
    title: 'Information Security Analysts',
    medianWage: 112000,
    projectedGrowth: 'Much faster than average (32%)',
    typicalEducation: "Bachelor's degree",
    topEmployers: ['Salesforce', 'Eli Lilly', 'OneAmerica', 'Anthem', 'Rolls-Royce', 'US Government'],
    relatedCertifications: ['CompTIA Security+', 'Google Cybersecurity Certificate', 'SC-900', 'AZ-900'],
    indianaJobOpenings: 1400,
  },
  'peer-recovery-specialist': {
    socCode: '21-1018.00',
    title: 'Substance Abuse, Behavioral Disorder, and Mental Health Counselors',
    medianWage: 49710,
    projectedGrowth: 'Much faster than average (18%)',
    typicalEducation: 'Bachelor\'s degree',
    topEmployers: ['Eskenazi Health', 'Volunteers of America', 'Centerstone', 'Aspire Indiana', 'FSSA'],
    relatedCertifications: ['Indiana CPRS (ICAADA)', 'Mental Health First Aid', 'NARCAN Training'],
    indianaJobOpenings: 1600,
  },
  'welding': {
    socCode: '51-4121.00',
    title: 'Welders, Cutters, Solderers, and Brazers',
    medianWage: 47010,
    projectedGrowth: 'Average (3%)',
    typicalEducation: 'High school diploma or equivalent',
    topEmployers: ['Cummins', 'Rolls-Royce', 'Toyota', 'Honda', 'Subaru', 'Steel Technologies'],
    relatedCertifications: ['AWS D1.1 Structural Welding', 'AWS SENSE', 'OSHA 10'],
    indianaJobOpenings: 2400,
  },
  'finance-bookkeeping-accounting': {
    socCode: '43-3031.00',
    title: 'Bookkeeping, Accounting, and Auditing Clerks',
    medianWage: 45860,
    projectedGrowth: 'Declining (-5%) — offset by QuickBooks/tech skills demand',
    typicalEducation: 'Some college, no degree',
    topEmployers: ['Small businesses', 'Accounting firms', 'Healthcare organizations', 'Nonprofits'],
    relatedCertifications: ['QuickBooks ProAdvisor', 'MOS Excel Expert', 'Intuit Bookkeeping Certificate'],
    indianaJobOpenings: 1800,
  },
  'community-health-worker': {
    socCode: '21-1094.00',
    title: 'Community Health Workers',
    medianWage: 46190,
    projectedGrowth: 'Much faster than average (14%)',
    typicalEducation: 'High school diploma or equivalent',
    topEmployers: ['FSSA', 'Eskenazi Health', 'IU Health', 'Community health centers', 'Nonprofits'],
    relatedCertifications: ['Indiana CHW Certificate', 'Mental Health First Aid', 'CPR/BLS'],
    indianaJobOpenings: 800,
  },
};

// ── O*NET API integration ─────────────────────────────────────────────────────

export async function getONETOccupation(socCode: string): Promise<any | null> {
  const apiKey = process.env.ONET_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://services.onetcenter.org/ws/online/occupations/${socCode}`,
      {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json',
        },
      },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    logger.warn('[workforce-outcomes] O*NET API unavailable', err);
    return null;
  }
}

/**
 * Get workforce outcome for a program slug.
 * Returns static data first, enriches with live O*NET data if API key is set.
 */
export async function getWorkforceOutcome(programSlug: string): Promise<WorkforceOutcome | null> {
  const staticOutcome = PROGRAM_WORKFORCE_OUTCOMES[programSlug];
  if (!staticOutcome) return null;

  // Try to enrich with live O*NET data
  const liveData = await getONETOccupation(staticOutcome.socCode);
  if (liveData?.median_wage) {
    return { ...staticOutcome, medianWage: liveData.median_wage };
  }

  return staticOutcome;
}

/**
 * Build a workforce outcome context string for AI prompt injection.
 */
export function buildWorkforceOutcomeContext(programSlug: string): string {
  const outcome = PROGRAM_WORKFORCE_OUTCOMES[programSlug];
  if (!outcome) return '';

  return `
## Workforce Outcome: ${outcome.title}

- SOC Code: ${outcome.socCode}
- Median Annual Wage: $${outcome.medianWage.toLocaleString()}
- Job Growth: ${outcome.projectedGrowth}
- Indiana Annual Openings: ~${outcome.indianaJobOpenings?.toLocaleString() ?? 'N/A'}
- Top Employers: ${outcome.topEmployers.slice(0, 4).join(', ')}
- Related Certifications: ${outcome.relatedCertifications.join(', ')}

All course content should align with the skills and tasks required for this occupation.
`.trim();
}
