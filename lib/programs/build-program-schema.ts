/**
 * Build a complete ProgramSchema from partial registry/DB data when a dedicated
 * static program file does not exist.
 *
 * Important: this builder must never invent public funding, approval,
 * apprenticeship, credential, salary, or outcome claims. Public verification is
 * applied later by normalizePublicProgram().
 */

import type { ProgramEntry } from '@/lib/program-registry';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { getProgramOgImage } from '@/lib/programs/og-images';

export type PartialProgramInput = {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  category?: string | null;
  credential?: string | null;
  durationWeeks?: number | null;
  imageUrl?: string | null;
  applyHref?: string;
};

function sectorFromCategory(category: string | null | undefined): ProgramSchema['sector'] {
  const c = (category ?? '').toLowerCase();
  if (c.includes('health') || c.includes('human services')) return 'healthcare';
  if (c.includes('trade') || c.includes('skilled')) return 'skilled-trades';
  if (c.includes('technolog')) return 'technology';
  if (c.includes('beauty') || c.includes('barber') || c.includes('personal')) return 'personal-services';
  return 'business';
}

function provisionalProgramType(slug: string, weeks: number): ProgramSchema['programType'] {
  // A slug containing "apprenticeship" is not evidence of federal registration.
  // normalizePublicProgram() upgrades only RAPIDS-verified slugs.
  if (weeks <= 2 || /cpr|first-aid|forklift|osha|bloodborne/.test(slug)) return 'certification';
  return 'workforce';
}

function safeCredentials(title: string, credential?: string | null): ProgramSchema['credentials'] {
  const rows: ProgramSchema['credentials'] = [];
  if (credential?.trim()) {
    rows.push({
      name: credential.trim(),
      issuer: 'See program requirements',
      description: `Credential or licensing objective associated with ${title}. Verify the issuing body and eligibility requirements on the program page before enrollment.`,
      validity: 'Varies by credential',
    });
  }
  rows.push({
    name: 'Program Completion Record',
    issuer: PLATFORM_DEFAULTS.orgName,
    description: 'Completion record issued after the learner satisfies the program requirements that apply to the enrollment.',
    validity: 'Permanent record',
  });
  return rows;
}

function safeOutcomes(title: string): ProgramSchema['outcomes'] {
  return [
    { statement: `Demonstrate the documented learning objectives for ${title}`, assessedAt: 'Program assessment' },
    { statement: 'Complete assigned lessons, labs, and checkpoint assessments', assessedAt: 'Ongoing' },
    { statement: 'Demonstrate required safety and professionalism competencies', assessedAt: 'Program assessment' },
    { statement: 'Complete required career-readiness activities where included', assessedAt: 'Program completion' },
  ];
}

