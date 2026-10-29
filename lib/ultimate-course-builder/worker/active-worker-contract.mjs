/** A three-role plan is not active merely because its queue rows exist.
 * Every currently runnable lesson stage must have a fresh leased worker, a
 * just-launched execution awaiting its own verified claim, or an explicit
 * capacity-wait state that the trusted dispatcher continues to revisit. */
export const ACTIVE_LESSON_WORKER_CONTRACT = 'runnable-stage-required-v1';
