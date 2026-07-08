/**
 * Static program data registry.
 *
 * Maps slug -> ProgramSchema for all programs that have a static data file.
 * Used by app/programs/[slug]/page.tsx to serve these programs without
 * a separate page.tsx per program (reduces webpack entry points by 22).
 */

import type { ProgramSchema } from '@/lib/programs/program-schema';
import { BOOKKEEPING } from './bookkeeping';
import { BUSINESS_ADMIN } from './business-administration';
import { CAD_DRAFTING } from './cad-drafting';
import { CONSTRUCTION_TRADES } from './construction-trades-certification';
import { CPR_FIRST_AID } from './cpr-first-aid';
import { CYBERSECURITY_ANALYST } from './cybersecurity-analyst';
import { DIESEL_MECHANIC } from './diesel-mechanic';
import { EMERGENCY_HEALTH_SAFETY } from './emergency-health-safety';
import { ENTREPRENEURSHIP } from './entrepreneurship';
import { FORKLIFT } from './forklift';
import { GRAPHIC_DESIGN } from './graphic-design';
import { HOME_HEALTH_AIDE } from './home-health-aide';
import { IT_HELP_DESK } from './it-help-desk';
import { NETWORK_ADMIN } from './network-administration';
import { NETWORK_SUPPORT } from './network-support-technician';
import { OFFICE_ADMINISTRATION } from './office-administration';
import { PHARMACY_TECHNICIAN } from './pharmacy-technician';
import { PROJECT_MANAGEMENT } from './project-management';
import { SOFTWARE_DEV } from './software-development';
import { WEB_DEVELOPMENT } from './web-development';
import { WELDING } from './welding';
import { PLUMBING } from './plumbing';
import { ELECTRICAL } from './electrical';
import { CDL_TRAINING } from './cdl-training';
import { MEDICAL_ASSISTANT } from './medical-assistant';
import { COSMETOLOGY } from './cosmetology-apprenticeship';
import { CNA } from './cna';
import { ESTHETICIAN } from './esthetician';
import { NAIL_TECH } from './nail-technician-apprenticeship';
import { CULINARY } from './culinary-apprenticeship';
import { SANITATION } from './sanitation-infection-control';
import { PEER_RECOVERY } from './peer-recovery-specialist';
import { HVAC_TECHNICIAN } from './hvac-technician';
import { BARBER_APPRENTICESHIP } from './barber-apprenticeship';
import { PHLEBOTOMY } from './phlebotomy';
import { HOSPITALITY } from './hospitality';
import { TECHNOLOGY } from './technology';
import { QMA } from './qma';
import { BEAUTY_CAREER_EDUCATOR } from './beauty-career-educator';

const STATIC_PROGRAMS: ProgramSchema[] = [
  // Programs with dedicated page.tsx - registered here for [slug] fallback and sitemap
  BARBER_APPRENTICESHIP,
  HVAC_TECHNICIAN,
  WELDING,
  PLUMBING,
  ELECTRICAL,
  CDL_TRAINING,
  MEDICAL_ASSISTANT,
  COSMETOLOGY,
  CNA,
  ESTHETICIAN,
  NAIL_TECH,
  CULINARY,
  SANITATION,
  PEER_RECOVERY,
  // Programs served via [slug]/page.tsx dynamic renderer
  QMA,
  PHLEBOTOMY,
  HOSPITALITY,
  TECHNOLOGY,
  BOOKKEEPING,
  BUSINESS_ADMIN,
  CAD_DRAFTING,
  CONSTRUCTION_TRADES,
  CPR_FIRST_AID,
  CYBERSECURITY_ANALYST,
  DIESEL_MECHANIC,
  EMERGENCY_HEALTH_SAFETY,
  ENTREPRENEURSHIP,
  FORKLIFT,
  GRAPHIC_DESIGN,
  HOME_HEALTH_AIDE,
  IT_HELP_DESK,
  NETWORK_ADMIN,
  NETWORK_SUPPORT,
  OFFICE_ADMINISTRATION,
  PHARMACY_TECHNICIAN,
  PROJECT_MANAGEMENT,
  SOFTWARE_DEV,
  WEB_DEVELOPMENT,
  BEAUTY_CAREER_EDUCATOR,
];

/** Slug-keyed map for O(1) lookup. */
export const STATIC_PROGRAM_MAP: ReadonlyMap<string, ProgramSchema> = new Map(
  STATIC_PROGRAMS.map((p) => [p.slug, p]),
);

/** Returns the static ProgramSchema for a slug, or undefined if not found. */
export function getStaticProgram(slug: string): ProgramSchema | undefined {
  return STATIC_PROGRAM_MAP.get(slug);
}
