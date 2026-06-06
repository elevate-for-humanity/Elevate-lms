import type { FundingType, ProgramSchema } from '@/lib/programs/program-schema';

export type ProgramFundingStatus = {
  /** WIOA Individual Training Account pathway */
  isWioaFundable: boolean;
  /** Indiana Workforce Ready Grant */
  isWrgFundable: boolean;
  /** Listed on Indiana ETPL */
  isEtplListed: boolean;
  /** FSSA IMPACT / SNAP E&T */
  isImpactFundable: boolean;
  /** Employer-sponsored apprenticeship */
  isEmployerFunded: boolean;
  /** Show Indiana Career Connect + WorkOne intake steps */
  showWorkforceFundingProcess: boolean;
  /** Human-readable funding source labels for chips */
  fundingSourceLabels: string[];
  /** Short badge line for hero / funding header */
  fundabilityHeadline: string;
  /** One sentence explaining fundability */
  fundabilitySummary: string;
};

function hasFundingOption(program: ProgramSchema, option: FundingType): boolean {
  return program.fundingOptions?.includes(option) ?? false;
}

function etplFromCompliance(program: ProgramSchema): boolean {
  return (
    program.complianceAlignment?.some((row) => {
      const text = `${row.standard} ${row.description ?? ''}`;
      if (/not\s+on\s+(the\s+)?indiana\s+etpl/i.test(text)) return false;
      return /etpl\s*(program|listed|approved|#)/i.test(text) || /indiana\s+etpl\s*#/i.test(text);
    }) ?? false
  );
}

/**
 * Resolve whether a program is workforce-fundable and which sources apply.
 * Uses both agency flags (`funding`) and UI/runtime flags (`fundingOptions`).
 */
export function resolveProgramFundingStatus(program: ProgramSchema): ProgramFundingStatus {
  const isWioaFundable =
    program.funding?.wioa_eligible === true || hasFundingOption(program, 'wioa');
  const isWrgFundable =
    program.funding?.wrg_eligible === true || hasFundingOption(program, 'wrg');
  const isEtplListed =
    program.funding?.etpl_approved === true ||
    (program.funding?.etpl_approved !== false && etplFromCompliance(program));
  const isImpactFundable =
    program.funding?.fssa_eligible === true || hasFundingOption(program, 'impact');
  const isEmployerFunded = hasFundingOption(program, 'employer_paid');

  const showWorkforceFundingProcess = isWioaFundable || isWrgFundable || isEtplListed;

  const fundingSourceLabels: string[] = [];
  if (isEtplListed) fundingSourceLabels.push('Indiana ETPL');
  if (isWioaFundable) fundingSourceLabels.push('WIOA');
  if (isWrgFundable) fundingSourceLabels.push('Workforce Ready Grant');
  if (isImpactFundable) fundingSourceLabels.push('FSSA IMPACT');
  if (isEmployerFunded) fundingSourceLabels.push('Employer-Sponsored');

  let fundabilityHeadline: string;
  let fundabilitySummary: string;

  if (showWorkforceFundingProcess) {
    fundabilityHeadline = isEtplListed
      ? 'ETPL-listed — workforce funding may cover tuition'
      : 'Workforce funding may be available';
    fundabilitySummary =
      program.funding?.fundingNotes?.trim() ||
      program.fundingStatement?.trim() ||
      'Eligible Indiana residents may qualify for $0 tuition through WIOA or the Workforce Ready Grant. Eligibility is determined at WorkOne — not by Elevate.';
  } else if (isImpactFundable) {
    fundabilityHeadline = 'FSSA IMPACT funding may be available';
    fundabilitySummary =
      'Indiana SNAP or TANF recipients may qualify for no-cost training through FSSA IMPACT. You must be referred by your FSSA case worker — not through WorkOne WIOA intake.';
  } else {
    fundabilityHeadline = 'Self-pay and payment plans available';
    fundabilitySummary =
      program.fundingStatement?.trim() ||
      'This program is not listed for WIOA Individual Training Accounts. Self-pay enrollment, payment plans, and BNPL options are available.';
  }

  return {
    isWioaFundable,
    isWrgFundable,
    isEtplListed,
    isImpactFundable,
    isEmployerFunded,
    showWorkforceFundingProcess,
    fundingSourceLabels,
    fundabilityHeadline,
    fundabilitySummary,
  };
}
