#!/usr/bin/env bash
set -euo pipefail

echo "== Autopilot (Builder Mode) =="

# 1) Prevent "analysis-only" churn: fail if someone adds NEW audit docs beyond required evidence.
# Allowed docs:
# - dashboard-schema-verification.md
# - dashboard-orphans-disposition.md
# - dashboard-consolidation-verification.md
# - autopilot-run-log.md
# Existing locked docs are also allowed.
ALLOWED_DOCS_REGEX='^(docs/(dashboard-inventory\.md|dashboard-canonical-architecture\.md|dashboard-crossed-analysis\.md|dashboard-schema-verification\.md|dashboard-orphans-disposition\.md|dashboard-consolidation-verification\.md|autopilot-run-log\.md|dashboard-consolidation-baseline\.md))$'

NEW_DOCS=$(git diff --name-only --diff-filter=ACMRT origin/main...HEAD 2>/dev/null | grep '^docs/.*\.md$' || true)

if [[ -n "${NEW_DOCS}" ]]; then
  echo "Checking newly added/changed docs under docs/..."
  while IFS= read -r f; do
    if [[ ! "$f" =~ $ALLOWED_DOCS_REGEX ]]; then
      echo "FAIL: New/changed doc not allowed in Builder Mode: $f"
      echo "Allowed docs are execution evidence docs only."
      exit 1
    fi
  done <<< "${NEW_DOCS}"
fi

# 2) Verify redirect routes exist if referenced by canonical plan
# (Light check: these files should exist after execution)
REQUIRED_REDIRECT_FILES=(
  "app/partner/dashboard/page.tsx"
  "app/portal/staff/dashboard/page.tsx"
  "app/programs/admin/dashboard/page.tsx"
)

missing=0
for f in "${REQUIRED_REDIRECT_FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "WARN: Expected redirect file missing: $f"
    missing=1
  fi
done

# 3) Run repo checks
echo "Running build/lint/typecheck if available..."

if [[ -f package.json ]]; then
  if node -e "const p=require('./package.json'); process.exit(p.scripts&&p.scripts.build?0:1)"; then
    pnpm run build
  else
    echo "NOTE: No build script detected."
  fi

  if node -e "const p=require('./package.json'); process.exit(p.scripts&&p.scripts.lint?0:1)"; then
    pnpm run lint
  else
    echo "NOTE: No lint script detected."
  fi

  if node -e "const p=require('./package.json'); process.exit(p.scripts&&p.scripts.typecheck?0:1)"; then
    pnpm run typecheck
  else
    echo "NOTE: No typecheck script detected."
  fi
else
  echo "FAIL: package.json not found."
  exit 1
fi

if [[ $missing -eq 1 ]]; then
  echo "FAIL: Missing required redirect files. Implement redirects before passing Autopilot."
  exit 1
fi

echo "PASS: Autopilot checks complete."
