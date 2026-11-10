/** Safe, stable diagnostics for the signed PARIS repair endpoint.
 * No provider response bodies, credentials, task goals or repository excerpts
 * are returned to the workflow; only an allow-listed phase failure code.
 */
export function classifyParisPhaseError(error) {
  const message=String(error?.message??'');
  const inner=/^PARIS_PATCH_FAILED: (PARIS_PLANNER_REPEATED_INSPECTION|PARIS_REPAIR_PLANNING_DEADLINE_REACHED|PARIS_REPAIR_TASK_EXCEEDS_MODEL_CONTEXT|PARIS_WORKFLOW_FAILED_JOB_REQUIRED)$/.exec(message);
  if(inner) return {errorCode:inner[1],status:422};
  if(message==='REPAIR_ALREADY_CLAIMED')
    return {errorCode:message,status:409};
  if(message==='PARIS_AUTOPILOT_OWNER_AUTHORITY_REQUIRED')
    return {errorCode:message,status:403};
  // External engineering keeps the same redacted diagnostic contract. These
  // are controller states, not permission to retry an ambiguous provider start.
  const openhandsStatus={
    PARIS_OPENHANDS_REPAIR_AUTHORITY_REQUIRED:403,
    PARIS_OPENHANDS_TASK_OWNERSHIP_MISMATCH:403,
    PARIS_OPENHANDS_CHECKPOINT_OWNERSHIP_MISMATCH:403,
    PARIS_OPENHANDS_APPROVAL_REQUIRED:403,
    PARIS_OPENHANDS_START_UNCONFIRMED:409,
    PARIS_OPENHANDS_DUPLICATE_CORRELATION:409,
    PARIS_OPENHANDS_UNOWNED_BRANCH:409,
    PARIS_OPENHANDS_CANDIDATE_CHANGED_DURING_READBACK:409,
    PARIS_OPENHANDS_COMMITTED_DIFF_REQUIRED:422,
    PARIS_OPENHANDS_PROTECTED_REPAIR_BOUNDARY:422,
    PARIS_OPENHANDS_EXISTING_TEST_CHANGED:422,
    PARIS_OPENHANDS_SOURCE_AND_NEW_TEST_REQUIRED:422,
    PARIS_OPENHANDS_BLOB_READBACK_MISMATCH:422,
    PARIS_OPENHANDS_BRANCH_MISMATCH:422,
    PARIS_OPENHANDS_NOT_CONFIGURED:503,
    PARIS_OPENHANDS_WAIT_DEADLINE:504,
    PARIS_OPENHANDS_EXECUTION_FAILED:502,
  };
  if(Object.hasOwn(openhandsStatus,message))return {errorCode:message,status:openhandsStatus[message]};
  if(/^PARIS_GITHUB_HTTP_[1-5][0-9]{2}$/.test(message))
    return {errorCode:message,status:502};
  if(/^[0-9A-Z]{5}$/.test(String(error?.code??'')))
    return {errorCode:'PARIS_DATABASE_'+error.code,status:502};
  return {errorCode:'PARIS_REPAIR_PHASE_FAILED',status:502};
}
