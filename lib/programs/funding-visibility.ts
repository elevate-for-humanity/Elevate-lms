import type { ProgramSchema } from '@/lib/programs/program-schema';
import {
  getPublicFundingLabels,
  getVerifiedProgramFunding,
  isStrictWorkforceFundedProgram,
} from '@/lib/programs/funding-registry';

export type ProgramFundingStatus = {
  isWioaFundable: boolean;
  isWrgFundable: boolean;
  isEtplListed: boolean;
  isImpactFundable: boolean;
  isEmployerFunded: boolean;
  showWorkforceFundingProcess: boolean;
  fundingSourceLabels: string[];
  fundabilityHeadline: string;
  fundabilitySummary: string;
};

/**
 * Public funding resolver.
 *
 * IMPORTANT: legacy fundingOptions, database marketing flags, and descriptive
 * compliance text do NOT make a program publicly WIOA/WRG eligible. Public
 * workforce-funding status comes only from the strict verified registry.
 */
export function resolveProgramFundingStatus(program: ProgramSchema): ProgramFundingStatus {
  const verified = getVerifiedProgramFunding(program.slug);
  const showWorkforceFundingProcess = isStrictWorkforceFundedProgram(program.slug);

  const isEtplListed = verified?.etplListedFor2Exclusive === true;
  const isWioaFundable = showWorkforceFundingProcess && verified?.wioaEligible === true;
  const isWrgFundable = showWorkforceFundingProcess && verified?.wrgEligible === true;

  // Non-WIOA sources remain independent, but do not alter the public WIOA/WRG track.
  const isImpactFundable = program.funding?.fssa_eligible === true;
  const isEmployerFunded = program.fundingOptions?.includes('employer_paid') ?? false;

  const fundingSourceLabels = showWorkforceFundingProcess
    ? getPublicFundingLabels(program.slug)
    : ['Self-Pay'];

  if (showWorkforceFundingProcess) {
    return {
      isWioaFundable,
      isWrgFundable,
      isEtplListed,
      isImpactFundable,
      isEmployerFunded,
      showWorkforceFundingProcess,
      fundingSourceLabels,
      fundabilityHeadline: 'Workforce-funded pathway — WorkOne intake required',
      fundabilitySummary:
        'This program is in Elevate’s verified workforce-funded registry. WIOA/Workforce Ready Grant eligibility and authorization are determined by WorkOne or the responsible funding agency. A WorkOne intake appointment is required before funded enrollment can be completed.',
    };
  }

  return {
    isWioaFundable: false,
    isWrgFundable: false,
    isEtplListed,
    isImpactFundable,
    isEmployerFunded,
    showWorkforceFundingProcess: false,
    fundingSourceLabels,
    fundabilityHeadline: 'Regular program — self-pay enrollment',
    fundabilitySummary:
      'This program is not currently presented as a WIOA/Workforce Ready Grant program under Elevate’s strict ETPL + Top Jobs verification rule. Self-pay and available payment-plan options apply unless Elevate publishes a verified funding update.',
  };
}
