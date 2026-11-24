#!/usr/bin/env bash
# Read-only audit. Never write a branch protection policy from stale defaults.
# Owner-authorized target: zero approving reviews, PRs, strict CI Required Gate.
set -euo pipefail
REPOSITORY='elevate-for-humanity/Elevate-lms'
BRANCH='main'
: "${GH_TOKEN:?GH_TOKEN is required for read-only branch policy verification}"
command -v jq >/dev/null || { echo 'POLICY_AUDIT_JQ_REQUIRED' >&2; exit 2; }
api_get() {
  local path="$1" response status
  response="$(curl --silent --show-error --max-time 20 \
    --header "Authorization: Bearer ${GH_TOKEN}" \
    --header 'Accept: application/vnd.github+json' \
    --header 'X-GitHub-Api-Version: 2022-11-28' \
    --write-out '\n%{http_code}' \
    "https://api.github.com/repos/${REPOSITORY}${path}")" || {
      echo 'POLICY_AUDIT_NETWORK_UNAVAILABLE' >&2; return 1;
    }
  status="${response##*$'\n'}"
  if [[ "$status" != 200 ]]; then
    echo "POLICY_AUDIT_API_HTTP_${status}" >&2
    return 1
  fi
  printf '%s\n' "${response%$'\n'*}"
}
classic="$(api_get "/branches/${BRANCH}/protection")" || exit 1
rules="$(api_get "/rules/branches/${BRANCH}")" || exit 1
count="$(jq -er '.required_pull_request_reviews.required_approving_review_count // 0' <<<"$classic")" || exit 1
[[ "$count" == 0 ]] || { echo 'POLICY_AUDIT_APPROVAL_COUNT_MISMATCH' >&2; exit 1; }
if ! jq -e 'type=="array"' <<<"$rules" >/dev/null; then
  echo 'POLICY_AUDIT_EFFECTIVE_RULES_INVALID' >&2; exit 1
fi
if jq -e '[.[] | select(.type=="pull_request" and ((.parameters.required_approving_review_count // 0)>0))] | length>0' <<<"$rules" >/dev/null; then
  echo 'POLICY_AUDIT_RULESET_REVIEW_REQUIREMENT_PRESENT' >&2; exit 1
fi
jq -e '(.required_pull_request_reviews != null) and
 (.required_status_checks.strict == true) and
 ([.required_status_checks.contexts[]?, (.required_status_checks.checks[]?.context)] | index("CI Required Gate") != null) and
 (.allow_force_pushes.enabled != true) and (.allow_deletions.enabled != true)' <<<"$classic" >/dev/null || {
  echo 'POLICY_AUDIT_CLASSIC_CONTRACT_MISMATCH' >&2; exit 1
}
if jq -e '[.[] | select(.type=="required_status_checks" and (.parameters.strict_required_status_checks_policy == false))] | length>0' <<<"$rules" >/dev/null; then
  echo 'POLICY_AUDIT_RULESET_NONSTRICT_CHECKS' >&2; exit 1
fi
echo 'POLICY_AUDIT_READ_ONLY_PASS: zero approvals; PR required; strict CI Required Gate; no unsafe effective rule overrides.'
