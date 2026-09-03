#!/usr/bin/env bash
# Applies branch protection rules to main via GitHub API.
# Requires: GH_TOKEN env var with repo admin scope.
#
# Usage: GH_TOKEN=ghp_xxx bash scripts/enforce-branch-protection.sh

set -euo pipefail

OWNER="elevateforhumanity"
REPO="Elevate-lms"
BRANCH="main"

: "${GH_TOKEN:?GH_TOKEN is required (repo admin scope)}"

echo "Applying branch protection to ${OWNER}/${REPO}:${BRANCH} ..."

curl -s -X PUT \
  -H "Authorization: Bearer ${GH_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/${OWNER}/${REPO}/branches/${BRANCH}/protection" \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": []
    },
    "enforce_admins": false,
    "required_pull_request_reviews": {
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": false,
      "required_approving_review_count": 1
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "block_creations": false,
    "required_conversation_resolution": true
  }' | jq '{
    url,
    required_pull_request_reviews: .required_pull_request_reviews.required_approving_review_count,
    allow_force_pushes: .allow_force_pushes,
    allow_deletions: .allow_deletions
  }' 2>/dev/null || echo "jq not available — check raw response above"

echo "Done."
