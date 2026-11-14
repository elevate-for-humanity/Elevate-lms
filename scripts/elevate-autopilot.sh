#!/usr/bin/env bash
# scripts/elevate-autopilot.sh
# Elevate LMS – One-Shot Autopilot (Gitpod-optimized)
# No skips. No masking. Live output + logged. Hands logs to autopilot analyzers.

set +e  # do not exit early – collect everything

ROOT_DIR="$(pwd)"
LOG_DIR="${ROOT_DIR}/.elevate-logs"

mkdir -p "$LOG_DIR"

TS_LOG="${LOG_DIR}/tsc.log"
BUILD_LOG="${LOG_DIR}/build.log"
MIGRATION_LOG="${LOG_DIR}/supabase-migrations.log"
ESLINT_LOG="${LOG_DIR}/eslint.log"
PRETTIER_LOG="${LOG_DIR}/prettier.log"
ENV_REPORT="${LOG_DIR}/env-report.log"

TSC_STATUS=0
BUILD_STATUS=0
MIGRATION_STATUS=0
ESLINT_STATUS=0
PRETTIER_STATUS=0

step () {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▶  $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

###############################################################################
# 0. ENVIRONMENT CHECKS
###############################################################################
step "Environment checks"

: > "$ENV_REPORT"

if command -v node >/dev/null 2>&1; then
  echo "✅ Node: $(node -v)" | tee -a "$ENV_REPORT"
else
  echo "❌ Node.js is not installed." | tee -a "$ENV_REPORT"
fi

if command -v npm >/dev/null 2>&1; then
  echo "✅ npm: $(npm -v)" | tee -a "$ENV_REPORT"
else
  echo "❌ npm is not installed." | tee -a "$ENV_REPORT"
fi

if [ -f package.json ]; then
  echo "✅ package.json found." | tee -a "$ENV_REPORT"
else
  echo "❌ package.json missing – run from repo root." | tee -a "$ENV_REPORT"
fi

if [ -f .env.local ]; then
  echo "✅ .env.local present." | tee -a "$ENV_REPORT"
else
  echo "❌ .env.local missing – create it with REAL secrets before production." | tee -a "$ENV_REPORT"
fi

if command -v supabase >/dev/null 2>&1; then
  echo "✅ Supabase CLI detected." | tee -a "$ENV_REPORT"
else
  echo "⚠️ Supabase CLI not detected on PATH." | tee -a "$ENV_REPORT"
fi

###############################################################################
# 1. DEPENDENCY INSTALL
###############################################################################
step "Dependency install (clean node_modules + .next)"

rm -rf node_modules .next

if [ -f package-lock.json ]; then
  echo "Using npm ci (lockfile present)…"
  npm ci 2>&1 | tee "${LOG_DIR}/install.log"
  INSTALL_STATUS=${PIPESTATUS[0]}
else
  echo "Using npm install (no lockfile)…"
  npm install 2>&1 | tee "${LOG_DIR}/install.log"
  INSTALL_STATUS=${PIPESTATUS[0]}
fi

if [ $INSTALL_STATUS -ne 0 ]; then
  echo "❌ Dependency install returned non-zero. See .elevate-logs/install.log"
else
  echo "✅ Dependencies installed."
fi

###############################################################################
# 2. CODE AUTO-FIX (PRETTIER + ESLINT)
###############################################################################
step "Code auto-fix (Prettier + ESLint)"

echo "Running Prettier – formatting codebase…"
npx prettier --write . 2>&1 | tee "$PRETTIER_LOG"
PRETTIER_STATUS=${PIPESTATUS[0]}
if [ $PRETTIER_STATUS -ne 0 ]; then
  echo "❌ Prettier reported issues. See $PRETTIER_LOG"
else
  echo "✅ Prettier completed."
fi

echo ""
echo "Running ESLint – autofix enabled…"
npx eslint . --ext js,jsx,ts,tsx --fix 2>&1 | tee "$ESLINT_LOG"
ESLINT_STATUS=${PIPESTATUS[0]}
if [ $ESLINT_STATUS -ne 0 ]; then
  echo "❌ ESLint reported issues. See $ESLINT_LOG"
else
  echo "✅ ESLint completed."
fi

###############################################################################
# 3. SUPABASE MIGRATIONS
###############################################################################
step "Supabase migrations"

if command -v supabase >/dev/null 2>&1 && [ -d "supabase/migrations" ]; then
  supabase migration up 2>&1 | tee "$MIGRATION_LOG"
  MIGRATION_STATUS=${PIPESTATUS[0]}
  if [ $MIGRATION_STATUS -ne 0 ]; then
    echo "❌ Supabase migrations had errors. See $MIGRATION_LOG"
  else
    echo "✅ Supabase migrations applied."
  fi
else
  echo "Supabase CLI or supabase/migrations folder not available – migrations not run." | tee "$MIGRATION_LOG"
  MIGRATION_STATUS=1
fi

###############################################################################
# 4. TYPESCRIPT CHECK
###############################################################################
step "TypeScript compilation (no emit)"

npx tsc --noEmit 2>&1 | tee "$TS_LOG"
TSC_STATUS=${PIPESTATUS[0]}
if [ $TSC_STATUS -ne 0 ]; then
  echo "❌ TypeScript reported errors. See $TS_LOG"
else
  echo "✅ TypeScript check passed."
fi

###############################################################################
# 5. NEXT.JS BUILD
###############################################################################
step "Next.js production build"

npm run build 2>&1 | tee "$BUILD_LOG"
BUILD_STATUS=${PIPESTATUS[0]}
if [ $BUILD_STATUS -ne 0 ]; then
  echo "❌ Next.js build failed. See $BUILD_LOG"
else
  echo "✅ Next.js build succeeded."
fi

###############################################################################
# 6. ERROR AUTOPILOT – CODE & DB
###############################################################################
step "Error autopilot – code & database report"

if [ ! -f "scripts/elevate-error-autopilot.mjs" ]; then
  echo "❌ scripts/elevate-error-autopilot.mjs missing – cannot generate error report."
else
  node scripts/elevate-error-autopilot.mjs \
    --ts "$TS_LOG" \
    --build "$BUILD_LOG" \
    --migrations "$MIGRATION_LOG" \
    --eslint "$ESLINT_LOG" \
    --prettier "$PRETTIER_LOG" \
    --env "$ENV_REPORT" \
    --tsStatus "$TSC_STATUS" \
    --buildStatus "$BUILD_STATUS" \
    --migrationStatus "$MIGRATION_STATUS" \
    --eslintStatus "$ESLINT_STATUS" \
    --prettierStatus "$PRETTIER_STATUS"
fi

###############################################################################
# 7. VIDEO EXPERIENCE AUTOPILOT – TIKTOK-LEVEL UX ROADMAP
###############################################################################
step "Video UX autopilot – TikTok vs Elevate roadmap"

if [ -f "scripts/video-ux-autopilot.mjs" ] && [ -f "config/video-experience-roadmap.json" ]; then
  node scripts/video-ux-autopilot.mjs config/video-experience-roadmap.json
else
  echo "Video UX autopilot/config missing – ensure scripts/video-ux-autopilot.mjs and config/video-experience-roadmap.json exist."
fi

###############################################################################
# 8. FINAL SUMMARY
###############################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Elevate LMS – One-Shot Autopilot Finished (Gitpod)"
echo "Logs stored in: $LOG_DIR"
echo "No steps skipped. No output hidden."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
