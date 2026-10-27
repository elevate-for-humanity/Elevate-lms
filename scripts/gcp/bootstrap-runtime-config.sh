#!/usr/bin/env bash
# Run with the Google project administrator identity. No credential payloads
# are read or written here, and no runtime is created or made public.
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
DEPLOY="serviceAccount:elevate-github-deploy@$PROJECT.iam.gserviceaccount.com"
gcloud services enable secretmanager.googleapis.com --project="$PROJECT" --quiet
for COMPONENT in marketing admin lms store ultimate-worker studio-browser; do
  SECRET="elevate-$COMPONENT-runtime-config"
  EXISTING="$(gcloud secrets list --project="$PROJECT" --filter="name:$SECRET" --format='value(name)')"
  if [ -z "$EXISTING" ]; then
    gcloud secrets create "$SECRET" --project="$PROJECT" --replication-policy=automatic --quiet
  fi
  # All grants are confined to these six configuration resources. The deploy
  # identity receives no project-wide secret payload access or IAM authority.
  for ROLE in roles/secretmanager.viewer roles/secretmanager.secretVersionAdder roles/secretmanager.secretAccessor; do
    gcloud secrets add-iam-policy-binding "$SECRET" --project="$PROJECT" \
      --member="$DEPLOY" --role="$ROLE" --condition=None --quiet >/dev/null
  done
done
printf 'Google runtime configuration resources and scoped deployment access prepared. Run the one-time import workflow for each component.\n'
