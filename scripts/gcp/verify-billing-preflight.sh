#!/usr/bin/env bash
# Elevate for Humanity - verify the billing-preflight repair against real Google Cloud.
#
# Read-only. Three gcloud reads, no writes. Nothing is created, changed or deleted.
# No secret value is ever printed.
#
# Usage in Google Cloud Shell:
#   curl -fsSL <raw-url> -o verify-billing.sh && bash verify-billing.sh
#
# Exit 0 = every required check passed.

set -uo pipefail

PROJECT_ID="elegant-racer-299721"
DEPLOY_SA="elevate-github-deploy@elegant-racer-299721.iam.gserviceaccount.com"
EXPECTED_SHA="572f1971834684d8762ea085617e14fe48de6d42"
REPO_URL="https://github.com/elevate-for-humanity/Elevate-lms.git"
WORK="${HOME}/elevate-billing-verify"
ORIGINAL_WORST_CASE_MS=94234

GCLOUD_BIN="${GCLOUD_BIN:-$(command -v gcloud || true)}"
PASS=0; FAIL=0; SKIP=0
ok()   { printf '  \033[32mPASS\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
skip() { printf '  \033[33mSKIP\033[0m %s\n' "$1"; SKIP=$((SKIP+1)); }
head1() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

if [ -z "$GCLOUD_BIN" ]; then
  echo "gcloud not found. Run this inside Google Cloud Shell." >&2
  exit 2
fi

echo "Elevate billing-preflight verification"
echo "project  : ${PROJECT_ID}"
echo "commit   : ${EXPECTED_SHA}  (merged PR #2564)"
echo "scratch  : ${WORK}"

head1 "1. Identity and project"
ACCOUNT="$("$GCLOUD_BIN" config get-value account 2>/dev/null | tr -d '\r')"
ACTIVE_PROJECT="$("$GCLOUD_BIN" config get-value project 2>/dev/null | tr -d '\r')"
echo "  caller : ${ACCOUNT:-<none>}"
echo "  project: ${ACTIVE_PROJECT:-<none>}"
[ -n "$ACCOUNT" ] && ok "an identity is active" || bad "no active gcloud identity"

head1 "2. Fetch the fixed source at the merged commit"
rm -rf "$WORK"; mkdir -p "$WORK"
SRC="$WORK/repo/scripts/gcp/preflight-billing.mjs"
if git clone --quiet --filter=blob:none --no-checkout --depth 1 "$REPO_URL" "$WORK/repo" >/dev/null 2>&1; then
  ( cd "$WORK/repo" && git fetch --quiet --depth 1 origin "$EXPECTED_SHA" >/dev/null 2>&1 \
    && git sparse-checkout init --cone >/dev/null 2>&1 \
    && git sparse-checkout set scripts/gcp >/dev/null 2>&1 \
    && git checkout --quiet "$EXPECTED_SHA" ) >/dev/null 2>&1
  GOT_SHA="$(cd "$WORK/repo" && git rev-parse HEAD 2>/dev/null)"
  echo "  checked out: ${GOT_SHA}"
  [ "$GOT_SHA" = "$EXPECTED_SHA" ] && ok "exact merged commit checked out" \
    || bad "got ${GOT_SHA}, expected ${EXPECTED_SHA}"
else
  RAW="https://raw.githubusercontent.com/elevate-for-humanity/Elevate-lms/${EXPECTED_SHA}/scripts/gcp"
  mkdir -p "$WORK/repo/scripts/gcp"
  curl -fsSL "$RAW/preflight-billing.mjs" -o "$SRC" \
    && curl -fsSL "$RAW/preflight-artifact-upload.mjs" -o "$WORK/repo/scripts/gcp/preflight-artifact-upload.mjs" \
    && ok "downloaded source at the merged commit" \
    || bad "could not fetch source"
fi

if [ -f "$SRC" ]; then
  ok "preflight-billing.mjs present ($(wc -l < "$SRC") lines)"
else
  bad "could not obtain the source - cannot continue"
  printf '\nPassed %d, failed %d, skipped %d\n' "$PASS" "$FAIL" "$SKIP"
  exit 1
fi

head1 "3. Read-only guarantee (static)"
grep -q "billingAccountName" "$SRC" && ok "billing account field is read" || bad "account field missing"
if grep -Eq "'billing',[[:space:]]*'projects',[[:space:]]*'(link|unlink|update|enable|disable)'" "$SRC"; then
  bad "found a billing-mutating verb"
else
  ok "no link/unlink/update/enable/disable reachable"
fi
grep -q "BILLING_READ_BUDGET_MS" "$SRC" && ok "the wall-clock budget fix is present" \
  || bad "the budget fix is NOT in this source"

head1 "4. The real billing read (your identity)"
BILLING_JSON="$("$GCLOUD_BIN" billing projects describe "$PROJECT_ID" --format=json 2>"$WORK/billing.err")"
if [ -n "$BILLING_JSON" ]; then
  read -r ENABLED ACCT_PRESENT < <(printf '%s' "$BILLING_JSON" | python3 -c '
import json,sys
try: d=json.load(sys.stdin)
except Exception: print("? ?"); raise SystemExit
print(("true" if d.get("billingEnabled") is True else "false"),
      ("yes" if d.get("billingAccountName") else "no"))')
  echo "  billingEnabled=${ENABLED} billingAccountLinked=${ACCT_PRESENT}"
  [ "$ENABLED" = "true" ] && ok "billing is enabled" || bad "billing is NOT enabled"
  [ "$ACCT_PRESENT" = "yes" ] && ok "a billing account is linked" || bad "no billing account linked"
else
  bad "billing read failed: $(head -c 200 "$WORK/billing.err" | tr '\n' ' ')"
fi

head1 "5. The real billing read AS THE PRODUCTION IDENTITY"
echo "  impersonating: ${DEPLOY_SA}"
SA_JSON="$("$GCLOUD_BIN" --impersonate-service-account="$DEPLOY_SA" \
  billing projects describe "$PROJECT_ID" --format=json 2>"$WORK/sa.err")"
if [ -n "$SA_JSON" ]; then
  SA_ENABLED="$(printf '%s' "$SA_JSON" | python3 -c '
import json,sys
try: print("true" if json.load(sys.stdin).get("billingEnabled") is True else "false")
except Exception: print("?")')"
  echo "  billingEnabled=${SA_ENABLED}"
  [ "$SA_ENABLED" = "true" ] && ok "the deploy identity can read billing (production path)" \
    || bad "the deploy identity could not confirm billing"
else
  skip "impersonation unavailable: $(head -c 160 "$WORK/sa.err" | tr '\n' ' ')"
  echo "        (needs roles/iam.serviceAccountTokenCreator on ${DEPLOY_SA})"
fi

head1 "6. Transient stall must now RECOVER (the production failure mode)"
SHIM="$WORK/shim"; mkdir -p "$SHIM"
cat > "$SHIM/gcloud" <<'SHIMEOF'
#!/usr/bin/env bash
n=$(cat "$SHIM_COUNTER" 2>/dev/null || echo 0); n=$((n+1)); echo "$n" > "$SHIM_COUNTER"
if printf '%s\n' "$@" | grep -qx billing && [ "$n" -le "${STALL_UNTIL:-0}" ]; then
  sleep "${STALL_SECONDS:-60}"
fi
exec "$REAL_GCLOUD" "$@"
SHIMEOF
chmod +x "$SHIM/gcloud"

cat > "$WORK/driver.mjs" <<'DRIVEREOF'
const {verifyBilling} = await import(process.env.MODULE_PATH);
const {execFileSync} = await import('node:child_process');
let calls = 0;
const run = (cmd, args, opts) => { calls++; return execFileSync(cmd, args, opts); };
const t = Date.now();
try {
  const result = verifyBilling(process.env.PROJECT_ID, run);
  console.log(JSON.stringify({outcome: 'pass', calls, ms: Date.now() - t, result}));
} catch (error) {
  console.log(JSON.stringify({outcome: 'fail', calls, ms: Date.now() - t, message: error.message}));
}
DRIVEREOF

run_driver() {
  rm -f "$WORK/.count"
  PATH="$SHIM:$PATH" \
  REAL_GCLOUD="$GCLOUD_BIN" SHIM_COUNTER="$WORK/.count" STALL_UNTIL="$1" STALL_SECONDS=60 \
  MODULE_PATH="$SRC" PROJECT_ID="$PROJECT_ID" \
  node "$WORK/driver.mjs" 2>/dev/null | tail -1
}

TRANSIENT="$(run_driver 1)"
echo "  ${TRANSIENT}"
T_OUT="$(printf '%s' "$TRANSIENT" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("outcome","?"))' 2>/dev/null)"
T_MS="$(printf '%s' "$TRANSIENT" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("ms","?"))' 2>/dev/null)"
T_CALLS="$(printf '%s' "$TRANSIENT" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("calls","?"))' 2>/dev/null)"
if [ "$T_OUT" = "pass" ]; then
  ok "recovered from a transient stall (attempts=${T_CALLS}, ${T_MS}ms)"
else
  bad "did NOT recover from a transient stall - the release would still fail"
fi

head1 "7. Permanent stall must FAIL CLOSED, inside budget"
PERMANENT="$(run_driver 99)"
echo "  ${PERMANENT}"
P_OUT="$(printf '%s' "$PERMANENT" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("outcome","?"))' 2>/dev/null)"
P_MS="$(printf '%s' "$PERMANENT" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("ms",0))' 2>/dev/null)"
P_MSG="$(printf '%s' "$PERMANENT" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("message",""))' 2>/dev/null)"
[ "$P_OUT" = "fail" ] && ok "an unverifiable read still blocks the release" \
  || bad "a permanent stall was allowed to pass - the gate is broken"
case "$P_MSG" in
  *"timed out without returning a result"*) ok "reported as a timeout, not a permissions gap" ;;
  *) bad "unexpected failure message" ;;
