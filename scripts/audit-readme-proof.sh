#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="audit_artifacts/readme-proof"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
GIT_SHA="$(git rev-parse HEAD 2>/dev/null || echo 'NO_GIT')"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'NO_GIT')"
HOST="$(hostname || true)"

OUT_MD="${OUT_DIR}/README_PROOF_${TS//:/-}.md"

# Helper: safe grep that reports found/not found without failing the script
check_string () {
  local label="$1"
  local needle="$2"
  local path_glob="${3:-.}"
  echo "### ${label}"
  echo ""
  echo "- String: \`${needle}\`"
  echo "- Scope: \`${path_glob}\`"
  echo ""
  if grep -rn --include='*.tsx' --include='*.ts' --include='*.md' --include='*.json' \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
    "$needle" $path_glob > /tmp/rg_hits.txt 2>/dev/null; then
    local count
    count="$(wc -l < /tmp/rg_hits.txt | tr -d ' ')"
    echo "- Result: FOUND (${count} hits)"
    echo ""
    echo "First 25 hits:"
    echo ""
    echo '```'
    head -25 /tmp/rg_hits.txt
    echo '```'
  else
    echo "- Result: NOT FOUND"
  fi
  echo ""
}

# Helper: count files matching known patterns
count_glob () {
  local label="$1"
  local glob="$2"
  local count="NA"
  case "$glob" in
    "app/**/page.tsx")
      count="$(find app -type f -name 'page.tsx' 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    "app/api/**/route.ts")
      count="$(find app/api -type f -name 'route.ts' 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    "components/**/*.tsx")
      count="$(find components -type f \( -name '*.tsx' -o -name '*.ts' \) 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    "lib/**/*.ts")
      count="$(find lib -type f -name '*.ts' 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    "supabase/migrations/**/*.sql")
      count="$(find supabase/migrations -type f -name '*.sql' 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    "scripts/**/*")
      count="$(find scripts -type f 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    "public/**/*.(png|jpg|jpeg|webp|svg|gif)")
      count="$(find public -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' -o -iname '*.svg' -o -iname '*.gif' \) 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    "public/**/*.mp4")
      count="$(find public -type f -iname '*.mp4' 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    "docs/**/*")
      count="$(find docs -type f 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    "netlify/functions/**/*")
      count="$(find netlify/functions -type f 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    "error.tsx")
      count="$(find app -type f -name 'error.tsx' 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    "loading.tsx")
      count="$(find app -type f -name 'loading.tsx' 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    "not-found.tsx")
      count="$(find app -type f -name 'not-found.tsx' 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    "layout.tsx")
      count="$(find app -type f -name 'layout.tsx' 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    "notFound()-calls")
      count="$(grep -rl 'notFound()' app/ --include='*.tsx' --include='*.ts' --exclude-dir=node_modules 2>/dev/null | wc -l | tr -d ' ')"
      ;;
    *)
      count="UNSUPPORTED_GLOB"
      ;;
  esac
  echo "| ${label} | \`${glob}\` | ${count} |"
}

# Package version helper
pkg_version () {
  local key="$1"
  node -e "try{const p=require('./package.json');console.log((p.dependencies&&p.dependencies['$key'])||(p.devDependencies&&p.devDependencies['$key'])||'NOT_FOUND')}catch(e){console.log('NO_PACKAGE_JSON')}"
}

mkdir -p "$OUT_DIR"

