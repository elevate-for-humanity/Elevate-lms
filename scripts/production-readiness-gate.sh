#!/usr/bin/env bash
# Production activation gate — run before promote/deploy.
# Exit 1 on any blocking failure.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NODE_OPTIONS='--max-old-space-size=12288'
export DISABLE_WEBPACK_FILESYSTEM_CACHE=
export BUILD_SCOPE=1

echo "=== Production Readiness Gate ==="
echo "=== PARIS Operations Kernel Validation ==="
FAIL=0
WARN=0

run() {
  local name="$1"; shift
  echo ""; echo "--- $name ---"
  if "$@"; then echo "OK: $name"; else echo "FAIL: $name"; FAIL=$((FAIL+1)); fi
}

section(){ echo ""; echo "=============================================="; echo "$1"; echo "=============================================="; }

section "SECTION 1: CORE SECURITY CHECKS"
run "API admin guards" bash scripts/audit-api-auth-guards.sh
run "Auth gaps (strict production-sensitive enforcement)" bash scripts/audit-auth-gaps.sh --strict
run "Env vars" bash scripts/audit-env-vars.sh
run "Redirect conflicts" env BUILD_SCOPE=1 node scripts/check-redirect-conflicts.mjs
run "Route and SEO governance" node scripts/check-route-seo-governance.mjs
run "Public route guards" node scripts/guard-public-routes.mjs
run "Pre-auth registry" node scripts/check-pre-auth-registry.cjs
run "Canonical portal contracts" node scripts/audit-portal-contracts.mjs
run "Repository schema drift regression" npx tsx scripts/audit-schema-drift.ts --baseline scripts/schema-drift-baseline.json --fail-on-new-drift
run "Live portal data integrity" node scripts/audit-portal-data-integrity.mjs
run "Privileged MFA architecture" node scripts/check-privileged-mfa-config.mjs

if [[ -f scripts/audit-public-html.mjs ]]; then
  if [[ -n "${PUBLIC_HTML_AUDIT_BASE_URL:-}" ]]; then
    run "Public HTML hygiene" node scripts/audit-public-html.mjs
  else
    echo ""; echo "--- Public HTML hygiene ---"
    echo "WARN: Public HTML validation was not executed because PUBLIC_HTML_AUDIT_BASE_URL is unset."
    WARN=$((WARN+1))
  fi
fi

section "SECTION 2: CANONICAL DATA & CLAIM EVIDENCE"
[[ -f lib/registry/programs.ts ]] && echo "OK: Canonical program registry adapter exists" || { echo "FAIL: Canonical program registry adapter missing"; FAIL=$((FAIL+1)); }
[[ -f supabase/migrations/20260820023000_program_regulatory_claim_controls.sql ]] && echo "OK: Program regulatory claim controls migration exists" || { echo "FAIL: Program regulatory claim controls migration missing"; FAIL=$((FAIL+1)); }
[[ -f supabase/migrations/20260820030000_claim_evidence_runtime_hardening.sql ]] && echo "OK: Runtime claim-evidence migration exists" || { echo "FAIL: Runtime claim-evidence migration missing"; FAIL=$((FAIL+1)); }
if grep -q "program_regulatory_status" supabase/migrations/20260820023000_program_regulatory_claim_controls.sql \
  && grep -q "program_claim_evidence" supabase/migrations/20260820023000_program_regulatory_claim_controls.sql \
  && grep -q "credential_integrity_records" supabase/migrations/20260820030000_claim_evidence_runtime_hardening.sql \
  && grep -q "student_risk_events" supabase/migrations/20260820030000_claim_evidence_runtime_hardening.sql; then
  echo "OK: Canonical regulatory, credential-integrity, and risk-evidence contracts found"
else
  echo "FAIL: Canonical claim-evidence contracts are incomplete"; FAIL=$((FAIL+1))
fi
if grep -R "from('program_registry')\|from(\"program_registry\")\|from('verified_claims')\|from(\"verified_claims\")\|from('workflow_instances')\|from(\"workflow_instances\")" lib apps components --include='*.ts' --include='*.tsx' 2>/dev/null | grep -vE '(\.test\.|\.spec\.)' >/dev/null; then
  echo "FAIL: Retired authoritative-data table names are still referenced by runtime code"; FAIL=$((FAIL+1))
else
  echo "OK: No runtime references to retired authoritative-data tables"
fi

section "SECTION 3: PROGRAM REGISTRY"
[[ -f lib/registry/programs.ts ]] && echo "OK: Program Registry exists" || { echo "FAIL: Program Registry missing"; FAIL=$((FAIL+1)); }
if [[ -d data/programs ]]; then
  PROGRAM_COUNT=$(find data/programs -name '*.ts' ! -name index.ts 2>/dev/null | wc -l)
  if [[ "$PROGRAM_COUNT" -gt 0 ]]; then echo "OK: $PROGRAM_COUNT program data files found"; else echo "FAIL: program data directory is empty"; FAIL=$((FAIL+1)); fi
else
  echo "FAIL: Program data directory missing"; FAIL=$((FAIL+1))
fi
run "Registered apprenticeship architecture" node scripts/check-registered-apprenticeship-architecture.mjs

