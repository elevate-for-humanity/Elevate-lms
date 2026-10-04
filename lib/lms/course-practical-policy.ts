/** Shared requirements for authored practical submission, review and completion. */
export function requiredPracticalKeys(lesson: any): string[] {
  const checks = Array.isArray(lesson.competency_checks) ? lesson.competency_checks : [];
  const task = lesson.content_json?.experience?.practicalTask;
  const authored = Array.isArray(task?.competencyKeys) ? task.competencyKeys : task?.competencyKey ? [task.competencyKey] : [];
  const keys = [...checks.filter((c: any) => c.requiresInstructorSignoff).map((c: any) => c.key), ...authored];
  if (!keys.length && lesson.content_json?.competencyId) keys.push(lesson.content_json.competencyId);
  return [...new Set<string>(keys.filter((k): k is string => typeof k === 'string' && Boolean(k.trim())))];
}

export function practicalReviewPasses(submission: any, key: string): boolean {
  if (submission.status !== 'approved' || submission.learner_attestation !== true || !submission.evidence?.length) return false;
  const reviews = [...(submission.course_practical_reviews ?? [])].sort((a, b) => Date.parse(b.reviewed_at) - Date.parse(a.reviewed_at));
  const latest = reviews[0];
  return Boolean(latest && latest.reviewer_id && latest.decision === 'approved' &&
    Number.isFinite(Date.parse(latest.reviewed_at)) && Date.parse(latest.reviewed_at) >= Date.parse(submission.submitted_at) &&
    latest.competency_results?.[key] === true);
}

export function validatePracticalSubmission(keys: string[], input: any): void {
  if (!keys.length || !Array.isArray(input.competencyKeys) || keys.length !== input.competencyKeys.length || keys.some(key => !input.competencyKeys.includes(key))) throw new Error('PRACTICAL_COMPETENCY_MISMATCH');
  if (input.learnerAttestation !== true || !Array.isArray(input.evidence) || !input.evidence.length || input.evidence.some((item: any) => !['url','text','file'].includes(item?.type) || typeof item?.value !== 'string' || !item.value.trim())) throw new Error('PRACTICAL_EVIDENCE_REQUIRED');
}

export function validatePracticalReview(keys: string[], submission: any, input: any): void {
  if (!['approved','revision_required','rejected'].includes(input.decision) || typeof input.comments !== 'string' || input.comments.trim().length < 3) throw new Error('PRACTICAL_REVIEW_INVALID');
  if (!['submitted','in_review'].includes(submission.status)) throw new Error('PRACTICAL_REVIEW_STATE_CONFLICT');
  if (!keys.length || !Array.isArray(submission.competency_keys) || keys.some(key => !submission.competency_keys.includes(key))) throw new Error('PRACTICAL_COMPETENCY_MISMATCH');
  if (input.decision === 'approved' && (submission.learner_attestation !== true || !submission.evidence?.length || keys.some(key => input.competencyResults?.[key] !== true))) throw new Error('PRACTICAL_APPROVAL_REQUIRES_ALL_COMPETENCIES');
}
