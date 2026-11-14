#!/usr/bin/env bash
# Configure *only* the existing finite renderer; never execute or modify a live execution.
# Default is inventory-only. Explicit APPLY_RENDER_DISK=true is required to change job configuration.
set -euo pipefail
PROJECT=elegant-racer-299721
REGION=us-central1
JOB=elevate-video-render
DISK_SIZE=8Gi
MOUNT_PATH=/mnt/render-temp
command -v gcloud >/dev/null || { echo 'gcloud unavailable'; exit 1; }
gcloud run jobs describe "$JOB" --project="$PROJECT" --region="$REGION" --format=json |
  python3 -c 'import json,sys; d=json.load(sys.stdin); t=d["spec"]["template"]["spec"]; c=t["template"]["spec"]["containers"][0]; print(json.dumps({"job":d["metadata"]["name"],"taskCount":t.get("taskCount"),"parallelism":t.get("parallelism"),"resources":c.get("resources",{}).get("limits",{}),"volumes":t["template"]["spec"].get("volumes",[]),"mounts":c.get("volumeMounts",[])}))'
# Never touch a job while an execution is still active.
ACTIVE="$(gcloud run jobs executions list --job="$JOB" --project="$PROJECT" --region="$REGION" --format=json | python3 -c 'import json,sys; a=json.load(sys.stdin); print(sum(1 for e in a if not e.get("status",{}).get("completionTime") and not any(c.get("type")=="Completed" and c.get("status") in ("True","False") for c in e.get("status",{}).get("conditions",[]))))')"
echo "active_render_executions=$ACTIVE"
if [ "$ACTIVE" != 0 ]; then echo 'Existing execution active: do not reconfigure'; exit 2; fi
if [ "${APPLY_RENDER_DISK:-false}" != true ]; then echo 'READ_ONLY: proposed 8Gi disk-backed /mnt/render-temp with TMPDIR redirect; no mutation'; exit 0; fi
# This is a Preview feature. The new volume is ephemeral and emptied automatically on task termination.
gcloud beta run jobs update "$JOB" --project="$PROJECT" --region="$REGION" \
  --add-volume=name=render-scratch,type=ephemeral-disk,size="$DISK_SIZE" \
  --add-volume-mount=volume=render-scratch,mount-path="$MOUNT_PATH" \
  --update-env-vars=TMPDIR="$MOUNT_PATH" --quiet
echo 'Configuration updated, NOT executed. Verify saved job config and run controlled render acceptance separately.'
