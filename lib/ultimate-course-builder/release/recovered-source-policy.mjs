/** Recovered instruction is draft until both source and learner release are approved.
 * Ordinary courses without a recovery envelope follow their existing release gates. */
export const RECOVERED_SOURCE_PUBLICATION_GUARD_VERSION='draft-recovery-v1';
export function recoveredSourcePublicationAllowed(profile) {
  const recovery=profile?.existingLessonSourceRecovery;
  if(recovery == null) return true;
  // Every recorded recovery envelope is subject to explicit approval.
  // Missing, malformed, null, or partial metadata must fail closed.
  if(typeof recovery !== 'object' || Array.isArray(recovery)) return false;
  return recovery.publicationApproved===true && recovery.learnerPublicationApproved===true;
}
