import type { ProgramSchema } from '@/lib/programs/program-schema';
import { HVAC_TECHNICIAN } from './hvac-technician';
import { PHARMACY_TECHNICIAN } from './pharmacy-technician';
import { BARBER_APPRENTICESHIP } from './barber-apprenticeship';
import { CNA } from './cna';
import { IT_HELP_DESK } from './it-help-desk';
import { CYBERSECURITY_ANALYST } from './cybersecurity-analyst';
import { BOOKKEEPING } from './bookkeeping';
import { OFFICE_ADMINISTRATION } from './office-administration';

/**
 * Program Catalog — All programs grouped by sector.
 * Add new programs here. The catalog page renders from this array.
 */
export const ALL_PROGRAMS: ProgramSchema[] = [
  HVAC_TECHNICIAN,
  PHARMACY_TECHNICIAN,
  BARBER_APPRENTICESHIP,
  CNA,
  IT_HELP_DESK,
  CYBERSECURITY_ANALYST,
  BOOKKEEPING,
  OFFICE_ADMINISTRATION,
];

export const SECTORS = [
  { key: 'skilled-trades', label: 'Skilled Trades', description: 'Hands-on technical training in construction, HVAC, electrical, and welding.' },
  { key: 'healthcare', label: 'Healthcare', description: 'Clinical and patient care training leading to nationally recognized certifications.' },
  { key: 'personal-services', label: 'Personal Services', description: 'Licensed trade programs in barbering, cosmetology, and personal care.' },
  { key: 'technology', label: 'Technology', description: 'IT support, cybersecurity, and software development pathways.' },
  { key: 'business', label: 'Business & Office', description: 'Office administration, bookkeeping, and business management.' },
] as const;

export function getProgramsBySector(sector: string): ProgramSchema[] {
  return ALL_PROGRAMS.filter((p) => p.sector === sector);
}

export function getProgramBySlug(slug: string): ProgramSchema | undefined {
  return ALL_PROGRAMS.find((p) => p.slug === slug);
}
