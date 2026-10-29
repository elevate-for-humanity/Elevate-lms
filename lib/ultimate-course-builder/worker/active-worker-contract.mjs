/** A three-role plan is not active merely because its queue rows exist.
 * Every currently runnable lesson stage must have a fresh leased worker, a
 * just-launched execution awaiting its own verified claim. Capacity wait is
 * an unsatisfied contract state, never proof that the lesson is active. */
export const ACTIVE_LESSON_WORKER_CONTRACT = 'runnable-stage-required-v1';
