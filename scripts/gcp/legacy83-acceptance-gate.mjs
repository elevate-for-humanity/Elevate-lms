/** Restore the previous preview before propagating an acceptance failure. */
export async function verifyLegacy83Candidate(verify, rollback) {
  try { return await verify(); }
  catch (acceptanceError) {
    try { await rollback(); }
    catch (rollbackError) { throw new AggregateError([acceptanceError, rollbackError], 'Legacy 83 acceptance and rollback both failed'); }
    throw acceptanceError;
  }
}
