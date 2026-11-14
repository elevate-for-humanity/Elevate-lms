/** Draft recovery is not approval to publish instruction to learners. */
export const RECOVERED_SOURCE_PUBLICATION_GUARD_VERSION='draft-recovery-v1';
export function recoveredSourcePublicationAllowed(profile) {
  if (!profile || !Object.prototype.hasOwnProperty.call(profile,'existingLessonSourceRecovery')) return true;
  const recovery=profile.existingLessonSourceRecovery;
  if (!recovery || typeof recovery !== 'object' || Array.isArray(recovery)) return false;
  return recovery.publicationApproved===true && recovery.learnerPublicationApproved===true;
}
