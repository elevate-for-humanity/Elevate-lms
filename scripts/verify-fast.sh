#!/usr/bin/env bash
# scripts/verify-fast.sh
#
# Fast pre-commit / pre-push verification that catches real breaks without
# requiring a full webpack build.
#
# What it checks (and why each is safe):
#
#   tsc --incremental   — Full TypeScript dependency graph. Skips files whose
#                         transitive inputs haven't changed. Catches downstream
#                         breaks (e.g. you changed lib/supabase/server.ts and
#                         a consumer in app/admin/page.tsx now has a type error).
#                         NOT file-scoped — cannot miss a downstream break.
#
#   eslint (no cache)   — Full lint pass on all tracked TS/TSX files. No --cache
#                         flag so stale cache cannot hide new violations.
#
#   vitest              — Full unit test suite (991 tests, ~10s).
#
#   structural guards   — Fast static analysis scripts that catch auth gaps,
#                         fake-success patterns, critical route regressions,
#                         pre-auth table violations, and grants audit gaps.
#                         Each runs in <500ms.
#
# What it does NOT check:
#
#   webpack compilation — Use `pnpm build:local` for that. It compiles ~583
#                         pages (quarantined scope) and catches route-level
#                         build errors that tsc cannot see.
#
# Exit behaviour: any failing step exits immediately with a non-zero code.
# The script never swallows failures.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Colour helpers — degrade gracefully if terminal doesn't support them
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
RESET='\033[0m'

step() { echo -e "\n${BOLD}▶ $1${RESET}"; }
ok()   { echo -e "${GREEN}✓ $1${RESET}"; }
fail() { echo -e "${RED}✗ $1${RESET}"; exit 1; }

echo -e "${BOLD}Elevate LMS — fast verification${RESET}"
echo "Checks: tsc (incremental) · eslint · vitest · structural guards"
echo "For build-level errors run: pnpm build:local"
echo ""

# ── 1. TypeScript — incremental, full dependency graph ───────────────────────
step "TypeScript (incremental)"
# NODE_OPTIONS matches the typecheck script in package.json (8 GB heap).
# --incremental reads .next/cache/tsbuildinfo.json (set in tsconfig.json).
# First run is slow; subsequent runs on the same commit are fast.
if NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit; then
  ok "TypeScript — no errors"
else
  fail "TypeScript errors found. Fix before committing."
fi

# ── 2. ESLint — full pass, no cache ──────────────────────────────────────────
step "ESLint (full, no cache)"
# --max-warnings=0 means any warning is a failure.
# We intentionally do NOT pass --cache here — a stale cache can hide new violations.
if NODE_OPTIONS="--max-old-space-size=4096" npx eslint . \
    --ext .js,.jsx,.ts,.tsx \
    --max-warnings=0 \
    --no-error-on-unmatched-pattern; then
  ok "ESLint — clean"
else
  fail "ESLint violations found."
fi

# ── 3. Unit tests ─────────────────────────────────────────────────────────────
step "Unit tests (vitest)"
if npx vitest run; then
  ok "All unit tests passed"
else
  fail "Unit tests failed."
fi

# ── 4. Structural guards (fast static analysis) ───────────────────────────────
step "Structural guards"

# Fake-success / silent-failure patterns
if node scripts/guard-no-fake-success.mjs > /dev/null 2>&1; then
  ok "No fake-success patterns"
else
  echo -e "${YELLOW}⚠ guard-no-fake-success found issues:${RESET}"
  node scripts/guard-no-fake-success.mjs || true
  fail "Fake-success patterns detected."
fi

# Critical route guard (enrollment / booking / payment / signout)
if node scripts/guard-critical-routes.mjs > /dev/null 2>&1; then
  ok "Critical routes intact"
else
  echo -e "${YELLOW}⚠ guard-critical-routes found issues:${RESET}"
  node scripts/guard-critical-routes.mjs || true
  fail "Critical route regression detected."
fi

# Pre-auth table registry
if node scripts/check-pre-auth-registry.cjs > /dev/null 2>&1; then
  ok "Pre-auth registry clean"
else
  echo -e "${YELLOW}⚠ Pre-auth registry violations:${RESET}"
  node scripts/check-pre-auth-registry.cjs || true
  fail "Unregistered pre-auth table writes detected."
fi

# Grants audit context
if node scripts/check-grants-audit-context.cjs > /dev/null 2>&1; then
  ok "Grants audit context clean"
else
  echo -e "${YELLOW}⚠ Grants audit context violations:${RESET}"
  node scripts/check-grants-audit-context.cjs || true
  fail "Missing grants audit context detected."
fi

# Garbage audit (console.log, debug artifacts)
if node scripts/ci-garbage-audit.mjs > /dev/null 2>&1; then
  ok "Garbage audit clean"
else
  echo -e "${YELLOW}⚠ Garbage audit found issues:${RESET}"
  node scripts/ci-garbage-audit.mjs || true
  fail "Garbage audit failed."
fi

# Admin route audit
if node scripts/ci-admin-route-audit.mjs > /dev/null 2>&1; then
  ok "Admin route audit clean"
else
  echo -e "${YELLOW}⚠ Admin route audit found issues:${RESET}"
  node scripts/ci-admin-route-audit.mjs || true
  fail "Admin route audit failed."
fi

# Migration lint
if node scripts/lint-migrations.cjs > /dev/null 2>&1; then
  ok "Migration lint clean"
else
  echo -e "${YELLOW}⚠ Migration lint found issues:${RESET}"
  node scripts/lint-migrations.cjs || true
  fail "Migration lint failed."
fi

echo ""
echo -e "${GREEN}${BOLD}✅ All checks passed.${RESET}"
echo "Run 'pnpm build:local' to verify webpack compilation (~583 pages)."