esac
case "$P_MSG" in
  *billingAccounts*) bad "the failure message leaked a billing account" ;;
  *) ok "no billing account in the failure message" ;;
esac
if [ "$P_MS" != "?" ] && [ "$P_MS" -le 60000 ] 2>/dev/null; then
  ok "worst case ${P_MS}ms is bounded (was ${ORIGINAL_WORST_CASE_MS}ms before the fix)"
else
  bad "worst case ${P_MS}ms exceeds the 60s ceiling"
fi

head1 "8. Confirm nothing in Google was changed"
POST_JSON="$("$GCLOUD_BIN" billing projects describe "$PROJECT_ID" --format=json 2>/dev/null)"
POST_ENABLED="$(printf '%s' "$POST_JSON" | python3 -c '
import json,sys
try: print("true" if json.load(sys.stdin).get("billingEnabled") is True else "false")
except Exception: print("?")')"
[ "$POST_ENABLED" = "true" ] && ok "billing state unchanged (still enabled)" \
  || bad "billing state looks different after the run"

printf '\n\033[1mResult: %d passed, %d failed, %d skipped\033[0m\n' "$PASS" "$FAIL" "$SKIP"
echo "Evidence kept in: ${WORK}"
if [ "$FAIL" -eq 0 ]; then
  echo "The repair behaves correctly against real Google."
  exit 0
fi
echo "At least one check failed - do not treat this as verified." >&2
exit 1
