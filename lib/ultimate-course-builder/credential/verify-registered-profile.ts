import { getRegisteredProgramStandardByProfileId } from '@/lib/apprenticeship/registered-program-contract';
import type { UltimateCredentialProfile } from '../core/types';

/** Check a supplied registered-program profile against the canonical registered-program contract. */
export function verifyRegisteredProfile(profile: UltimateCredentialProfile) {
  const contract = getRegisteredProgramStandardByProfileId(profile.id);
  if (!contract) throw new Error(`ULTIMATE_REGISTERED_STANDARD_NOT_FOUND:${profile.id}`);
  const standard = contract.standard;
  const key = contract.standardKey;
  const sameCompetencies =
    profile.competencies.length === standard.competencies.length &&
    standard.competencies.every((item, index) => {
      const actual = profile.competencies[index];
      return (
        actual?.id === item.id &&
        actual.title === item.category &&
        actual.description === item.description &&
        actual.authorityRequirementIds.length > 0 &&
        actual.authorityRequirementIds.every(
          (ref) =>
            ref === item.id ||
            ref ===
              `RAPIDS:${standard.rapidsCode}:APPENDIX_A:${item.sourceLabel ?? item.id}`,
        )
      );
    });
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
