#!/usr/bin/env bash
# CI guard: fails if legacy dead-link strings appear outside their redirect route files.
# Wire into CI or package.json: "lint:links": "bash scripts/no-dead-links.sh"

set -euo pipefail

FORBIDDEN_PATTERNS=(
  "/admin/course-studio"
  "/student-portal/courses"
)

# Directories that ARE allowed to contain these strings (redirect compat layers)
ALLOW_DIRS=(
  "app/admin/course-studio"
  "app/admin/course-studio-ai"
  "app/admin/course-studio-simple"
  "app/student-portal/courses"
)

build_exclude() {
  local excludes=""
  for dir in "${ALLOW_DIRS[@]}"; do
    excludes="$excludes --exclude-dir=$dir"
  done
  echo "$excludes"
}

EXCLUDES=$(build_exclude)
EXIT_CODE=0

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  # shellcheck disable=SC2086
  HITS=$(grep -rn "$pattern" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
    $EXCLUDES \
    . 2>/dev/null || true)

  if [ -n "$HITS" ]; then
    echo "FAIL: Found forbidden dead-link pattern '$pattern' outside redirect files:"
    echo "$HITS"
    echo ""
    EXIT_CODE=1
  fi
done

if [ "$EXIT_CODE" -eq 0 ]; then
  echo "PASS: No dead-link strings found outside redirect files."
fi

exit $EXIT_CODE