{
  echo "# README Proof / Evidence Packet"
  echo ""
  echo "Generated (UTC): **${TS}**"
  echo ""
  echo "Repo:"
  echo "- Branch: \`${BRANCH}\`"
  echo "- Commit: \`${GIT_SHA}\`"
  echo "- Host: \`${HOST}\`"
  echo ""
  echo "Tooling:"
  echo "- Node: \`$(node -v 2>/dev/null || echo 'N/A')\`"
  echo "- pnpm: \`$(pnpm -v 2>/dev/null || echo 'N/A')\`"
  echo ""
  echo "## Tech Stack Versions (from package.json)"
  echo ""
  echo "| Package | Declared version |"
  echo "|---|---|"
  echo "| next | \`$(pkg_version next)\` |"
  echo "| react | \`$(pkg_version react)\` |"
  echo "| typescript | \`$(pkg_version typescript)\` |"
  echo "| tailwindcss | \`$(pkg_version tailwindcss)\` |"
  echo "| @supabase/supabase-js | \`$(pkg_version @supabase/supabase-js)\` |"
  echo "| stripe | \`$(pkg_version stripe)\` |"
  echo "| resend | \`$(pkg_version resend)\` |"
  echo "| openai | \`$(pkg_version openai)\` |"
  echo "| zod | \`$(pkg_version zod)\` |"
  echo "| zustand | \`$(pkg_version zustand)\` |"
  echo "| react-hook-form | \`$(pkg_version react-hook-form)\` |"
  echo ""
  echo "## Codebase Counts"
  echo ""
  echo "| Metric | Pattern | Count |"
  echo "|---|---|---|"
  count_glob "Pages" "app/**/page.tsx"
  count_glob "API routes" "app/api/**/route.ts"
  count_glob "Components" "components/**/*.tsx"
  count_glob "Library modules" "lib/**/*.ts"
  count_glob "SQL migrations" "supabase/migrations/**/*.sql"
  count_glob "Scripts" "scripts/**/*"
  count_glob "Static images" "public/**/*.(png|jpg|jpeg|webp|svg|gif)"
  count_glob "Video files" "public/**/*.mp4"
  count_glob "Netlify functions" "netlify/functions/**/*"
  count_glob "Error boundaries" "error.tsx"
  count_glob "Loading states" "loading.tsx"
  count_glob "Not-found pages" "not-found.tsx"
  count_glob "Layouts" "layout.tsx"
  count_glob "Files calling notFound()" "notFound()-calls"
  echo ""
  echo "## Resilience Coverage"
  echo ""
  echo "### Multi-page segments with error.tsx + loading.tsx"
  echo ""
  echo "| Segment | Pages | error.tsx | loading.tsx |"
  echo "|---|---|---|---|"
  find app/ -maxdepth 1 -type d | sort | while read d; do
    [ "$d" = "app/" ] && continue
    [ "$d" = "app/api" ] && continue
    name=$(basename "$d")
    pages=$(find "$d" -name "page.tsx" 2>/dev/null | wc -l | tr -d ' ')
    [ "$pages" -lt 2 ] && continue
    has_error="❌"; has_loading="❌"
    [ -f "$d/error.tsx" ] && has_error="✅"
    [ -f "$d/loading.tsx" ] && has_loading="✅"
    echo "| ${name} | ${pages} | ${has_error} | ${has_loading} |"
  done
  echo ""
  echo "### Dynamic routes with notFound() validation"
  echo ""
  total_dynamic=$(find app/ -path "*/\[*\]*/page.tsx" ! -path "*/api/*" 2>/dev/null | wc -l | tr -d ' ')
  covered=0
  uncovered=0
  find app/ -path "*/\[*\]*/page.tsx" ! -path "*/api/*" 2>/dev/null | while read f; do
    dir=$(dirname "$f")
    found=0
    check="$dir"
    while [ "$check" != "app" ] && [ "$check" != "." ]; do
      if [ -f "$check/layout.tsx" ] && grep -q "notFound()" "$check/layout.tsx" 2>/dev/null; then
        found=1; break
      fi
      if [ -f "$check/page.tsx" ] && grep -q "notFound()" "$check/page.tsx" 2>/dev/null; then
        found=1; break
      fi
      check=$(dirname "$check")
    done
    if [ "$found" -eq 1 ]; then
      echo "COVERED"
    else
      echo "UNCOVERED: $f"
    fi
  done > /tmp/dynamic_audit.txt
  covered_count=$(grep -c "^COVERED" /tmp/dynamic_audit.txt || echo 0)
  uncovered_list=$(grep "^UNCOVERED" /tmp/dynamic_audit.txt || true)
  echo "- Total dynamic routes: ${total_dynamic}"
  echo "- Covered by notFound(): ${covered_count}"
  if [ -n "$uncovered_list" ]; then
    echo "- Uncovered:"
    echo ""
    echo '```'
    echo "$uncovered_list"
    echo '```'
  else
    echo "- Uncovered: 0"
  fi
  echo ""
  echo "## README Content Snapshot"
  echo ""
  if [ -f README.md ]; then
    echo "- SHA256: \`$(sha256sum README.md | awk '{print $1}')\`"
    echo ""
    echo '```'
    cat README.md
    echo '```'
  fi
  echo ""
  echo "## Key Claim Verification"
  echo ""
} > "$OUT_MD"

{
  check_string "Legal entity: 2Exclusive LLC-S" "2Exclusive LLC-S" "."
  check_string "DBA: Elevate for Humanity Career & Training Institute" "Elevate for Humanity Career" "."
  check_string "EIN: 88-2609728" "88-2609728" "."
  check_string "RAPIDS Program ID: 2025-IN-132301" "2025-IN-132301" "."
  check_string "RAPIDS Sponsor ID: 206251" "206251" "."
  check_string "RAPIDS Sponsor ID: 208029" "208029" "."
  check_string "Production URL" "https://www.elevateforhumanity.org" "."
  check_string "Supabase project ID" "cuxzzpsyufcewtmicszk" "."
  check_string "Compliance routes" "/compliance" "app"
  check_string "WIOA routes" "/wioa" "app"
  check_string "ETPL routes" "/etpl" "app"
  check_string "Apprenticeship routes" "/apprentice" "app"
  check_string "Employer portal routes" "/employer-portal" "app"
  check_string "LMS routes" "/lms" "app"
  check_string "Funding routes" "/funding" "app"
  check_string "notFound() import" "notFound" "app"
} >> "$OUT_MD"

# Manifest for tamper evidence
MANIFEST="${OUT_DIR}/MANIFEST_${TS//:/-}.txt"
find . -type f \
  -not -path './.git/*' \
  -not -path './node_modules/*' \
  -not -path './.next/*' \
  -not -path './dist/*' \
  -not -path './build/*' \
  -not -path './audit_artifacts/*' \
  -print0 \
  | sort -z \
  | xargs -0 sha256sum > "$MANIFEST" 2>/dev/null || true

{
  echo ""
  echo "## Integrity"
  echo ""
  echo "- Manifest file: \`${MANIFEST}\`"
  echo "- Manifest SHA256: \`$(sha256sum "$MANIFEST" | awk '{print $1}')\`"
  echo "- Total files in manifest: $(wc -l < "$MANIFEST" | tr -d ' ')"
} >> "$OUT_MD"

echo "✅ Report: $OUT_MD"
echo "✅ Manifest: $MANIFEST"
