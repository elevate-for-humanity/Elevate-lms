#!/usr/bin/env bash
# Execute with a Google project administrator identity, not the deployment SA.
# Metadata only: no secret payload, object content, deployment or deletion access.
set -euo pipefail
# Require an explicitly selected administrator session before any mutation.
ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null)" || {
  printf 'Google authentication could not be inspected. Run gcloud auth login, then retry.\n' >&2
  exit 1
}
if [[ -z "$ACTIVE_ACCOUNT" ]]; then
  printf 'No active Google account. Run gcloud auth login with the project administrator account, then retry.\n' >&2
  exit 1
fi
if ! gcloud auth print-access-token >/dev/null 2>&1; then
  printf 'Google credentials are unavailable or expired. Run gcloud auth login, then retry.\n' >&2
  exit 1
fi
PROJECT=elegant-racer-299721
ROLE=elevateMigrationInventoryV1
DEPLOY="serviceAccount:elevate-github-deploy@$PROJECT.iam.gserviceaccount.com"
PERMISSIONS='secretmanager.secrets.list,secretmanager.secrets.get,cloudscheduler.jobs.list,cloudscheduler.jobs.get,storage.buckets.list,storage.buckets.get,compute.snapshots.list,resourcemanager.projects.get,resourcemanager.projects.getIamPolicy'
TASK_DIR=$(mktemp -d)
trap 'rm -rf "$TASK_DIR"' EXIT

gcloud services enable cloudresourcemanager.googleapis.com secretmanager.googleapis.com cloudscheduler.googleapis.com --project="$PROJECT" --quiet
EXISTING=$(gcloud iam roles list --project="$PROJECT" --filter="name=projects/$PROJECT/roles/$ROLE" --format='value(name)')
if [[ "$EXISTING" == "projects/$PROJECT/roles/$ROLE" ]]; then
  gcloud iam roles describe "$ROLE" --project="$PROJECT" --format=json > "$TASK_DIR/role.json"
  # Refuse to bind an existing role with unexpected permissions.
  python3 - "$TASK_DIR/role.json" "$PERMISSIONS" <<'PY'
import json, sys
role = json.load(open(sys.argv[1]))
if set(role.get('includedPermissions', [])) != set(sys.argv[2].split(',')) or role.get('deleted'):
    raise SystemExit('Existing inventory role differs. Administrator review required; no binding added.')
PY
else
  gcloud iam roles create "$ROLE" --project="$PROJECT" \
    --title='Elevate migration metadata inventory' \
    --description='Read inventory metadata only; no credential payloads or infrastructure mutations.' \
    --permissions="$PERMISSIONS" --stage=GA --quiet
fi
gcloud projects add-iam-policy-binding "$PROJECT" --member="$DEPLOY" \
  --role="projects/$PROJECT/roles/$ROLE" --condition=None --quiet >/dev/null
printf 'Metadata inventory access prepared. Rerun inventory-google-ownership.yml; all boundaries must succeed.\n'

