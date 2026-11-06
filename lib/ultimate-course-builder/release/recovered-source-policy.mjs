/** Restoring draft instruction is not an approval to publish it to learners. */
export function recoveredSourcePublicationAllowed(profile) {
  const recovery=profile?.existingLessonSourceRecovery;
  if(!recovery)return true;
  if(recovery.draftSourceForProductionOnly===true || recovery.publicationApproved===false || recovery.learnerPublicationApproved===false)
    return recovery.publicationApproved===true && recovery.learnerPublicationApproved===true;
  return true;
}
