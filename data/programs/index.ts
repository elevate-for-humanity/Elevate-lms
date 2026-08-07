/**
 * Static program data registry.
 *
 * Maps slug -> ProgramSchema for all programs that have a static data file.
 * Public reads are normalized through getStaticProgram() so stale funding flags
 * inside old program files cannot leak into the website.
 */

import type { FundingType, ProgramSchema } from '@/lib/programs/program-schema';
import { getVerifiedProgramFunding, isStrictWorkforceFundedProgram } from '@/lib/programs/funding-registry';
import { BOOKKEEPING } from './bookkeeping';
import { BUSINESS_ADMIN } from './business-administration';
import { CAD_DRAFTING } from './cad-drafting';
import { CONSTRUCTION_TRADES } from './construction-trades-certification';
import { CPR_FIRST_AID } from './cpr-first-aid';
import { CYBERSECURITY_ANALYST } from './cybersecurity-analyst';
import { DIESEL_MECHANIC } from './diesel-mechanic';
import { EMERGENCY_HEALTH_SAFETY } from './emergency-health-safety';
import { ENTREPRENEURSHIP } from './entrepreneurship';
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

const STATIC_PROGRAMS: ProgramSchema[] = [
  BARBER_APPRENTICESHIP, HVAC_TECHNICIAN, CDL_TRAINING, MEDICAL_ASSISTANT,
  COSMETOLOGY, CNA, ESTHETICIAN, NAIL_TECH, CULINARY, SANITATION, PEER_RECOVERY,
  QMA, PHLEBOTOMY, HOSPITALITY, TECHNOLOGY, BOOKKEEPING, BUSINESS_ADMIN,
  CAD_DRAFTING, CONSTRUCTION_TRADES, CPR_FIRST_AID, CYBERSECURITY_ANALYST,
  DIESEL_MECHANIC, EMERGENCY_HEALTH_SAFETY, ENTREPRENEURSHIP, GRAPHIC_DESIGN,
  HOME_HEALTH_AIDE, IT_HELP_DESK, NETWORK_ADMIN, NETWORK_SUPPORT,
  OFFICE_ADMINISTRATION, PHARMACY_TECHNICIAN, PROJECT_MANAGEMENT, SOFTWARE_DEV,
  WEB_DEVELOPMENT,
];

export const STATIC_PROGRAM_MAP: ReadonlyMap<string, ProgramSchema> = new Map(
  STATIC_PROGRAMS.map((p) => [p.slug, p]),
);

function hasNumericSelfPayPrice(program: ProgramSchema): boolean {
  const amount = Number(String(program.selfPayCost || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) && amount > 0;
}

/**
 * Public-safe ProgramSchema.
 *
 * Funding rule:
 * - WIOA/WRG only when the strict 2Exclusive ETPL + 3-star Top Jobs registry says yes.
 * - Everything else is presented as regular/self-pay.
 *
 * Payment rule:
 * - Every program with a numeric self-pay price gets the canonical Stripe checkout
 *   route, calculator, promotion-code field, and eligible BNPL methods.
 */
function normalizePublicProgram(program: ProgramSchema): ProgramSchema {
  const verified = getVerifiedProgramFunding(program.slug);
  const workforceFunded = isStrictWorkforceFundedProgram(program.slug);
  const fundingOptions: FundingType[] = ['self_pay'];
  if (workforceFunded && verified?.wioaEligible) fundingOptions.unshift('wioa');
  if (workforceFunded && verified?.wrgEligible) fundingOptions.unshift('wrg');

  return {
    ...program,
    isSelfPay: !workforceFunded,
    fundingOptions,
    fundingStatement: workforceFunded
      ? 'Verified workforce-funded pathway. WorkOne determines participant eligibility and must authorize WIOA or Workforce Ready Grant funding before funded enrollment. Self-pay remains available.'
      : 'Regular self-pay program. This program is not currently advertised as WIOA or Workforce Ready Grant eligible under Elevate’s strict 2Exclusive ETPL + 3-star Top Jobs verification rule.',
    badge: workforceFunded ? 'Verified Workforce-Funded' : 'Self-Pay Program',
    badgeColor: workforceFunded ? 'green' : 'blue',
    funding: {
      ...(program.funding ?? {
        fssa_eligible: false,
        wioa_eligible: false,
        wrg_eligible: false,
      }),
      fssa_eligible: false,
      wioa_eligible: Boolean(workforceFunded && verified?.wioaEligible),
      wrg_eligible: Boolean(workforceFunded && verified?.wrgEligible),
      etpl_approved: Boolean(verified?.etplListedFor2Exclusive),
      jobReadyIndyEligible: false,
      fundingNotes: verified?.sourceNote ?? 'No verified WIOA/WRG public funding record for this program.',
    },
    enrollmentTracks: undefined,
    cta: {
      ...program.cta,
      stripeCheckoutHref: hasNumericSelfPayPrice(program) ? '/api/checkout/program' : program.cta.stripeCheckoutHref,
    },
  };
}

export function getStaticProgram(slug: string): ProgramSchema | undefined {
  const program = STATIC_PROGRAM_MAP.get(slug);
  return program ? normalizePublicProgram(program) : undefined;
}
