import type { ProgramSchema } from '@/lib/programs/program-schema';
import { HVAC_TECHNICIAN } from './hvac-technician';
import { PHARMACY_TECHNICIAN } from './pharmacy-technician';
import { BARBER_APPRENTICESHIP } from './barber-apprenticeship';
import { CNA } from './cna';
import { IT_HELP_DESK } from './it-help-desk';
import { CYBERSECURITY_ANALYST } from './cybersecurity-analyst';
import { BOOKKEEPING } from './bookkeeping';
import { OFFICE_ADMINISTRATION } from './office-administration';
import { CONSTRUCTION_TRADES } from './construction-trades-certification';
import { NETWORK_SUPPORT } from './network-support-technician';
import { WEB_DEVELOPMENT } from './web-development';
import { PEER_RECOVERY } from './peer-recovery-specialist';
import { CDL_TRAINING } from './cdl-training';
import { WELDING } from './welding';
import { ELECTRICAL } from './electrical';
import { MEDICAL_ASSISTANT } from './medical-assistant';
import { PHLEBOTOMY } from './phlebotomy';
import { PLUMBING } from './plumbing';
import { DIESEL_MECHANIC } from './diesel-mechanic';
import { FORKLIFT } from './forklift';
import { COSMETOLOGY } from './cosmetology-apprenticeship';
import { NAIL_TECH } from './nail-technician-apprenticeship';
import { BEAUTY_CAREER_EDUCATOR } from './beauty-career-educator';
import { EMERGENCY_HEALTH_SAFETY } from './emergency-health-safety';
import { HOME_HEALTH_AIDE } from './home-health-aide';
import { ESTHETICIAN } from './esthetician';
import { CULINARY } from './culinary-apprenticeship';
import { CPR_FIRST_AID } from './cpr-first-aid';
import { SANITATION } from './sanitation-infection-control';
import { TAX_PREPARATION } from './tax-preparation';
import { BUSINESS_ADMIN } from './business-administration';
import { ENTREPRENEURSHIP } from './entrepreneurship';
import { PROJECT_MANAGEMENT } from './project-management';
import { GRAPHIC_DESIGN } from './graphic-design';
import { SOFTWARE_DEV } from './software-development';
import { CAD_DRAFTING } from './cad-drafting';
import { NETWORK_ADMIN } from './network-administration';

/**
 * Program Catalog — All programs grouped by sector.
 * Add new programs here. The catalog page renders from this array.
 */
export const ALL_PROGRAMS: ProgramSchema[] = [
  // Healthcare
  CNA,
  MEDICAL_ASSISTANT,
  PHLEBOTOMY,
  PHARMACY_TECHNICIAN,
  PEER_RECOVERY,
  CPR_FIRST_AID,
  SANITATION,
  EMERGENCY_HEALTH_SAFETY,
  HOME_HEALTH_AIDE,
  // Skilled Trades
  HVAC_TECHNICIAN,
  ELECTRICAL,
  WELDING,
  PLUMBING,
  CONSTRUCTION_TRADES,
  DIESEL_MECHANIC,
  FORKLIFT,
  // Transportation
  CDL_TRAINING,
  // Personal Services
  BARBER_APPRENTICESHIP,
  COSMETOLOGY,
  NAIL_TECH,
  CULINARY,
  BEAUTY_CAREER_EDUCATOR,
  ESTHETICIAN,
  // Technology
  IT_HELP_DESK,
  CYBERSECURITY_ANALYST,
  NETWORK_SUPPORT,
  NETWORK_ADMIN,
  WEB_DEVELOPMENT,
  SOFTWARE_DEV,
  GRAPHIC_DESIGN,
  CAD_DRAFTING,
  // Business
  BOOKKEEPING,
  OFFICE_ADMINISTRATION,
  TAX_PREPARATION,
  BUSINESS_ADMIN,
  ENTREPRENEURSHIP,
  PROJECT_MANAGEMENT,
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
