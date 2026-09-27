import { APPENDIX_A_REGISTRATION, APPENDIX_A_STANDARDS } from '@/lib/compliance/appendix-a-standards';
import type { UltimateCredentialProfile } from '../core/types';

/** Check a supplied registered-program profile against the repository's Appendix A contract. */
export function verifyRegisteredProfile(profile: UltimateCredentialProfile) {
  const match = Object.entries(APPENDIX_A_STANDARDS).find(([, standard]) =>
    profile.id.toLowerCase().includes(standard.rapidsCode.toLowerCase()),
  );
  if (!match) throw new Error(`ULTIMATE_REGISTERED_STANDARD_NOT_FOUND:${profile.id}`);
  const [key, standard] = match;
  const sameCompetencies = profile.competencies.length === standard.competencies.length &&
    standard.competencies.every((item, index) => {
      const actual = profile.competencies[index];
      return actual?.id === item.id && actual.title === item.category && actual.description === item.description &&
        actual.authorityRequirementIds.length > 0 && actual.authorityRequirementIds.every((ref) =>
          ref === item.id || ref === `RAPIDS:${standard.rapidsCode}:APPENDIX_A:${item.sourceLabel ?? item.id}`);
    });
  if (!sameCompetencies || profile.standardVersion !== APPENDIX_A_REGISTRATION.revisionDate ||
    !profile.socCodes?.includes(standard.onetSocCode) ||
    profile.trainingRequirements?.instructionalHours !== standard.relatedInstructionHours ||
    profile.trainingRequirements?.ojlHours !== standard.totalOjlHours) {
    throw new Error(`ULTIMATE_REGISTERED_PROFILE_MISMATCH:${key}`);
  }
  return {source:'repository Appendix A',standardKey:key,rapidsCode:standard.rapidsCode,revisionDate:APPENDIX_A_REGISTRATION.revisionDate};
}
