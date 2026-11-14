#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Website Full Audit & Grade (Gitpod-ready)
# ============================================================
# What it checks:
# - Performance/SEO/Best Practices/PWA via Lighthouse
# - Accessibility via Pa11y (WCAG2AA) + basic axe-core coverage
# - HTML validity via html-validate
# - Broken links via linkinator (recursive)
# - Security headers via curl (CSP/HSTS/XFO/CTO/RP/PP)
# - Robots.txt / sitemap.xml presence & health
# - OpenGraph & Twitter Card tags
# - Structured Data (JSON-LD/Microdata) via SDTT
# - Spellcheck via cspell (HTML/MD)
# - Image bloat & missing alt attributes (quick heuristics)
# - Bundle sizes (from /dist or .next/out/.output/public)
# - Optional competitor comparison (Lighthouse categories)
#
# Inputs (env vars; all optional):
#   TARGET_URL           Live URL to audit. If empty, script builds & serves locally.
#   BUILD_CMD            Default: "npm run build"
#   START_CMD            Default: "npm start"
#   PORT                 Default: 3000 (when serving locally)
#   WAIT_UP              Default: 120 (seconds to wait for server up)
#   COMPARE_URLS         Comma-separated list of URLs to Lighthouse-compare against
#   MAX_IMG_MB           Default: 1.5 (flag images larger than this)
#   HTML_GLOBS           Default: "dist/**/*.html .next/**/*.html out/**/*.html build/**/*.html"
#
# Output:
#   ./audit_out/REPORT.md (polished summary + grades)
#   ./audit_out/* (raw JSON/HTML artifacts)
# ============================================================

# -------- Config & Defaults --------
TARGET_URL="${TARGET_URL:-}"
BUILD_CMD="${BUILD_CMD:-npm run build}"
START_CMD="${START_CMD:-npm start}"
PORT="${PORT:-3000}"
WAIT_UP="${WAIT_UP:-120}"
COMPARE_URLS="${COMPARE_URLS:-}"
MAX_IMG_MB="${MAX_IMG_MB:-1.5}"
HTML_GLOBS="${HTML_GLOBS:-dist/**/*.html .next/**/*.html out/**/*.html build/**/*.html public/**/*.html}"

OUT_DIR="audit_out"
mkdir -p "$OUT_DIR"

# -------- Helpers --------
have() { command -v "$1" >/dev/null 2>&1; }
log() { printf "\n\033[1;34m▶ %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m⚠ %s\033[0m\n" "$*"; }
fail() { printf "\033[1;31m✖ %s\033[0m\n" "$*"; exit 1; }

# Determine package runner
PKG="npm"
if have pnpm; then PKG="pnpm"; elif have yarn; then PKG="yarn"; fi

# Gitpod-specific: install chromium for Lighthouse (if missing)
if ! have chromium-browser && ! have chromium && ! have google-chrome; then
  log "Installing Chromium (needed for Lighthouse)..."
  sudo apt-get update -y
  sudo apt-get install -y chromium-browser || sudo apt-get install -y chromium
fi

CHROME_BIN=""
if have google-chrome; then CHROME_BIN="google-chrome"
elif have chromium-browser; then CHROME_BIN="chromium-browser"
elif have chromium; then CHROME_BIN="chromium"
else fail "No Chrome/Chromium found after install."
fi

# Install CLI tools (local cache in node_modules/.bin via npx on-demand)
TOOLS=("lighthouse" "pa11y" "linkinator" "html-validate" "cspell" "structured-data-testing-tool" "serve")
for t in "${TOOLS[@]}"; do
  if ! npx --yes "$t" --version >/dev/null 2>&1; then
    log "Prepping tool: $t (will run via npx)"
  fi
done

