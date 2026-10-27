#!/usr/bin/env bash
# Run as the project administrator. No secret values, deployments or state changes.
set -euo pipefail
PROJECT=elegant-racer-299721
DEPLOY="serviceAccount:elevate-github-deploy@$PROJECT.iam.gserviceaccount.com"
gcloud auth print-access-token >/dev/null
for PAIR in studio:studio-browser worker:ultimate-worker; do
  SHORT="${PAIR%%:*}"
  COMPONENT="${PAIR#*:}"
  ACCOUNT="elevate-$SHORT-runtime"
  IDENTITY="$ACCOUNT@$PROJECT.iam.gserviceaccount.com"
  # Account IDs must fit Google's 30-character maximum.
  test "${#ACCOUNT}" -le 30
  EXISTING="$(gcloud iam service-accounts list --project="$PROJECT" --filter="email=$IDENTITY" --format='value(email)')"
  if [[ -z "$EXISTING" ]]; then
    gcloud iam service-accounts create "$ACCOUNT" --project="$PROJECT" --display-name="Elevate $COMPONENT runtime" --quiet
  fi
  gcloud iam service-accounts add-iam-policy-binding "$IDENTITY" --project="$PROJECT" --member="$DEPLOY" --role=roles/iam.serviceAccountUser --condition=None --quiet >/dev/null
  gcloud artifacts repositories add-iam-policy-binding elevate --project="$PROJECT" --location=us-central1 --member="serviceAccount:$IDENTITY" --role=roles/artifactregistry.reader --condition=None --quiet >/dev/null
  gcloud secrets add-iam-policy-binding "elevate-$COMPONENT-runtime-config" --project="$PROJECT" --member="serviceAccount:$IDENTITY" --role=roles/secretmanager.secretAccessor --condition=None --quiet >/dev/null
done
printf 'Dedicated Studio and worker identities prepared. No runtime deployed, secret transferred, or source state deleted.\n'
