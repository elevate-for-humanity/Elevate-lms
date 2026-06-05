/**
 * Derives the six workforce questions every program page must answer above the fold.
 */

import type { FundingType, ProgramSchema } from '@/lib/programs/program-schema';

const FUNDING_LABELS: Record<FundingType, string> = {
  wioa: 'WIOA',
  wrg: 'Workforce Ready Grant',
  impact: 'FSSA IMPACT',
  self_pay: 'Self-pay',
  employer_paid: 'Employer-paid',
  unknown: 'Funding varies',
};

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
  if (program.enrollmentStartLabel) return program.enrollmentStartLabel;
  if (program.enrollmentType === 'waitlist') {
    return 'Waitlist open — cohort date confirmed at intake';
  }
  if (program.programType === 'apprenticeship') {
    return 'Employer-matched start — apply to begin placement';
  }
  return 'Rolling enrollment — next cohort date confirmed after application';
}

function fundingSummary(program: ProgramSchema): string {
  const opts = program.fundingOptions?.filter((f) => f !== 'unknown' && f !== 'self_pay') ?? [];
  if (opts.length > 0) {
    return `${opts.map((f) => FUNDING_LABELS[f]).join(', ')} for eligible participants`;
  }
  if (program.isSelfPay) return 'Self-pay — payment plans available';
  const first = program.fundingStatement.split('.')[0];
  return first ? `${first}.` : 'Contact an advisor for funding options';
}

/** Six-row summary for program detail pages (workforce reviewer checklist). */
export function buildProgramAtAGlance(program: ProgramSchema): ProgramAtAGlanceRow[] {
  const weeks = program.durationWeeks;
  const duration =
    weeks >= 52
      ? `${weeks} weeks (${program.schedule})`
      : `${weeks} ${weeks === 1 ? 'week' : 'weeks'} · ${program.hoursPerWeekMin}–${program.hoursPerWeekMax} hrs/week`;

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
      detail: program.regularPrice
        ? `Regular price ${program.regularPrice}${program.salePrice ? ` · Sale ${program.salePrice}` : ''}`
        : undefined,
    },
    {
      question: 'Is funding available?',
      answer: fundingSummary(program),
    },
  ];
}
