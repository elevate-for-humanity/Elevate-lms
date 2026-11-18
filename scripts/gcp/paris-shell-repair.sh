#!/usr/bin/env bash
# Guarded PARIS Cloud Shell infrastructure repair: no IAM/DB/secret writes.
set -Eeuo pipefail
PROJECT=elegant-racer-299721
REGION=us-east1
SERVICE=elevate-owned-cpu-llm
MODE="${1:---diagnose}"
[[ "$MODE" == --apply || "$MODE" == --diagnose ]] || { echo 'Usage: --diagnose | --apply'; exit 2; }
command -v gcloud >/dev/null && command -v python3 >/dev/null || { echo 'Missing gcloud/python3'; exit 1; }
LOGDIR="$HOME/paris-repair-reports"
mkdir -p "$LOGDIR"; chmod 700 "$LOGDIR"
REPORT="$LOGDIR/$(date -u +%Y%m%dT%H%M%SZ)-$$.log"
touch "$REPORT"; chmod 600 "$REPORT"
exec > >(tee -a "$REPORT") 2>&1
echo "PARIS recovery report: $REPORT"
gcloud auth list --filter='status:ACTIVE' --format='value(account)' | grep -q . || { echo 'BLOCKED: no active gcloud account'; exit 1; }
TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
readback() {
  gcloud run services describe "$SERVICE" --project="$PROJECT" --region="$REGION" --format=json > "$TMP"
  python3 - "$TMP" <<'PY'
import json,sys
j=json.load(open(sys.argv[1]))
a=j.get('spec',{}).get('template',{}).get('metadata',{}).get('annotations',{})
s=j.get('spec',{}).get('template',{}).get('spec',{})
st=j.get('status',{})
ready=any(c.get('type')=='Ready' and c.get('status')=='True' for c in st.get('conditions',[]))
route=sum(x.get('percent',0) for x in st.get('traffic',[]))
print('ready:',ready,'route:',route,'revision:',st.get('latestReadyRevisionName'),'max:',a.get('autoscaling.knative.dev/maxScale'),'concurrency:',s.get('containerConcurrency'),'boost:',a.get('run.googleapis.com/startup-cpu-boost'))
if not ready or route!=100: sys.exit(10)
if a.get('autoscaling.knative.dev/maxScale')!='2' or s.get('containerConcurrency')!=1 or a.get('run.googleapis.com/startup-cpu-boost')!='true': sys.exit(11)
PY
}
if readback; then
  echo 'PASS: approved Cloud Run configuration already applied'
else
  status=$?
  if [[ "$status" -ne 11 ]]; then echo 'BLOCKED: service not ready, route invalid or inspection failed'; exit 1; fi
  if [[ "$MODE" != --apply ]]; then echo 'DRIFT: use --apply to reconcile approved configuration'; exit 2; fi
  gcloud run services update "$SERVICE" --project="$PROJECT" --region="$REGION" --max-instances=2 --concurrency=1 --cpu-boost --quiet
  readback || { echo 'FAIL: update readback invalid'; exit 1; }
fi
echo 'Recent model HTTP failures (last hour):'
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="elevate-owned-cpu-llm" AND httpRequest.status>=400' --project="$PROJECT" --freshness=1h --limit=20 --format='table(timestamp,httpRequest.status,httpRequest.latency)' || true
echo 'Recent model POSTs (last hour):'
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="elevate-owned-cpu-llm" AND httpRequest.requestMethod="POST"' --project="$PROJECT" --freshness=1h --limit=20 --format='table(timestamp,httpRequest.status,httpRequest.latency)' || true
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd 2>/dev/null || true)"
PROBE="$HERE/probe-owned-cpu-admin.mjs"
if [[ ! -f "$PROBE" ]]; then PROBE="$HOME/Elevate-lms/scripts/gcp/probe-owned-cpu-admin.mjs"; fi
if [[ ! -f "$PROBE" ]]; then echo 'BLOCKED: existing authenticated Admin probe unavailable'; exit 1; fi
command -v node >/dev/null || { echo 'BLOCKED: Node.js missing'; exit 1; }
export CPU_MODEL_URL="$(gcloud run services describe "$SERVICE" --project="$PROJECT" --region="$REGION" --format='value(status.url)')"
echo 'Running isolated Admin-to-model discovery probe (may incur Cloud Run Job charges)...'
node "$PROBE"
echo 'PASS: Cloud Run configuration + authenticated Admin model discovery'
echo 'NOT YET CERTIFIED: text generation, tool calling, PARIS repair dispatch, GitHub merge, production deployment'
