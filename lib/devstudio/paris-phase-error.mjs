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
  if(/^PARIS_GITHUB_HTTP_[1-5][0-9]{2}$/.test(message))
    return {errorCode:message,status:502};
  if(/^[0-9A-Z]{5}$/.test(String(error?.code??'')))
    return {errorCode:'PARIS_DATABASE_'+error.code,status:502};
  return {errorCode:'PARIS_REPAIR_PHASE_FAILED',status:502};
}