section "SECTION 4: VERIFIED CLAIMS & PUBLIC VISUALS"
[[ -f components/ComplianceBadges.tsx ]] && echo "OK: Compliance Badges component exists" || { echo "WARN: Compliance Badges component missing"; WARN=$((WARN+1)); }
[[ -f lib/automation/evidence-processor.ts ]] && echo "OK: Evidence processor exists" || { echo "WARN: Evidence processor missing"; WARN=$((WARN+1)); }
run "Public claim integrity" node scripts/check-public-claims.mjs
run "Homepage visual integrity" node scripts/check-home-visual-integrity.mjs
run "Hero banner integrity" npx tsx scripts/audit-hero-banners.ts

section "SECTION 5: WORKFLOW ENGINE"
[[ -f lib/workflows/engine.ts ]] && echo "OK: Workflow Engine exists" || { echo "FAIL: Workflow Engine missing"; FAIL=$((FAIL+1)); }
[[ -f lib/orchestration/state-machine.ts ]] && echo "OK: State Machine exists" || { echo "FAIL: State Machine missing"; FAIL=$((FAIL+1)); }

section "SECTION 6: NOTIFICATION SYSTEM"
if [[ -d lib/notifications ]]; then
  NOTIF_COUNT=$(find lib/notifications -name '*.ts' 2>/dev/null | wc -l)
  [[ "$NOTIF_COUNT" -gt 0 ]] && echo "OK: Notification system exists ($NOTIF_COUNT files)" || { echo "FAIL: Notification directory is empty"; FAIL=$((FAIL+1)); }
else
  echo "FAIL: Notification system missing"; FAIL=$((FAIL+1))
fi

section "SECTION 7: PLACEHOLDER DETECTION"
PLACEHOLDER_FOUND=0
for pattern in "555-1234" "555-0000" "xxx-xxx-xxxx" "000-000-0000" "(555) 123-4567" "555-4567" "555-0147"; do
  if grep -rF "$pattern" components/ apps/ app-legacy/ 2>/dev/null | grep -vE '\.(test|spec)\.' | grep -v 'placeholder=' | grep -v '{{.*}}' >/dev/null; then
    echo "FAIL: Placeholder phone found: $pattern"; PLACEHOLDER_FOUND=1; FAIL=$((FAIL+1))
  fi
done
[[ $PLACEHOLDER_FOUND -eq 0 ]] && echo "OK: No placeholder phone numbers"
for pattern in "example.com" "your-email" "test@test"; do
  if grep -riF "$pattern" components/ apps/ app-legacy/ 2>/dev/null | grep -i email | grep -vE '\.(test|spec)\.' >/dev/null; then
    echo "WARN: Potential placeholder email found: $pattern"; WARN=$((WARN+1))
  fi
done

section "SECTION 8: STRIPE CONFIGURATION"
if [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "OK: Stripe Secret Key configured"
else
  echo "FAIL: Stripe Secret Key is required for production readiness"
  FAIL=$((FAIL+1))
fi
if [[ -n "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
  echo "OK: Stripe Webhook Secret configured in job environment"
elif [[ "${STRIPE_WEBHOOK_RUNTIME_VERIFIED:-}" == "true" ]]; then
  echo "OK: Stripe Webhook Secret verified in canonical runtime secret store"
else
  echo "FAIL: Stripe Webhook Secret is required for production readiness"
  FAIL=$((FAIL+1))
fi
run "Stripe implementation integrity" node scripts/check-stripe-integrity.mjs

section "SECTION 9: DEPLOYMENT BLOCKERS"
UNFINISHED=$(grep -rE '<!--\s*(TODO|FIXME|UNDER CONSTRUCTION)' components/ apps/ app-legacy/ 2>/dev/null | grep -vE '\.(test|spec)\.' | wc -l || true)
if [[ "$UNFINISHED" -gt 0 ]]; then echo "FAIL: Unfinished content markers found: $UNFINISHED"; FAIL=$((FAIL+1)); else echo "OK: No unfinished content markers"; fi
run "Link integrity" node scripts/integrity/links.mjs
run "LMS integrity" node scripts/integrity/lms.mjs
run "Store integrity" node scripts/integrity/store.mjs

section "SECTION 10: DEV STUDIO INTEGRATION"
if [[ -f scripts/dev-studio-integration-gate.sh ]]; then
  run "Dev Studio Integration Gate" bash scripts/dev-studio-integration-gate.sh
else
  echo "WARN: Dev Studio Integration Gate not found"; WARN=$((WARN+1))
fi
[[ -f lib/studio/command-allowlist.ts ]] && echo "OK: Command allowlist exists" || { echo "WARN: Command allowlist not found"; WARN=$((WARN+1)); }

section "SECTION 11: CONTAINER / DEPLOYMENT SHAPE"
[[ -f Dockerfile.production ]] && echo "OK: Unified Dockerfile exists" || { echo "WARN: Unified Dockerfile not found"; WARN=$((WARN+1)); }

section "PRODUCTION READINESS SUMMARY"
echo "Blocking Failures: $FAIL"
echo "Warnings: $WARN"
if [[ "$FAIL" -gt 0 ]]; then
  echo "❌ PRODUCTION GATE FAILED"
  exit 1
fi
if [[ "$WARN" -gt 0 ]]; then
  echo "⚠️ PRODUCTION GATE PASSED WITH WARNINGS"
  exit 0
fi
echo "✅ PRODUCTION GATE PASSED"
exit 0
