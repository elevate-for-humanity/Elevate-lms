#!/usr/bin/env bash
# Run as project administrator. Create separate workload identities, with
# deployment actAs scoped to those identities; grant no project runtime roles.
set -euo pipefail
PROJECT=elegant-racer-299721
DEPLOY="serviceAccount:elevate-github-deploy@$PROJECT.iam.gserviceaccount.com"
gcloud auth print-access-token >/dev/null
gcloud services enable iam.googleapis.com --project="$PROJECT" --quiet
# Listing must succeed before absence can trigger creation.
EXISTING=$(gcloud iam service-accounts list --project="$PROJECT" --format='value(email)')
for COMPONENT in store worker; do
  RUNTIME="elevate-$COMPONENT-runtime@$PROJECT.iam.gserviceaccount.com"
  if ! printf '%s\n' "$EXISTING" | grep -Fxq "$RUNTIME"; then
    gcloud iam service-accounts create "elevate-$COMPONENT-runtime" \
      --project="$PROJECT" --display-name="Elevate $COMPONENT runtime" --quiet
  fi
  gcloud iam service-accounts add-iam-policy-binding "$RUNTIME" \
    --project="$PROJECT" --member="$DEPLOY" \
    --role=roles/iam.serviceAccountUser --condition=None --quiet >/dev/null
done
printf 'Dedicated Store and worker identities prepared. No workload deployed or executed.\n'
