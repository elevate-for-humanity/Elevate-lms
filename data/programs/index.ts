/**
 * Static program data registry.
 *
 * Maps slug -> ProgramSchema for programs with a static data file. Public reads
 * are normalized through normalizePublicProgram() so stale funding or federal
 * apprenticeship claims inside old program files cannot leak into production.
 */

import type { FundingType, ProgramSchema } from '@/lib/programs/program-schema';
import {
  getVerifiedProgramFunding,
  isStrictWorkforceFundedProgram,
} from '@/lib/programs/funding-registry';
import { sanitizePublicFundingText } from '@/lib/programs/public-funding-copy';
import { isRAPIDSProgram } from '@/lib/compliance/rapids-config';
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
import { ESTHETICIAN_APPRENTICESHIP } from './esthetician-apprenticeship';
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
  BARBER_APPRENTICESHIP,
  HVAC_TECHNICIAN,
  CDL_TRAINING,
  MEDICAL_ASSISTANT,
  COSMETOLOGY,
  CNA,
  ESTHETICIAN,
  ESTHETICIAN_APPRENTICESHIP,
  NAIL_TECH,
  CULINARY,
  SANITATION,
  PEER_RECOVERY,
  QMA,
  PHLEBOTOMY,
  HOSPITALITY,
  TECHNOLOGY,
  BUSINESS_ADMIN,
  CAD_DRAFTING,
  CONSTRUCTION_TRADES,
  CPR_FIRST_AID,
  CYBERSECURITY_ANALYST,
  DIESEL_MECHANIC,
  EMERGENCY_HEALTH_SAFETY,
  ENTREPRENEURSHIP,
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
];

export const STATIC_PROGRAM_MAP: ReadonlyMap<string, ProgramSchema> = new Map(
  STATIC_PROGRAMS.map((program) => [program.slug, program]),
);