export function buildProgramSchemaFromPartial(input: PartialProgramInput): ProgramSchema {
  const slug = input.slug;
  const title = input.title.trim();
  const subtitle =
    input.subtitle?.trim() ||
    input.description?.trim()?.slice(0, 200) ||
    `Career training pathway — ${title}`;
  const durationWeeks = Math.max(1, input.durationWeeks ?? 8);
  const hoursPerWeekMin = 10;
  const hoursPerWeekMax = 20;
  const totalHours = durationWeeks * hoursPerWeekMin;
  const category = input.category?.trim() || 'Workforce Training';
  const sector = sectorFromCategory(category);
  const programType = provisionalProgramType(slug, durationWeeks);
  const heroImage = input.imageUrl?.trim() || getProgramOgImage(slug);
  const applyHref = input.applyHref ?? `/apply?program=${slug}`;
  const descriptionParagraphs = input.description?.trim()
    ? input.description.trim().split(/\n\n+/).filter(Boolean)
    : [subtitle];

  return {
    slug,
    title,
    subtitle,
    sector,
    category,
    programType,
    heroImage,
    heroImageAlt: `${title} career training`,
    deliveryMode: programType === 'certification' ? 'online' : 'hybrid',
    deliveredBy: 'Elevate',
    durationWeeks,
    hoursPerWeekMin,
    hoursPerWeekMax,
    hoursBreakdown: {
      onlineInstruction: Math.round(totalHours * 0.4),
      handsOnLab: Math.round(totalHours * 0.35),
      examPrep: Math.round(totalHours * 0.15),
      careerPlacement: Math.round(totalHours * 0.1),
    },
    schedule: 'Schedule varies by cohort and program — confirm current availability with admissions',
    cohortSize: 'Cohort size varies by program and location',
    fundingStatement: 'Funding is not assumed. Review the program-specific funding disclosure before enrollment.',
    selfPayCost: 'Contact admissions for current published pricing',
    credentials: safeCredentials(title, input.credential),
    outcomes: safeOutcomes(title),
    careerPathway: [
      {
        title: `${title} related entry-level roles`,
        timeframe: 'After program completion',
        requirements: 'Employer and credential requirements vary',
        salaryRange: 'Employer- and market-dependent',
      },
      {
        title: 'Experienced related roles',
        timeframe: 'With experience',
        requirements: 'Experience and any additional credentials required by the employer or regulator',
        salaryRange: 'Employer- and market-dependent',
      },
    ],
    weeklySchedule: [
      { week: 'Opening phase', title: 'Foundations', competencyMilestone: 'Core concepts and safety fundamentals' },
      { week: 'Middle phase', title: 'Applied Skills', competencyMilestone: 'Practice and checkpoint assessments' },
      { week: 'Final phase', title: 'Assessment', competencyMilestone: 'Required final evaluations and completion review' },
    ],
    curriculum: [
      { title: 'Program Core', topics: descriptionParagraphs.slice(0, 3) },
    ],
    complianceAlignment: [
      {
        standard: 'Program-specific requirements',
        description: 'Admissions, funding, licensing, credential, and completion requirements must be verified for the selected program.',
      },
    ],
    laborMarket: {
      medianSalary: 0,
      salaryRange: 'Varies by employer, occupation, experience, and region',
      growthRate: 'See current labor-market data for the occupation',
      source: 'O*NET / BLS where available',
      sourceYear: new Date().getFullYear(),
      region: 'Indiana / relevant service area',
    },
    careers: [
      { title: `${title} related roles`, salary: 'Employer-set' },
    ],
    cta: {
      applyHref,
      requestInfoHref: `/contact?program=${slug}`,
    },
    programDescription: descriptionParagraphs,
    faqs: [
      {
        question: 'What funding is available?',
        answer: 'Funding is program- and participant-specific. Review the funding disclosure on this program page and obtain written authorization from the responsible funder before relying on third-party funding.',
      },
      {
        question: 'How do I apply?',
        answer: `Submit the program application at ${applyHref}. Admissions will provide the next required steps and current program documents.`,
      },
    ],
    breadcrumbs: [
      { label: 'Programs', href: '/programs' },
      { label: category, href: `/programs/${sector}` },
      { label: title },
    ],
    metaTitle: `${title} | ${PLATFORM_DEFAULTS.orgName}`,
    metaDescription: subtitle,
    funding: {
      wioa_eligible: false,
      wrg_eligible: false,
      fssa_eligible: false,
      etpl_approved: false,
      fundingNotes: 'No funding approval is inferred from the fallback program record.',
    },
    enrollmentType: 'internal',
    deliveryModel: 'internal',
    fundingOptions: ['self_pay'],
  };
}

export function buildProgramSchemaFromRegistry(entry: ProgramEntry): ProgramSchema {
  return buildProgramSchemaFromPartial({
    slug: entry.slug,
    title: entry.name,
    category: entry.category,
    applyHref: entry.dedicatedApplyPage ?? `/apply?program=${entry.slug}`,
  });
}

export type DbProgramRow = {
  slug: string;
  title: string;
  description?: string | null;
  short_description?: string | null;
  credential?: string | null;
  duration_weeks?: number | null;
  image_url?: string | null;
  category?: string | null;
};

export function buildProgramSchemaFromDb(row: DbProgramRow): ProgramSchema {
  return buildProgramSchemaFromPartial({
    slug: row.slug,
    title: row.title,
    subtitle: row.short_description,
    description: row.description ?? row.short_description,
    category: row.category,
    credential: row.credential,
    durationWeeks: row.duration_weeks,
    imageUrl: row.image_url,
  });
}
