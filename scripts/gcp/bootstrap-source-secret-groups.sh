#!/usr/bin/env bash
# Run in Google Cloud Shell with the project administrator account.
# Creates empty destinations and scoped importer access. Never reads payloads.
set -euo pipefail
PROJECT=elegant-racer-299721
IMPORTER="serviceAccount:elevate-github-deploy@$PROJECT.iam.gserviceaccount.com"
gcloud auth print-access-token >/dev/null
gcloud services enable secretmanager.googleapis.com --project="$PROJECT" --quiet
SECRETS=(
  elevate-source-elevate-platform-elevate-production-env
  elevate-source-elevate-platform-sentry-config-new
  elevate-source-elevate-platform-stripe-secret-key
  elevate-source-elevate-platform-stripe-webhook-secret
  elevate-source-elevate-platform-anthropic-api-key
  elevate-source-elevate-platform-groq-api-key
  elevate-source-elevate-platform-admin-api-key
  elevate-source-elevate-platform-resend-api-key
  elevate-source-elevate-platform-next-public-stripe-publishable-key
  elevate-source-elevate-platform-stripe-webhook-secret-store
  elevate-source-elevate-platform-stripe-webhook-secret-barber
  elevate-source-elevate-platform-stripe-webhook-secret-license
  elevate-source-elevate-platform-stripe-webhook-secret-donations
  elevate-source-elevate-platform-ssn-salt
  elevate-source-elevate-platform-elevate-gpu-client-env
  elevate-source-elevate-platform-elevate-cron-runtime
  elevate-source-elevate-platform-elevate-llm-client-env
  elevate-source-elevate-platform-elevate-admin-github-token
  elevate-source-elevate-platform-telnyx-api-key
  elevate-source-elevate-platform-elevate-media-runtime-secrets
  elevate-source-elevate-platform-elevate-media-worker-secrets
  elevate-source-elevate-media-gpu-elevate-gpu-worker-env
  elevate-source-elevate-media-gpu-elevate-llm-worker-env
)
for SECRET in "${SECRETS[@]}"; do
  if ! gcloud secrets describe "$SECRET" --project="$PROJECT" --format='value(name)' >/dev/null 2>&1; then
    gcloud secrets create "$SECRET" --project="$PROJECT" --replication-policy=automatic --quiet
  fi
  for ROLE in roles/secretmanager.viewer roles/secretmanager.secretVersionAdder roles/secretmanager.secretAccessor; do
    gcloud secrets add-iam-policy-binding "$SECRET" --project="$PROJECT" \
      --member="$IMPORTER" --role="$ROLE" --condition=None --quiet >/dev/null
  done
done
printf '23 empty secret-group destinations and confined importer permissions are ready. No source resources changed.\n'
