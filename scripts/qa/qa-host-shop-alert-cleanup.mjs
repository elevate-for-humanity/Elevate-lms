const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assertQaApprenticeshipEnrollment(state, row) {
  const { enrollmentId, apprentice, runId, marker } = state;
  if (!UUID.test(enrollmentId || '') || !UUID.test(apprentice?.id || '') ||
      !runId || marker !== `qa-e2e-${runId}` ||
      apprentice.email !== `${marker}-apprentice@qa.invalid`) {
    throw new Error('QA cleanup rejected incomplete enrollment identity');
  }
  // A repeated cleanup can legitimately find that the enrollment is gone.
  if (row === null) return;
  if (row?.id !== enrollmentId || row.user_id !== apprentice.id ||
      row.student_id !== apprentice.id || row.email !== apprentice.email ||
      row.source !== 'qa_e2e' || row.draft_data?.qa_e2e !== true ||
      row.draft_data?.qa_run_id !== runId || row.draft_data?.disposable !== true) {
    throw new Error('QA cleanup rejected non-fixture enrollment');
  }
}

export function scopeQaHolderAssignmentAlert(query, enrollmentId, apprenticeId) {
  if (!UUID.test(enrollmentId || '') || !UUID.test(apprenticeId || '')) {
    throw new Error('QA cleanup requires exact enrollment and apprentice IDs');
  }
  // A holder may be a real user. Never scope deletion by recipient or name alone.
  return query.eq('type', 'system').eq('title', 'New Student Assigned')
    .eq('metadata->>enrollment_id', enrollmentId)
    .eq('metadata->>student_id', apprenticeId)
    .like('idempotency_key', `program-holder-enrollment:${enrollmentId}:%`);
}