function hasNumericSelfPayPrice(program: ProgramSchema): boolean {
  const amount = Number(String(program.selfPayCost || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) && amount > 0;
}

function looksLikeApprenticeship(program: ProgramSchema): boolean {
  return program.programType === 'apprenticeship' || /apprenticeship/i.test(program.slug) || /apprenticeship/i.test(program.title);
}

function replaceUnverifiedRegisteredLanguage(text: string | undefined, slug: string): string {
  if (!text || isRAPIDSProgram(slug)) return text || '';
  return text
    .replace(/DOL[-\s]?registered/gi, 'work-based training')
    .replace(/U\.S\. Department of Labor Registered Apprenticeship/gi, 'work-based training pathway')
    .replace(/federally registered apprenticeship/gi, 'work-based training pathway')
    .replace(/registered apprenticeship/gi, 'training pathway')
    .replace(/RAPIDS[-\s]registered/gi, 'training-pathway')
    .replace(/RAPIDS program/gi, 'training program');
}

function publicTitle(program: ProgramSchema): string {
  if (!looksLikeApprenticeship(program) || isRAPIDSProgram(program.slug)) return program.title;
  return program.title.replace(/\s*Apprenticeship\b/gi, ' Training Pathway').replace(/\s+/g, ' ').trim();
}

export function normalizePublicProgram(program: ProgramSchema): ProgramSchema {
  const verifiedFunding = getVerifiedProgramFunding(program.slug);
  const workforceFunded = isStrictWorkforceFundedProgram(program.slug);
  const canonicalSlug = verifiedFunding?.slug ?? program.slug;
  const registered = isRAPIDSProgram(canonicalSlug);
  const apprenticeshipLike = looksLikeApprenticeship(program);
  const copyFallback = verifiedFunding?.description ?? `${publicTitle(program)} career training.`;
  const fundingOptions: FundingType[] = ['self_pay'];
  if (workforceFunded && verifiedFunding?.wioaEligible) fundingOptions.unshift('wioa');
  if (workforceFunded && verifiedFunding?.wrgEligible) fundingOptions.unshift('wrg');

  const normalizeCopy = (value: string | undefined, fallback = '') => {
    const fundingSafe = sanitizePublicFundingText(value || '', canonicalSlug, fallback);
    return replaceUnverifiedRegisteredLanguage(fundingSafe, canonicalSlug);
  };

  const normalizedTitle = publicTitle({ ...program, slug: canonicalSlug });
  const registrationDisclosure =
    apprenticeshipLike && !registered
      ? 'This page describes a training pathway. Federal Registered Apprenticeship/RAPIDS status is not currently published for this program in Elevate’s canonical RAPIDS registry.'
      : null;

  return {
    ...program,
    slug: canonicalSlug,
    title: normalizedTitle,
    category:
      apprenticeshipLike && !registered
        ? replaceUnverifiedRegisteredLanguage(program.category, canonicalSlug) || 'Work-Based Training'
        : program.category,
    programType:
      apprenticeshipLike && !registered && program.programType === 'apprenticeship'
        ? 'workforce'
        : program.programType,
    subtitle: [normalizeCopy(program.subtitle, copyFallback), registrationDisclosure]
      .filter(Boolean)
      .join(' '),
    programDescription: [
      ...(program.programDescription || [])
        .map((paragraph) => normalizeCopy(paragraph))
        .filter(Boolean),
      ...(registrationDisclosure ? [registrationDisclosure] : []),
    ],
    curriculum: program.curriculum.map((module) => ({
      ...module,
      title: replaceUnverifiedRegisteredLanguage(module.title, canonicalSlug),
      topics: module.topics.map((topic) => normalizeCopy(topic)).filter(Boolean),
    })),
    outcomes: program.outcomes.map((outcome) => ({
      ...outcome,
      statement: normalizeCopy(outcome.statement),
    })),
    weeklySchedule: program.weeklySchedule.map((entry) => ({
      ...entry,
      title: replaceUnverifiedRegisteredLanguage(entry.title, canonicalSlug),
      competencyMilestone: normalizeCopy(entry.competencyMilestone),
    })),
    careerPathway: program.careerPathway.map((step) => ({
      ...step,
      title: replaceUnverifiedRegisteredLanguage(step.title, canonicalSlug),
      requirements: normalizeCopy(step.requirements),
    })),
    credentials: program.credentials.map((credential) => ({
      ...credential,
      name: replaceUnverifiedRegisteredLanguage(credential.name, canonicalSlug),
      description: normalizeCopy(credential.description),
    })),
    trainingPhases: program.trainingPhases?.map((phase) => ({
      ...phase,
      title: replaceUnverifiedRegisteredLanguage(phase.title, canonicalSlug),
      focus: normalizeCopy(phase.focus),
      labCompetencies: phase.labCompetencies.map((item) => normalizeCopy(item)).filter(Boolean),
    })),
    credentialPipeline: program.credentialPipeline?.map((item) => ({
      ...item,
      training: normalizeCopy(item.training),
      certification: replaceUnverifiedRegisteredLanguage(item.certification, canonicalSlug),
      jobRole: replaceUnverifiedRegisteredLanguage(item.jobRole, canonicalSlug),
    })),
    faqs: program.faqs.map((faq) => ({
      ...faq,
      question: replaceUnverifiedRegisteredLanguage(faq.question, canonicalSlug),
      answer: normalizeCopy(faq.answer, 'Contact admissions for current program details.'),
    })),
    complianceAlignment: program.complianceAlignment
      .map((item) => ({
        standard: replaceUnverifiedRegisteredLanguage(item.standard, canonicalSlug),
        description: normalizeCopy(item.description),
      }))
      .filter((item) => item.standard && item.description),
    metaTitle: replaceUnverifiedRegisteredLanguage(program.metaTitle, canonicalSlug),
    metaDescription: normalizeCopy(program.metaDescription, copyFallback),
    schedule: normalizeCopy(program.schedule, program.schedule),
    eveningSchedule: program.eveningSchedule ? normalizeCopy(program.eveningSchedule) : undefined,
    equipmentIncluded: program.equipmentIncluded ? normalizeCopy(program.equipmentIncluded) : undefined,
    modality: program.modality ? normalizeCopy(program.modality) : undefined,
    facilityInfo: program.facilityInfo ? normalizeCopy(program.facilityInfo) : undefined,
    paymentTerms: program.paymentTerms ? normalizeCopy(program.paymentTerms) : undefined,
    pricingIncludes: program.pricingIncludes?.map((item) => normalizeCopy(item)).filter(Boolean),
    admissionRequirements: program.admissionRequirements?.map((item) => normalizeCopy(item)).filter(Boolean),
    isSelfPay: !workforceFunded,
    fundingOptions,
    fundingStatement: workforceFunded
      ? verifiedFunding?.wrgEligible
        ? 'WIOA or Workforce Ready Grant may be considered. WorkOne or the responsible agency determines participant eligibility, covered costs, and written authorization before funded enrollment. Self-pay remains available.'
        : 'WIOA may be considered. WorkOne or the responsible agency determines participant eligibility, covered costs, and written authorization before funded enrollment. Self-pay remains available.'
      : apprenticeshipLike ? 'Apprenticeship enrollment is self-pay only. Review the published tuition and payment options before applying.' : 'Regular self-pay program. Review the published price and payment options before applying.',
    badge: registered
      ? 'Registered Apprenticeship'
      : workforceFunded
        ? 'Verified Workforce-Funded'
        : 'Self-Pay Program',
    badgeColor: registered || workforceFunded ? 'green' : 'blue',
    funding: {
      ...(program.funding ?? {
        fssa_eligible: false,
        wioa_eligible: false,
        wrg_eligible: false,
      }),
      fssa_eligible: false,
      wioa_eligible: Boolean(workforceFunded && verifiedFunding?.wioaEligible),
      wrg_eligible: Boolean(workforceFunded && verifiedFunding?.wrgEligible),
      etpl_approved: Boolean(verifiedFunding?.etplListedFor2Exclusive),
      jobReadyIndyEligible: false,
      fundingNotes:
        apprenticeshipLike ? 'Apprenticeship enrollment is self-pay only.' : verifiedFunding?.sourceNote ?? 'No verified WIOA/WRG public funding record for this program.',
    },
    enrollmentTracks: undefined,
    cta: {
      ...program.cta,
      quickbooksCheckoutHref: hasNumericSelfPayPrice(program)
        ? `/programs/${encodeURIComponent(program.slug)}/apply`
        : program.cta.quickbooksCheckoutHref,
    },
  };
}

export function getStaticProgram(slug: string): ProgramSchema | undefined {
  const verified = getVerifiedProgramFunding(slug);
  const program =
    STATIC_PROGRAM_MAP.get(slug) ??
    verified?.aliases?.map((alias) => STATIC_PROGRAM_MAP.get(alias)).find(Boolean);
  return program ? normalizePublicProgram(program) : undefined;
}
