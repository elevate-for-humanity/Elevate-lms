import { getRegisteredProgramStandardByProfileId } from '@/lib/apprenticeship/registered-program-contract';
import { coversRegisteredCompetencies } from './registered-competency-coverage';
import type { UltimateCredentialProfile } from '../core/types';

/** Check a supplied registered-program profile against the canonical registered-program contract. */
export function verifyRegisteredProfile(profile: UltimateCredentialProfile) {
  const contract = getRegisteredProgramStandardByProfileId(profile.id);
  if (!contract) throw new Error(`ULTIMATE_REGISTERED_STANDARD_NOT_FOUND:${profile.id}`);
  const standard = contract.standard;
  const key = contract.standardKey;
  const sameCompetencies = coversRegisteredCompetencies(standard.competencies, profile.competencies, standard.rapidsCode);
  if (
    !sameCompetencies ||
    profile.standardVersion !== contract.sponsor.revisionDate ||
    !profile.socCodes?.includes(standard.onetSocCode) ||
    profile.trainingRequirements?.instructionalHours !== standard.relatedInstructionHours ||
    profile.trainingRequirements?.ojlHours !== standard.totalOjlHours
  ) {
    throw new Error(`ULTIMATE_REGISTERED_PROFILE_MISMATCH:${key}`);
  }
  return {
    source: 'registered-program contract',
    standardKey: key,
    rapidsCode: standard.rapidsCode,
    revisionDate: contract.sponsor.revisionDate,
  };
}
