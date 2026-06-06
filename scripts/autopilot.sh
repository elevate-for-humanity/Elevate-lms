#!/usr/bin/env bash
set -euo pipefail

echo "== Autopilot (Builder Mode) =="

# 1) Prevent "analysis-only" churn: fail if someone adds NEW audit docs beyond required evidence.
# Allowed docs (newly added/introduced files only):
# - dashboard-schema-verification.md
# - dashboard-orphans-disposition.md
# - dashboard-consolidation-verification.md
# - autopilot-run-log.md
# Modifications to existing docs are allowed; only brand-new files are checked.
ALLOWED_DOCS_REGEX='^(docs/(dashboard-inventory\.md|dashboard-canonical-architecture\.md|dashboard-crossed-analysis\.md|dashboard-schema-verification\.md|dashboard-orphans-disposition\.md|dashboard-consolidation-verification\.md|autopilot-run-log\.md|dashboard-consolidation-baseline\.md|SECURITY\.md|platform-e2e-audit-2026-05\.md|production-activation-2026-05\.md|platform-owner-tenant-model\.md|LOCAL_DEVELOPMENT\.md))$'

NEW_DOCS=$(git diff --name-only --diff-filter=ACR origin/main...HEAD 2>/dev/null | grep '^docs/.*\.md$' || true)

if [[ -n "${NEW_DOCS}" ]]; then
  echo "Checking newly added docs under docs/..."
  while IFS= read -r f; do
    if [[ ! "$f" =~ $ALLOWED_DOCS_REGEX ]]; then
      echo "FAIL: New doc not allowed in Builder Mode: $f"
      echo "Allowed new docs are execution evidence docs only."
      exit 1
    fi
  done <<< "${NEW_DOCS}"
fi

# 2) Verify canonical portal route implementations exist.
# Keep these pointed at the real route owners so the gate does not require
# legacy redirect shims just to pass.
REQUIRED_CANONICAL_ROUTE_FILES=(
  "app/partner/dashboard/page.tsx"
  "apps/admin/app/admin/staff-portal/dashboard/page.tsx"
  "app/admin/dashboard/page.tsx"
)

missing=0
for f in "${REQUIRED_CANONICAL_ROUTE_FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "WARN: Expected canonical route file missing: $f"
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

  if [[ "${AUTOPILOT_STRICT_TYPECHECK:-false}" == "true" ]]; then
    if node -e "const p=require('./package.json'); process.exit(p.scripts&&p.scripts.typecheck?0:1)"; then
      echo "Running strict full-repo TypeScript check."
      pnpm run typecheck
    else
      echo "NOTE: No typecheck script detected."
    fi
  elif node -e "const p=require('./package.json'); process.exit(p.scripts&&p.scripts['typecheck:changed']?0:1)"; then
    echo "Running TypeScript baseline gate."
    pnpm run typecheck:changed
  elif node -e "const p=require('./package.json'); process.exit(p.scripts&&p.scripts.typecheck?0:1)"; then
    echo "NOTE: typecheck:changed not found; falling back to full typecheck."
    pnpm run typecheck
  else
    echo "NOTE: No typecheck script detected."
  fi
else
  echo "FAIL: package.json not found."
  exit 1
fi

if [[ $missing -eq 1 ]]; then
  echo "FAIL: Missing required canonical route files. Restore canonical routes before passing Autopilot."
  exit 1
fi

echo "PASS: Autopilot checks complete."
