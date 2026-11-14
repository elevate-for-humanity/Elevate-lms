#!/usr/bin/env bash
# run-release.sh
#
# Dispatches CI → Deploy Admin → (optional) Deploy LMS in order.
# Waits for each workflow to complete before proceeding.
# Usage:
#   export GITHUB_TOKEN=<your-token>
#   bash scripts/run-release.sh           # CI + deploy-admin only
#   bash scripts/run-release.sh --lms     # CI + deploy-admin + deploy-lms

set -euo pipefail

OWNER="elevateforhumanity"
REPO="Elevate-lms"
BRANCH="main"
GH_API="https://api.github.com"
DEPLOY_LMS=false

for arg in "$@"; do
  [[ "$arg" == "--lms" ]] && DEPLOY_LMS=true
done

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "❌ GITHUB_TOKEN is not set. Export it before running this script."
  exit 1
fi

GH_HEADERS=(
  -H "Authorization: Bearer $GITHUB_TOKEN"
  -H "Accept: application/vnd.github+json"
  -H "X-GitHub-Api-Version: 2022-11-28"
)

# ── Dispatch a workflow and return its run ID ─────────────────────────────────
dispatch_workflow() {
  local workflow_file="$1"
  echo "▶ Dispatching $workflow_file on $BRANCH..."

  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "${GH_HEADERS[@]}" \
    -X POST "$GH_API/repos/$OWNER/$REPO/actions/workflows/$workflow_file/dispatches" \
    -H "Content-Type: application/json" \
    -d "{\"ref\":\"$BRANCH\"}")

  if [[ "$code" != "204" ]]; then
    echo "❌ Dispatch failed (HTTP $code). Check GITHUB_TOKEN permissions."
    exit 1
  fi

  sleep 3  # give GitHub time to register the run

  local run_id run_url
  read -r run_id run_url < <(
    curl -s "${GH_HEADERS[@]}" \
      "$GH_API/repos/$OWNER/$REPO/actions/workflows/$workflow_file/runs?branch=$BRANCH&per_page=1" | \
      python3 -c "
import json,sys
d=json.load(sys.stdin)
r=d.get('workflow_runs',[{}])[0]
print(r.get('id',''), r.get('html_url',''))
"
  )

  echo "  Run ID:  $run_id"
  echo "  Run URL: $run_url"
  echo "$run_id"
}

# ── Poll a run until completion ───────────────────────────────────────────────
wait_run() {
  local run_id="$1"
  local label="$2"
  echo "⏳ Waiting for $label (run $run_id)..."

  while true; do
    local json status concl url
    json=$(curl -s "${GH_HEADERS[@]}" "$GH_API/repos/$OWNER/$REPO/actions/runs/$run_id")
    status=$(echo "$json" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))")
    concl=$(echo  "$json" | python3 -c "import json,sys; print(json.load(sys.stdin).get('conclusion',''))")
    url=$(echo    "$json" | python3 -c "import json,sys; print(json.load(sys.stdin).get('html_url',''))")

    echo "  status=$status conclusion=$concl"

    if [[ "$status" == "completed" ]]; then
      if [[ "$concl" == "success" ]]; then
        echo "✅ $label passed: $url"
        return 0
      else
        echo "❌ $label FAILED (conclusion=$concl): $url"
        echo "Failing jobs:"
        curl -s "${GH_HEADERS[@]}" "$GH_API/repos/$OWNER/$REPO/actions/runs/$run_id/jobs" | \
          python3 -c "
import json,sys
for j in json.load(sys.stdin).get('jobs',[]):
    if j.get('conclusion') not in (None,'success'):
        print(f'  - {j[\"name\"]} → {j.get(\"conclusion\")} {j.get(\"html_url\",\"\")}')
"
        exit 2
      fi
    fi

    sleep 8
  done
}

# ── Main sequence ─────────────────────────────────────────────────────────────
echo "=== Step 1: CI ==="
CI_RUN_ID=$(dispatch_workflow "ci-cd.yml")
wait_run "$CI_RUN_ID" "CI"

echo ""
echo "=== Step 2: Deploy Admin ==="
ADMIN_RUN_ID=$(dispatch_workflow "deploy-admin.yml")
wait_run "$ADMIN_RUN_ID" "Deploy Admin"

if [[ "$DEPLOY_LMS" == "true" ]]; then
  echo ""
  echo "=== Step 3: Deploy LMS ==="
  LMS_RUN_ID=$(dispatch_workflow "deploy-lms.yml")
  wait_run "$LMS_RUN_ID" "Deploy LMS"
fi

echo ""
echo "🎉 Release complete."
