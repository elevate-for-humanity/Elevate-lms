/**
 * Program slug → O*NET SOC code mapping.
 *
 * SOC codes from O*NET-SOC 2019 taxonomy (O*NET 30.2).
 * Used to pull live labor market data for program pages.
 *
 * Reference: https://www.onetcenter.org/taxonomy.html
 * Attribution required on all pages displaying this data.
 */

export const PROGRAM_SOC_MAP: Record<string, string> = {
  // ── Skilled Trades ────────────────────────────────────────────────────────
  'hvac-technician': '49-9021.00',        // Heating, Air Conditioning, and Refrigeration Mechanics
  'hvac': '49-9021.00',
  'electrical': '47-2111.00',             // Electricians
  'plumbing': '47-2152.00',              // Plumbers, Pipefitters, and Steamfitters
  'welding': '51-4121.00',               // Welders, Cutters, Solderers, and Brazers
  'cdl-training': '53-3032.00',          // Heavy and Tractor-Trailer Truck Drivers
  'diesel-mechanic': '49-3031.00',       // Bus and Truck Mechanics and Diesel Engine Specialists
  'forklift': '53-7051.00',              // Industrial Truck and Tractor Operators
  'construction-trades-certification': '47-2061.00', // Construction Laborers
  'building-services-technician': '37-2011.00',      // Janitors and Cleaners

  // ── Healthcare ────────────────────────────────────────────────────────────
  'cna': '31-1131.00',                   // Nursing Assistants
  'certified-nursing-assistant': '31-1131.00',
  'cna-certification': '31-1131.00',
  'medical-assistant': '31-9092.00',     // Medical Assistants
  'phlebotomy': '31-9097.00',            // Phlebotomists
  'pharmacy-technician': '29-2052.00',   // Pharmacy Technicians
  'home-health-aide': '31-1121.00',      // Home Health and Personal Care Aides
  'peer-recovery-specialist': '21-1018.00', // Substance Abuse, Behavioral Disorder, and Mental Health Counselors
  'sanitation-infection-control': '31-9099.00', // Healthcare Support Workers, All Other
  'emergency-health-safety': '29-2042.00',      // Emergency Medical Technicians
  'cpr-first-aid': '29-2042.00',

  // ── Beauty / Apprenticeships ──────────────────────────────────────────────
  'barber-apprenticeship': '39-5011.00', // Barbers
  'barber': '39-5011.00',
  'cosmetology-apprenticeship': '39-5012.00', // Hairdressers, Hairstylists, and Cosmetologists
  'esthetician': '39-5094.00',           // Skincare Specialists
  'esthetician-apprenticeship': '39-5094.00',
  'nail-technician-apprenticeship': '39-5092.00', // Manicurists and Pedicurists
  'culinary-apprenticeship': '35-1011.00', // Chefs and Head Cooks

  // ── Technology ────────────────────────────────────────────────────────────
  'cybersecurity-analyst': '15-1212.00', // Information Security Analysts
  'cybersecurity': '15-1212.00',
  'it-help-desk': '15-1232.00',          // Computer User Support Specialists
  'it-support': '15-1232.00',
  'network-administration': '15-1244.00', // Network and Computer Systems Administrators
  'network-support-technician': '15-1231.00', // Computer Network Support Specialists
  'software-development': '15-1252.00',  // Software Developers
  'web-development': '15-1254.00',       // Web Developers
  'cad-drafting': '17-3013.00',          // Mechanical Drafters

  // ── Business ─────────────────────────────────────────────────────────────
  'business-administration': '11-1021.00', // General and Operations Managers
  'business': '11-1021.00',
  'bookkeeping': '43-3031.00',           // Bookkeeping, Accounting, and Auditing Clerks
  'finance-bookkeeping-accounting': '43-3031.00',
  'office-administration': '43-6014.00', // Secretaries and Administrative Assistants
  'project-management': '11-9199.00',    // Managers, All Other
  'entrepreneurship': '11-1011.00',      // Chief Executives
  'graphic-design': '27-1024.00',        // Graphic Designers
  'tax-preparation': '13-2082.00',       // Tax Preparers
  'tax-prep-financial-services': '13-2082.00',

  // ── Hospitality / Other ───────────────────────────────────────────────────
  'hospitality': '35-1012.00',           // First-Line Supervisors of Food Preparation and Serving Workers
  'technology': '15-1299.00',            // Computer Occupations, All Other
  'direct-support-professional': '21-1093.00', // Social and Human Service Assistants
  'drug-collector': '29-9099.00',        // Healthcare Practitioners and Technical Workers, All Other
};

/** Returns the SOC code for a program slug, or null if not mapped. */
export function getSocCode(slug: string): string | null {
  return PROGRAM_SOC_MAP[slug] ?? null;
}
