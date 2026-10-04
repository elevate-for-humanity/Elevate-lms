import { requiredPracticalKeys, validatePracticalSubmission, validatePracticalReview } from './course-practical-policy';
import { checkCompetencyGate } from './competency-gate';

export async function practicalReviewerCourseIds(db: any, actorId: string): Promise<string[] | null> {
  const { data: profile, error } = await db.from('profiles').select('role').eq('id', actorId).maybeSingle();
  if (error) throw error;
  if (['admin', 'super_admin'].includes(profile?.role)) return null;
  if (!['instructor', 'staff', 'org_admin'].includes(profile?.role)) throw new Error('PRACTICAL_REVIEW_FORBIDDEN');
  const { data: courses, error: courseError } = await db.from('instructor_assignments').select('course_id').eq('instructor_id', actorId).eq('active', true);
  if (courseError) throw courseError;
  return (courses ?? []).map((assignment: any) => assignment.course_id).filter(Boolean);
}

export async function submitCoursePractical(db: any, learnerId: string, input: any) {
  const { data: lesson, error } = await db.from('course_lessons').select('id,course_id,practical_required,competency_checks,content_json')
    .eq('id', input.lessonId).eq('course_id', input.courseId).maybeSingle();
  if (error) throw error;
  if (!lesson?.practical_required) throw new Error('PRACTICAL_LESSON_REQUIRED');
  const keys = requiredPracticalKeys(lesson);
  validatePracticalSubmission(keys, input);
  const { data: enrollment, error: enrollmentError } = await db.from('program_enrollments').select('status,enrollment_state')
    .eq('user_id', learnerId).eq('course_id', input.courseId).maybeSingle();
  if (enrollmentError) throw enrollmentError;
  const states = ['active','in_progress','enrolled','confirmed','pending_funding_verification'];
  if (!enrollment || !states.includes(enrollment.status ?? enrollment.enrollment_state)) throw new Error('PRACTICAL_ENROLLMENT_REQUIRED');
  const now = new Date().toISOString();
  const { data: submission, error: saveError } = await db.from('course_practical_submissions').upsert({
    learner_id: learnerId, course_id: input.courseId, lesson_id: input.lessonId, interaction_id: input.interactionId,
    competency_keys: keys, evidence: input.evidence, learner_attestation: true, status: 'submitted', submitted_at: now, updated_at: now,
  }, { onConflict: 'learner_id,lesson_id,interaction_id' }).select().single();
  if (saveError) throw saveError;
  const { error: eventError } = await db.from('learning_action_events').insert({ learner_id: learnerId, course_id: input.courseId,
    lesson_id: input.lessonId, action: 'request_expert_review', source_type: 'practical_submission', source_id: submission.id, payload: { competencyKeys: keys } });
  if (eventError) throw eventError;
  return submission;
}

export async function reviewCoursePractical(db: any, reviewerId: string, input: any) {
  const courseIds = await practicalReviewerCourseIds(db, reviewerId);
  const { data: submission, error } = await db.from('course_practical_submissions').select('*').eq('id', input.submissionId).maybeSingle();
  if (error) throw error;
  if (!submission || submission.learner_id === reviewerId || courseIds && !courseIds.includes(submission.course_id)) throw new Error('PRACTICAL_REVIEW_FORBIDDEN');
  const { data: lesson, error: lessonError } = await db.from('course_lessons').select('practical_required,competency_checks,content_json').eq('id', submission.lesson_id).maybeSingle();
  if (lessonError) throw lessonError;
  const keys = requiredPracticalKeys(lesson ?? {});
  validatePracticalReview(keys, submission, input);
  const { data: review, error: reviewError } = await db.from('course_practical_reviews').insert({ submission_id: submission.id,
    reviewer_id: reviewerId, decision: input.decision, competency_results: input.competencyResults, comments: input.comments }).select().single();
  if (reviewError) throw reviewError;
  const { data: changed, error: updateError } = await db.from('course_practical_submissions').update({ status: input.decision, updated_at: new Date().toISOString() })
    .eq('id', submission.id).eq('submitted_at', submission.submitted_at).in('status', ['submitted','in_review']).select('id').maybeSingle();
  if (updateError) throw updateError;
  if (!changed) throw new Error('PRACTICAL_REVIEW_STATE_CONFLICT');
  const gate = await checkCompetencyGate(db, { userId: submission.learner_id, lessonId: submission.lesson_id });
  const actions = input.decision === 'approved' ? ['record_mastery', ...(gate.allowed ? ['unlock_next'] : [])] : ['assign_remediation'];
  const { error: eventError } = await db.from('learning_action_events').insert(actions.map(action => ({ learner_id: submission.learner_id,
    course_id: submission.course_id, lesson_id: submission.lesson_id, action, source_type: 'practical_review', source_id: review.id,
    payload: { competencyResults: input.competencyResults, reviewerId } })));
  if (eventError) throw eventError;
  // Approval opens only the practical gate. Normal completion still checks
  // playback, assessments, enrollment, and shop-work requirements.
  return { review, practicalGate: gate };
}
