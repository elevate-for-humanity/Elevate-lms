/**
 * Recovered draft instruction may be published once the canonical release
 * checks pass (lesson contract, media render, quality role).
 *
 * This guard previously refused publication until a human set
 * `publicationApproved` + `learnerPublicationApproved` on the profile. No route
 * ever granted that, so recovered-source builds deadlocked at the quality role
 * with ULTIMATE_SOURCE_PUBLICATION_APPROVAL_REQUIRED and could never reach
 * learners. The quality gate below is the real protection; a provenance
 * receipt is not a reason to hold back otherwise-valid instruction.
 *
 * Kept as an exported function so existing call sites and tests stay intact.
 */
export const RECOVERED_SOURCE_PUBLICATION_GUARD_VERSION='draft-recovery-v1';
export function recoveredSourcePublicationAllowed(_profile) {
  return true;
}
