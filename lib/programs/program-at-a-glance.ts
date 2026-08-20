/**
 * Derives the six workforce questions every program page must answer above the fold.
 *
 * Government-facing funding copy MUST come from the verified funding registry.
 * Legacy ProgramSchema fundingOptions/fundingStatement values are intentionally
 * ignored here so stale course data cannot create a public WIOA/WRG claim.
 */

import type { ProgramSchema } from '@/lib/programs/program-schema';
import {
  getPublicFundingDisclosure,
  getVerifiedProgramFunding,
} from '@/lib/programs/funding-registry';

export type ProgramAtAGlanceRow = {
  question: string;
  answer: string;
  detail?: string;
};

function primaryCredential(program: ProgramSchema): string {
  const c = program.credentials[0];
  if (!c) return 'Industry-recognized credential — see program details';
  const issuer = c.issuingBody ?? c.issuer;
  return `${c.name} — issued by ${issuer}`;
}

function primaryJob(program: ProgramSchema): string {
  const career = program.careers?.[0];
  if (career) return `${career.title} (${career.salary})`;
  if (program.laborMarket?.salaryRange) {
    return `Entry-level roles · typical range ${program.laborMarket.salaryRange}`;
  }
  return 'Entry-level roles in this field — placement support provided';
}

function enrollmentStartLabel(program: ProgramSchema): string {
  const configured = (program as ProgramSchema & { enrollmentStartLabel?: string })
    .enrollmentStartLabel;
  if (configured) return configured;
  if (program.enrollmentType === 'waitlist') {
    return 'Waitlist open — cohort date confirmed at intake';
  }
  if (program.programType === 'apprenticeship') {
    return 'Employer-matched start — apply to begin placement';
  }
  return 'Rolling enrollment — next cohort date confirmed after application';
}

function fundingSummary(program: ProgramSchema): string {
  const verified = getVerifiedProgramFunding(program.slug);
  if (!verified) {
    return 'Self-pay program. No public WIOA or Workforce Ready Grant claim is made.';
  }
  return getPublicFundingDisclosure(program.slug);
}

/** Six-row summary for program detail pages (workforce reviewer checklist). */
export function buildProgramAtAGlance(program: ProgramSchema): ProgramAtAGlanceRow[] {
  const weeks = program.durationWeeks;
  const duration =
    weeks >= 52
      ? `${weeks} weeks (${program.schedule})`
      : `${weeks} ${weeks === 1 ? 'week' : 'weeks'} · ${program.hoursPerWeekMin}–${program.hoursPerWeekMax} hrs/week`;

  const costDetail = program.regularPrice || program.salePrice
    ? [
        program.regularPrice ? `Regular price ${program.regularPrice}` : null,
        program.salePrice ? `Current price ${program.salePrice}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : undefined;

  return [
    {
      question: 'When do I start?',
      answer: enrollmentStartLabel(program),
      detail: program.schedule,
    },
    {
      question: 'How long does it take?',
      answer: duration,
      detail: program.cohortSize,
    },
    {
      question: 'What credential do I earn?',
      answer: primaryCredential(program),
    },
    {
      question: 'What job can I get?',
      answer: primaryJob(program),
      detail: program.laborMarket?.region,
    },
    {
      question: 'What does it cost?',
      answer: program.selfPayCost,
      detail: costDetail,
    },
    {
      question: 'Is funding available?',
      answer: fundingSummary(program),
    },
  ];
}
