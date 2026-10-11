#!/usr/bin/env bash
# One-command PBX prerequisite and live-transport verification.
# Never switches carrier routing, reloads Asterisk, prints credentials or starts services.
set -Eeuo pipefail
PROJECT=elegant-racer-299721
ZONE=us-central1-a
VM=elevate-pbx
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
failures=0
check(){ local label="$1"; shift; if "$@"; then printf 'PASS %s\n' "$label"; else printf 'BLOCKED %s\n' "$label"; failures=$((failures+1)); fi; }
echo 'PBX READINESS AUDIT — no production writes'
check auth gcloud auth print-access-token
check correct-project bash -c '[ "$(gcloud config get-value project 2>/dev/null)" = elegant-racer-299721 ]'
check vm-running bash -c '[ "$(gcloud compute instances describe elevate-pbx --project=elegant-racer-299721 --zone=us-central1-a --format=value\(status\))" = RUNNING ]'
for secret in elevate-pbx-provisioning-token elevate-pbx-supabase-service-role elevate-paris-turn-token elevate-paris-ari-password; do
  check "secret:$secret" bash -c 'test -n "$(gcloud secrets versions list "$1" --project=elegant-racer-299721 --filter="state=ENABLED" --limit=1 --format="value(name)" 2>/dev/null)"' _ "$secret"
done
check source-tests node --test scripts/gcp/prepare-pbx-secrets.test.mjs
check transport node scripts/gcp/verify-pbx-transport.mjs
echo 'VM SAFE CHECKS (no secrets or configuration contents)'
if gcloud compute ssh "$VM" --project="$PROJECT" --zone="$ZONE" --quiet --command='
  set -eu
  C=pbx_asterisk_1
  sudo docker inspect "$C" --format "{{.State.Running}}" | grep -Fx true
  for name in elevate-paris-gateway elevate-paris-turn elevate-pbx-provisioner; do
    printf "%s active=" "$name"
    sudo systemctl is-active "$name" || true
  done
  for name in paris.conf provisioner.conf; do
    if sudo test -f "/etc/elevate-pbx/$name"; then echo "PRESENT $name"; else echo "MISSING $name"; fi
  done
  sudo docker exec "$C" asterisk -rx "core show channels count"
  sudo docker exec "$C" asterisk -rx "pjsip show endpoints" | tail -3
  sudo docker exec "$C" asterisk -rx "dialplan show 0@internal" || true
  sudo docker exec "$C" asterisk -rx "voicemail show users" || true
  sudo ss -lnt | grep -E ":(8090|8091)[[:space:]]" || true
'; then echo 'PASS VM inspected'; else echo 'BLOCKED VM inspection'; failures=$((failures+1)); fi
echo 'AUTHORITATIVE AUDIT (status can be nonzero while transport is healthy)'
if gcloud compute ssh "$VM" --project="$PROJECT" --zone="$ZONE" --quiet --command='sudo python3 -' < scripts/gcp/audit-pbx-runtime.py; then
  echo 'PASS PBX audit'
else
  echo 'BLOCKED PBX audit — inspect per-check results above'
  failures=$((failures+1))
fi
echo 'No Telnyx, dialplan, IAM, VM service or production traffic was changed.'
if (( failures )); then echo "NOT READY: $failures blocked checks"; exit 1; fi
echo 'Prerequisites passed; actual SIP/WebRTC, operator transfer and audio acceptance still require a controlled real test.'
