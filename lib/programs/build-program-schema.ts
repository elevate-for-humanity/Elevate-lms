/**
 * Build a valid ProgramSchema from partial data (registry entry, DB row, hero banner).
 * Used when no static data/programs/*.ts file exists — still renders via ProgramDetailPage.
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

function programTypeFromSlug(slug: string, weeks: number): ProgramSchema['programType'] {
  if (slug.includes('apprenticeship')) return 'apprenticeship';
  if (weeks <= 2 || /cpr|first-aid|forklift|osha|bloodborne/.test(slug)) return 'certification';
  return 'workforce';
}

function defaultCredentials(
  title: string,
  credential?: string | null,
): ProgramSchema['credentials'] {
  const primary = credential?.trim() || `${title} Credential`;
  return [
    {
      name: primary,
      issuer: 'Industry-recognized certifying body',
      description: `Credential earned on successful completion of ${title}.`,
      validity: 'Varies by credential',
    },
    {
      name: 'Elevate Program Completion Certificate',
      issuer: PLATFORM_DEFAULTS.orgName,
      description: 'Publicly verifiable completion record issued by Elevate for Humanity.',
      validity: 'Permanent',
    },
    {
      name: 'Career Readiness Portfolio',
      issuer: PLATFORM_DEFAULTS.orgName,
      description: 'Documented competencies and employer-aligned skills verification.',
      validity: 'Permanent',
    },
  ];
}

function defaultOutcomes(title: string): ProgramSchema['outcomes'] {
  return [
    { statement: `Demonstrate core competencies required for ${title} roles`, assessedAt: 'Mid-program' },
    { statement: 'Complete structured lessons, labs, and checkpoint assessments', assessedAt: 'Ongoing' },
    { statement: 'Meet employer-aligned safety and professionalism standards', assessedAt: 'Final week' },
    { statement: 'Pass required skills evaluations with instructor sign-off where applicable', assessedAt: 'Final assessment' },
    { statement: 'Complete career readiness and job search preparation activities', assessedAt: 'Program completion' },
  ];
}

/** Institutional defaults — satisfies ProgramDetailPage minimum structure. */
export function buildProgramSchemaFromPartial(input: PartialProgramInput): ProgramSchema {
  const slug = input.slug;
  const title = input.title.trim();
  const subtitle =
    input.subtitle?.trim() ||
    input.description?.trim()?.slice(0, 200) ||
    `Workforce training program — ${title}`;
  const durationWeeks = Math.max(1, input.durationWeeks ?? 8);
  const hoursPerWeekMin = 10;
  const hoursPerWeekMax = 20;
  const totalHours = durationWeeks * hoursPerWeekMin;
  const category = input.category?.trim() || 'Workforce Training';
  const sector = sectorFromCategory(category);
  const programType = programTypeFromSlug(slug, durationWeeks);
  const heroImage = input.imageUrl?.trim() || getProgramOgImage(slug);
  const applyHref = input.applyHref ?? `/apply?program=${slug}`;

  const descriptionParagraphs =
    input.description?.trim() ?
      input.description
        .trim()
        .split(/\n\n+/)
        .filter(Boolean)
    : [subtitle];

  return {
    slug,
    title,
    subtitle,
    sector,
    category,
    programType,
    heroImage,
    heroImageAlt: `${title} training program`,
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
    schedule: 'Flexible / cohort-based — contact admissions for next start date',
    cohortSize: 'Small cohorts with instructor support',
    fundingStatement:
      'WIOA, Workforce Ready Grant, and FSSA IMPACT funding may be available for eligible Indiana residents.',
    selfPayCost: 'Contact admissions',
    credentials: defaultCredentials(title, input.credential),
    outcomes: defaultOutcomes(title),
    careerPathway: [
      {
        title: `${title} (Entry Level)`,
        timeframe: '0–1 year',
        requirements: 'Program completion + credential',
        salaryRange: 'Employer-set',
      },
      {
        title: 'Experienced Technician / Specialist',
        timeframe: '1–3 years',
        requirements: 'On-the-job experience',
        salaryRange: 'Employer-set',
      },
      {
        title: 'Supervisor / Lead',
        timeframe: '3+ years',
        requirements: 'Experience + additional credentials',
        salaryRange: 'Employer-set',
      },
    ],
    weeklySchedule: [
      {
        week: 'Weeks 1–2',
        title: 'Foundations',
        competencyMilestone: 'Core concepts and safety fundamentals',
      },
      {
        week: `Weeks 3–${Math.max(3, durationWeeks - 1)}`,
        title: 'Applied Skills',
        competencyMilestone: 'Hands-on practice and module checkpoints',
      },
      {
        week: `Week ${durationWeeks}`,
        title: 'Assessment & Credential',
        competencyMilestone: 'Final evaluation and career placement support',
      },
    ],
    curriculum: [
      {
        title: 'Program Core',
        topics: descriptionParagraphs.slice(0, 3),
      },
    ],
    complianceAlignment: [
      {
        standard: 'WIOA-Aligned Training Structure',
        description: 'Structured competency-based training aligned with workforce development standards.',
      },
      {
        standard: 'ETPL-Approved Provider',
        description: `${PLATFORM_DEFAULTS.orgName} is an Indiana Eligible Training Provider.`,
      },
    ],
    laborMarket: {
      medianSalary: 0,
      salaryRange: 'Varies by employer and region',
      growthRate: 'See O*NET data below',
      source: 'O*NET / BLS',
      sourceYear: new Date().getFullYear(),
      region: 'Indianapolis MSA',
    },
    careers: [
      { title: `${title} (Entry Level)`, salary: 'Employer-set' },
      { title: 'Related skilled roles', salary: 'Employer-set' },
    ],
    cta: {
      applyHref,
      requestInfoHref: `/contact?program=${slug}`,
      careerConnectHref:
        programType === 'apprenticeship' || programType === 'workforce' ?
          'https://www.indianacareerconnect.com/'
        : undefined,
    },
    programDescription: descriptionParagraphs,
    faqs: [
      {
        question: 'What funding is available?',
        answer:
          'WIOA, Workforce Ready Grant, and FSSA IMPACT may cover tuition for eligible participants. Use our eligibility checker or contact admissions.',
      },
      {
        question: 'How do I apply?',
        answer: `Submit an application at ${applyHref}. An enrollment advisor will contact you within 1–2 business days.`,
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
      wioa_eligible: programType !== 'certification',
      wrg_eligible: programType !== 'certification',
      fssa_eligible: programType !== 'certification',
    },
    enrollmentType: 'internal',
    deliveryModel: 'internal',
    fundingOptions: ['wioa', 'wrg', 'impact', 'self_pay'],
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