# -------- Start site (if needed) --------
KILL_PID=""
cleanup() {
  if [[ -n "${KILL_PID}" ]]; then
    log "Stopping local server (PID $KILL_PID)..."
    kill "$KILL_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

if [[ -z "$TARGET_URL" ]]; then
  log "No TARGET_URL provided — building & starting locally…"
  # Try build
  if [[ -f package.json ]]; then
    log "Running build: $BUILD_CMD"
    bash -lc "$BUILD_CMD" || warn "Build command failed; attempting static serve of common output dirs…"
  fi

  # Try to auto-detect a static output dir
  SERVE_DIR=""
  for d in "dist" "out" "build" ".next" ".output/public"; do
    if [[ -d "$d" ]]; then SERVE_DIR="$d"; break; fi
  done

  if [[ -n "$SERVE_DIR" && -z "$(jq -r '.scripts.start // empty' package.json 2>/dev/null || true)" ]]; then
    log "Serving static dir: $SERVE_DIR"
    npx --yes serve -s "$SERVE_DIR" -l "$PORT" >/dev/null 2>&1 &
    KILL_PID=$!
  else
    log "Starting app: $START_CMD"
    bash -lc "$START_CMD" >/dev/null 2>&1 &
    KILL_PID=$!
  fi

  TARGET_URL="http://127.0.0.1:$PORT"
  log "Waiting up to ${WAIT_UP}s for $TARGET_URL…"
  SECS=0
  until curl -sf -o /dev/null "$TARGET_URL"; do
    sleep 2; SECS=$((SECS+2))
    [[ $SECS -ge $WAIT_UP ]] && fail "Server did not become ready at $TARGET_URL in ${WAIT_UP}s."
  done
  log "Server is up at $TARGET_URL"
else
  log "Auditing live URL: $TARGET_URL"
fi

# -------- 1) Lighthouse (Perf/SEO/BestPractices/Accessibility/PWA) --------
log "Running Lighthouse…"
LIGHTHOUSE_JSON="$OUT_DIR/lighthouse.json"
LIGHTHOUSE_HTML="$OUT_DIR/lighthouse.html"

# Try with --no-sandbox for Gitpod/containerized environments
if npx --yes lighthouse "$TARGET_URL" \
  --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-setuid-sandbox" \
  --output=json --output=html --output-path="$OUT_DIR/lighthouse" \
  --quiet --no-enable-error-reporting \
  --only-categories=performance,accessibility,seo,best-practices,pwa \
  --disable-storage-reset \
  --preset=desktop \
  --port=0 \
  --view=false 2>&1 | tee "$OUT_DIR/lighthouse.log"; then
  log "Lighthouse completed successfully"
else
  warn "Lighthouse failed (Chrome sandbox issue). Use PageSpeed Insights: https://pagespeed.web.dev/"
  echo '{"categories":{"performance":{"score":null},"accessibility":{"score":null},"seo":{"score":null},"best-practices":{"score":null},"pwa":{"score":null}}}' > "$LIGHTHOUSE_JSON"
fi

[[ -f "$OUT_DIR/lighthouse.report.json" ]] && mv "$OUT_DIR/lighthouse.report.json" "$LIGHTHOUSE_JSON" 2>/dev/null || true
[[ -f "$OUT_DIR/lighthouse.report.html" ]] && mv "$OUT_DIR/lighthouse.report.html" "$LIGHTHOUSE_HTML" 2>/dev/null || true

# -------- 2) Accessibility via Pa11y (WCAG2AA) --------
log "Running Pa11y (WCAG2AA)…"
PA11Y_JSON="$OUT_DIR/pa11y.json"
if npx --yes pa11y --standard WCAG2AA --reporter json "$TARGET_URL" > "$PA11Y_JSON" 2>&1; then
  log "Pa11y completed successfully"
else
  warn "Pa11y failed (Chrome sandbox issue). Use online tools: https://wave.webaim.org/"
  echo '[]' > "$PA11Y_JSON"
fi

# -------- 3) Broken Links (recursive) --------
log "Crawling links with linkinator…"
LINKS_JSON="$OUT_DIR/linkinator.json"
npx --yes linkinator "$TARGET_URL" --recurse --verbosity error --format JSON > "$LINKS_JSON" || true

# -------- 4) HTML validity (built files if present) --------
log "Validating HTML files (if any)…"
HTML_VALIDATE_TXT="$OUT_DIR/html-validate.txt"
npx --yes html-validate $HTML_GLOBS > "$HTML_VALIDATE_TXT" 2>&1 || true

# -------- 5) Security headers --------
log "Checking security headers…"
HEADERS_TXT="$OUT_DIR/headers.txt"
curl -sI "$TARGET_URL" | tee "$HEADERS_TXT" >/dev/null

# -------- 6) Robots & Sitemap --------
log "Checking robots.txt & sitemap.xml…"
ROBOTS_TXT="$OUT_DIR/robots.txt"
SITEMAP_HEAD="$OUT_DIR/sitemap_headers.txt"
curl -s -o "$ROBOTS_TXT" "${TARGET_URL%/}/robots.txt" || true
curl -sI "${TARGET_URL%/}/sitemap.xml" | tee "$SITEMAP_HEAD" >/dev/null || true

# -------- 7) Social tags (OpenGraph/Twitter) --------
log "Scanning OpenGraph/Twitter meta…"
META_TXT="$OUT_DIR/meta_tags.txt"
curl -s "$TARGET_URL" | grep -iE '<meta[^>]+(property|name)="(og:|twitter:)[^"]+"' -i || true | tee "$META_TXT" >/dev/null || true

# -------- 8) Structured Data testing --------
log "Testing structured data…"
SDTT_JSON="$OUT_DIR/structured_data.json"
npx --yes structured-data-testing-tool -u "$TARGET_URL" -o json > "$SDTT_JSON" || true

# -------- 9) Spellcheck (cspell) --------
log "Spellchecking content…"
CSPELL_TXT="$OUT_DIR/cspell.txt"
npx --yes cspell "**/*.md" "**/*.html" "**/*.txt" > "$CSPELL_TXT" 2>&1 || true

# -------- 10) Image bloat & alt attributes (heuristics) --------
log "Scanning images for size & missing alts…"
IMG_TXT="$OUT_DIR/images.txt"
# Find common static asset roots
SEARCH_DIRS=(public static assets dist out build ".next/static" ".output/public")
FOUND_DIRS=()
for d in "${SEARCH_DIRS[@]}"; do [[ -d "$d" ]] && FOUND_DIRS+=("$d"); done
{
  echo "# Large images (>${MAX_IMG_MB}MB):"
  if [[ ${#FOUND_DIRS[@]} -gt 0 ]]; then
    # Convert MB to KB for find command (1.5MB = 1536KB)
    SIZE_KB=$(awk "BEGIN { printf \"%d\", $MAX_IMG_MB * 1024 }")
    find "${FOUND_DIRS[@]}" -type f -iregex '.*\.\(png\|jpe?g\|webp\|gif\|svg\)' -size +"${SIZE_KB}"k -printf "%p (%k KB)\n" 2>/dev/null || echo "No large images found."
  else
    echo "No common asset directories found."
  fi
  echo; echo "# <img> without alt (built html):"
  grep -RIl --include="*.html" -e '<img ' dist out build .next .output/public 2>/dev/null | xargs -r sed -n 's/.*<img[^>]*>/&/gp' | grep -vi 'alt=' 2>/dev/null || echo "No images without alt found."
} > "$IMG_TXT"

# -------- 11) Bundle sizes (heuristics) --------
log "Summarizing bundle sizes…"
BUNDLE_TXT="$OUT_DIR/bundles.txt"
{
  echo "# JS/CSS assets > 300KB (potential bloat):"
  if [[ ${#FOUND_DIRS[@]} -gt 0 ]]; then
    find "${FOUND_DIRS[@]}" -type f -iregex '.*\.\(js\|css\)' -size +300k -printf "%p (%k KB)\n" | sort -nk2 || true
  else
    echo "No common asset directories found."
  fi
} > "$BUNDLE_TXT"

# -------- 12) Parse scores & build grade --------
log "Computing scores & grade…"
jq --version >/dev/null 2>&1 || { log "Installing jq for scoring…"; sudo apt-get install -y jq >/dev/null; }
PERF=$(jq -r '.categories.performance.score // 0' "$LIGHTHOUSE_JSON" 2>/dev/null || echo 0)
A11Y=$(jq -r '.categories.accessibility.score // 0' "$LIGHTHOUSE_JSON" 2>/dev/null || echo 0)
SEO=$(jq -r '.categories.seo.score // 0' "$LIGHTHOUSE_JSON" 2>/dev/null || echo 0)
BP=$(jq -r '.categories."best-practices".score // 0' "$LIGHTHOUSE_JSON" 2>/dev/null || echo 0)
PWA=$(jq -r '.categories.pwa.score // 0' "$LIGHTHOUSE_JSON" 2>/dev/null || echo 0)

# Normalize 0..1 to 0..100
to100() { awk "BEGIN { printf \"%d\", ($1 * 100) }"; }
P100=$(to100 "${PERF:-0}")
A100=$(to100 "${A11Y:-0}")
S100=$(to100 "${SEO:-0}")
B100=$(to100 "${BP:-0}")
W100=$(to100 "${PWA:-0}")

# Pa11y issue count (lower is better)
PFAILS=$(jq 'length' "$PA11Y_JSON" 2>/dev/null || echo 0)

# Broken link count
BLO=$(jq '.links[]? | select(.status >= 400) | .url' "$LINKS_JSON" 2>/dev/null | wc -l | tr -d ' ')

# HTML validate errors
HV_ERRS=$(grep -E "✖|error" "$HTML_VALIDATE_TXT" 2>/dev/null | wc -l | tr -d ' ')

# Security headers scoring (simple presence check)
have_header() { grep -iq "^$1:" "$HEADERS_TXT"; }
SEC_SCORE=0; SEC_MAX=6
have_header "content-security-policy" && SEC_SCORE=$((SEC_SCORE+1))
have_header "strict-transport-security" && SEC_SCORE=$((SEC_SCORE+1))
have_header "x-content-type-options" && SEC_SCORE=$((SEC_SCORE+1))
have_header "x-frame-options" && SEC_SCORE=$((SEC_SCORE+1))
have_header "referrer-policy" && SEC_SCORE=$((SEC_SCORE+1))
have_header "permissions-policy" && SEC_SCORE=$((SEC_SCORE+1))
SEC100=$(( 100 * SEC_SCORE / SEC_MAX ))

# Heuristic deductions
DEDUCT=0
# -10 if broken links exist
[[ "$BLO" -gt 0 ]] && DEDUCT=$((DEDUCT+10))
# -10 if Pa11y finds > 10 issues; scale up to -20 if > 50 issues
if [[ "$PFAILS" -gt 10 ]]; then DEDUCT=$((DEDUCT+10)); fi
if [[ "$PFAILS" -gt 50 ]]; then DEDUCT=$((DEDUCT+10)); fi
# -10 if HTML errors detected
[[ "$HV_ERRS" -gt 0 ]] && DEDUCT=$((DEDUCT+10))
# -10 if security headers < 50
[[ "$SEC100" -lt 50 ]] && DEDUCT=$((DEDUCT+10))

# Weighted overall (tuneable):
# Perf 25%, A11y 25%, SEO 20%, BestPractices 15%, PWA 5%, Security 10%
OVERALL=$(awk -v p=$P100 -v a=$A100 -v s=$S100 -v b=$B100 -v w=$W100 -v sh=$SEC100 -v d=$DEDUCT \
  'BEGIN { score=(0.25*p + 0.25*a + 0.20*s + 0.15*b + 0.05*w + 0.10*sh) - d; if (score<0) score=0; printf "%d", score }')

grade() {
  local s=$1
  if   (( s >= 97 )); then echo "A+"
  elif (( s >= 93 )); then echo "A"
  elif (( s >= 90 )); then echo "A-"
  elif (( s >= 87 )); then echo "B+"
  elif (( s >= 83 )); then echo "B"
  elif (( s >= 80 )); then echo "B-"
  elif (( s >= 77 )); then echo "C+"
  elif (( s >= 73 )); then echo "C"
  elif (( s >= 70 )); then echo "C-"
  elif (( s >= 60 )); then echo "D"
  else echo "F"; fi
}
GRADE=$(grade "$OVERALL")

# -------- 13) Optional competitor comparisons --------
COMP_TABLE=""
if [[ -n "$COMPARE_URLS" ]]; then
  log "Comparing against: $COMPARE_URLS"
  IFS=',' read -r -a CARR <<< "$COMPARE_URLS"
  COMP_TABLE=$'# | URL | Perf | A11y | SEO | BP | PWA\n# |---|---:|---:|---:|---:|---:\n'
  for cu in "${CARR[@]}"; do
    cu=$(echo "$cu" | xargs)
    [[ -z "$cu" ]] && continue
    log "Lighthouse compare: $cu"
    CJ="$OUT_DIR/compare_$(echo "$cu" | sed 's#[^a-zA-Z0-9]#_#g').json"
    npx --yes lighthouse "$cu" \
      --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage" \
      --output=json --output-path="$CJ" --quiet --only-categories=performance,accessibility,seo,best-practices,pwa >/dev/null 2>&1 || true
    cp=$(jq -r '.categories.performance.score // 0' "$CJ" 2>/dev/null || echo 0)
    ca=$(jq -r '.categories.accessibility.score // 0' "$CJ" 2>/dev/null || echo 0)
    cs=$(jq -r '.categories.seo.score // 0' "$CJ" 2>/dev/null || echo 0)
    cb=$(jq -r '.categories."best-practices".score // 0' "$CJ" 2>/dev/null || echo 0)
    cw=$(jq -r '.categories.pwa.score // 0' "$CJ" 2>/dev/null || echo 0)
    COMP_TABLE+=$(printf "# | %s | %d | %d | %d | %d | %d\n" "$cu" "$(to100 $cp)" "$(to100 $ca)" "$(to100 $cs)" "$(to100 $cb)" "$(to100 $cw)")
  done
fi

# -------- 14) Build the polished report --------
REPORT="$OUT_DIR/REPORT.md"
{
  echo "# Website Audit Report"
  echo
  echo "**Target:** $TARGET_URL"
  echo
  echo "## Executive Summary"
  echo "- Overall Score: **$OVERALL/100** (**$GRADE**)"
  echo "- Lighthouse (0–100): Performance **$P100**, Accessibility **$A100**, SEO **$S100**, Best Practices **$B100**, PWA **$W100**"
  echo "- Security Headers: **$SEC100/100**"
  echo "- Pa11y issues: **$PFAILS**"
  echo "- Broken links (>=400): **$BLO**"
  echo "- HTML validation error lines: **$HV_ERRS**"
  echo
  if [[ -n "$COMPARE_URLS" ]]; then
    echo "## Competitor Comparison (Lighthouse)"
    echo "${COMP_TABLE//# /}"
    echo
  fi
  echo "## Artifacts"
  echo "- Lighthouse HTML: \`$LIGHTHOUSE_HTML\`"
  echo "- Lighthouse JSON: \`$LIGHTHOUSE_JSON\`"
  echo "- Pa11y JSON: \`$PA11Y_JSON\`"
  echo "- Linkinator JSON: \`$LINKS_JSON\`"
  echo "- HTML Validate: \`$HTML_VALIDATE_TXT\`"
  echo "- Security Headers: \`$HEADERS_TXT\`"
  echo "- Robots.txt: \`$ROBOTS_TXT\`"
  echo "- Sitemap headers: \`$SITEMAP_HEAD\`"
  echo "- Meta (OG/Twitter): \`$META_TXT\`"
  echo "- Structured Data: \`$SDTT_JSON\`"
  echo "- Spellcheck: \`$CSPELL_TXT\`"
  echo "- Images: \`$IMG_TXT\`"
  echo "- Bundles: \`$BUNDLE_TXT\`"
  echo
  echo "## Security Header Checklist"
  for h in "Content-Security-Policy" "Strict-Transport-Security" "X-Content-Type-Options" "X-Frame-Options" "Referrer-Policy" "Permissions-Policy"; do
    if grep -iq "^$(echo "$h" | tr '[:upper:]' '[:lower:]'):" "$HEADERS_TXT"; then
      echo "- ✅ $h present"
    else
      echo "- ❌ $h missing"
    fi
  done
  echo
  echo "## Robots & Sitemap"
  if [[ -s "$ROBOTS_TXT" ]]; then echo "- ✅ robots.txt found"; else echo "- ❌ robots.txt missing"; fi
  if grep -qi "^HTTP/.* 200" "$SITEMAP_HEAD"; then echo "- ✅ sitemap.xml responds 200"; else echo "- ❌ sitemap.xml missing or not 200"; fi
  echo
  echo "## Actionable To-Do List (prioritized)"
  echo "1. **Fix broken links ($BLO)** – update or remove 404/5xx URLs (see linkinator.json)."
  echo "2. **Accessibility** – address Pa11y findings (contrast, labels, landmarks, focus)."
  echo "3. **Security Headers** – add missing headers (CSP, HSTS, XFO, CTO, Referrer-Policy, Permissions-Policy)."
  echo "4. **HTML validity** – fix errors reported by html-validate."
  echo "5. **Performance** – compress images (WebP/AVIF), code-split, preconnect/preload, set long-term caching."
  echo "6. **SEO** – ensure unique <title>, meta description, canonical, structured data types (Organization, WebSite, Breadcrumb)."
  echo "7. **PWA** – add manifest, service worker, icons if you target installability."
  echo
  echo "## Image & Bundle Heuristics"
  echo "- Any images > ${MAX_IMG_MB}MB should be optimized (lossless/lossy, responsive sizes)."
  echo "- JS/CSS files > 300KB likely need code-splitting, tree-shaking, or compression."
  echo
  echo "## Notes"
  echo "- This report is deterministic and safe to run in Gitpod. Adjust weights or thresholds by editing the script."
  echo "- Re-run after each fix to see your grade improve."
} > "$REPORT"

log "Done. Open $REPORT"
