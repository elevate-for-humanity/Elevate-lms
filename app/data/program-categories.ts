/**
 * Program Categories and Organization
 * Defines how programs are grouped in navigation
 */

export type ProgramCategory = {
  slug: string;
  name: string;
  description: string;
  programs: string[]; // Array of program slugs
};

export const programCategories: ProgramCategory[] = [
  {
    slug: 'apprenticeships',
    name: 'Apprenticeship Programs',
    description: 'Earn while you learn with paid apprenticeships in skilled trades',
    programs: [
      'barber-apprenticeship',
      'cosmetology-apprenticeship',
      'hvac-technician',
      'culinary-apprenticeship',
    ],
  },
  {
    slug: 'healthcare',
    name: 'Healthcare',
    description: 'Nationally credentialed healthcare training programs',
    programs: [
      'cna',
      'medical-assistant',
      'peer-recovery-specialist',
      'cpr-first-aid',
    ],
  },
  {
    slug: 'trades',
    name: 'Skilled Trades',
    description: 'Hands-on training in high-demand trade careers',
    programs: [
      'hvac-technician',
      'electrical',
      'plumbing',
      'welding',
      'construction-trades-certification',
    ],
  },
  {
    slug: 'technology',
    name: 'Technology',
    description: 'IT certifications and technology career pathways',
    programs: [
      'it-help-desk',
      'cybersecurity-analyst',
      'network-administration',
      'network-support-technician',
      'software-development',
    ],
  },
  {
    slug: 'transportation',
    name: 'Transportation & Logistics',
    description: 'CDL and commercial driving certification',
    programs: [
      'cdl-training',
    ],
  },
  {
    slug: 'business',
    name: 'Business & Professional',
    description: 'Business, finance, and professional development programs',
    programs: [
      'business',
      'entrepreneurship',
      'tax-preparation',
      'finance-bookkeeping-accounting',
      'bookkeeping',
      'office-administration',
      'project-management',
    ],
  },
];

export function getCategoryBySlug(slug: string): ProgramCategory | undefined {
  return programCategories.find((cat) => cat.slug === slug);
}

export function getCategoryForProgram(
  programSlug: string
): ProgramCategory | undefined {
  return programCategories.find((cat) => cat.programs.includes(programSlug));
}
