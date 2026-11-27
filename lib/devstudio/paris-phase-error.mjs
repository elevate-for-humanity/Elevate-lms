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
  if (/^OpenHands API (?:429|5[0-9]{2})(?::|$)/.test(message))
    return {errorCode:"PARIS_OPENHANDS_TRANSPORT_FAILURE",status:503};
  if(/^PARIS_GITHUB_HTTP_[1-5][0-9]{2}$/.test(message))
    return {errorCode:message,status:502};
  // Actual GitHub branch-write refusal (POST /git/refs HTTP 403) is distinct
  // from an upstream GitHub 5xx; neither may share the generic 502 bucket.
  const github=/^(?:PARIS_PATCH_FAILED: )?(?:(GITHUB_APP_403_BRANCH|GITHUB_BRANCH_AUTHORITY_UNKNOWN)\b|GITHUB_BRANCH_AUTHORITY_CHECK_HTTP_([1-5][0-9]{2})\b|GitHub API (5[0-9]{2}) for )/.exec(message);
  if(github?.[1])return {errorCode:github[1],status:403};
  if(github)return {errorCode:'PARIS_GITHUB_HTTP_'+(github[2]??github[3]),status:502};
  if(/^[0-9A-Z]{5}$/.test(String(error?.code??'')))
    return {errorCode:'PARIS_DATABASE_'+error.code,status:502};
  return {errorCode:'PARIS_REPAIR_PHASE_FAILED',status:502};
}

// Provider/model failures surface as ordinary Error messages from the chat
// client. Name the common ones so a 502 stops being an unattributed bucket.
const NAMED_PHASE_FAILURES = [
  [/PARIS_REPAIR_TASK_EXCEEDS_MODEL_CONTEXT/, 'PARIS_REPAIR_TASK_EXCEEDS_MODEL_CONTEXT', 422],
  [/PARIS_INFERENCE_BUDGET_REQUIRED/, 'PARIS_INFERENCE_BUDGET_REQUIRED', 500],
  [/PARIS_INFERENCE_TEMPORARILY_UNAVAILABLE/, 'PARIS_INFERENCE_TEMPORARILY_UNAVAILABLE', 503],
  [/Circuit "[^"]*" is open/i, 'PARIS_PROVIDER_CIRCUIT_OPEN', 503],
  [/Configured AI provider "[^"]*" failed:.*\bHTTP\s*(?:429|5\d\d)\b/, 'PARIS_PROVIDER_TRANSPORT_FAILURE', 503],
  [/Configured AI provider "[^"]*" did not recover/, 'PARIS_PROVIDER_DID_NOT_RECOVER', 503],
  [/Selected AI provider "[^"]*" is not configured/, 'PARIS_PROVIDER_NOT_CONFIGURED', 503],
  [/OWNED_MODEL_TEMPORARILY_UNAVAILABLE/, 'PARIS_OWNED_MODEL_TEMPORARILY_UNAVAILABLE', 503],
  [/OWNED_MODEL_NOT_READY/, 'PARIS_OWNED_MODEL_NOT_READY', 503],
  [/\bHTTP\s*(?:429|5\d\d)\b|ECONNRESET|socket hang up|fetch failed|network error|timed out|aborted due to timeout|temporarily unavailable|overloaded|rate limit/i,
    'PARIS_UPSTREAM_TRANSPORT_UNATTRIBUTED', 503],
];

const REDACTIONS = [
  [/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer <redacted>'],
  [/(api[_-]?key|token|secret|password|authorization)"?\s*[:=]\s*"?[A-Za-z0-9._~+/-]{6,}/gi, '$1=<redacted>'],
  [/eyJ[A-Za-z0-9._-]{10,}/g, '<redacted-jwt>'],
  [/\b[a-f0-9]{40,}\b/gi, '<sha>'],
];

/** Strip credentials from any error text before it can reach a log or response.
 * Applied to the primary message AND the nested cause, which previously leaked
 * an unredacted upstream message. */
function redact(text) {
  let value = String(text ?? '');
  for (const [pattern, replacement] of REDACTIONS) value = value.replace(pattern, replacement);
  return value.length > 400 ? value.slice(0, 400) + '…' : value;
}

/** Redacted, bounded single-line diagnostic. Never returns credentials or raw
 * repository/provider bodies, but preserves the error class and a short excerpt
 * so an unattributed HTTP 502 can be traced to its real cause. */
export function describeParisPhaseFailure(error) {
  const classified = classifyParisPhaseError(error);
  const message = String(error?.message ?? '');
  const diagnostic = redact(`${error?.name ?? 'Error'}: ${message}`);
  const named = classified.errorCode === 'PARIS_REPAIR_PHASE_FAILED' && NAMED_PHASE_FAILURES.find(([pattern]) => pattern.test(message));
  return {
    errorCode: named ? named[1] : classified.errorCode,
    status: named ? named[2] : classified.status,
    diagnostic,
    cause: error?.cause instanceof Error ? redact(`${error.cause.name}: ${error.cause.message}`) : undefined,
  };
}

