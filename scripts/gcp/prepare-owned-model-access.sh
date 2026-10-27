#!/usr/bin/env bash
# Run once as the Google project owner. No model token is printed and no GPU
# compute is allocated. Grants are restricted to the model's resources.
set -euo pipefail
PROJECT=elegant-racer-299721
IDENTITY="elevate-llm-runtime@$PROJECT.iam.gserviceaccount.com"
DEPLOY="serviceAccount:elevate-github-deploy@$PROJECT.iam.gserviceaccount.com"
SECRET=elevate-owned-llm-token
EXISTING="$(gcloud iam service-accounts list --project="$PROJECT" --filter="email=$IDENTITY" --format='value(email)')"
if [[ -z "$EXISTING" ]]; then
  gcloud iam service-accounts create elevate-llm-runtime --project="$PROJECT" --display-name='Elevate owned model runtime' --quiet
fi
gcloud iam service-accounts add-iam-policy-binding "$IDENTITY" --project="$PROJECT" --member="$DEPLOY" --role=roles/iam.serviceAccountUser --condition=None --quiet >/dev/null
if ! gcloud secrets describe "$SECRET" --project="$PROJECT" --format='value(name)' >/dev/null 2>&1; then
  gcloud secrets create "$SECRET" --project="$PROJECT" --replication-policy=automatic
fi
for ROLE in roles/secretmanager.viewer roles/secretmanager.secretAccessor roles/secretmanager.secretVersionManager; do
  gcloud secrets add-iam-policy-binding "$SECRET" --project="$PROJECT" --member="$DEPLOY" --role="$ROLE" --condition=None --quiet >/dev/null
done
ADMIN_IDENTITY="$(gcloud run services describe elevate-admin-migration --project="$PROJECT" --region=us-central1 --format='value(spec.template.spec.serviceAccountName)')"
[[ "$ADMIN_IDENTITY" =~ ^[a-z0-9-]+@elegant-racer-299721\.iam\.gserviceaccount\.com$ ]]
for MEMBER in "serviceAccount:$IDENTITY" "serviceAccount:$ADMIN_IDENTITY"; do
  gcloud secrets add-iam-policy-binding "$SECRET" --project="$PROJECT" --member="$MEMBER" --role=roles/secretmanager.secretAccessor --condition=None --quiet >/dev/null
done
# The deployer already deploys Cloud Run services. Permit policy changes only
# on this model service so its existing bearer-authenticated API is reachable.
gcloud projects add-iam-policy-binding "$PROJECT" --member="$DEPLOY" --role=roles/run.admin \
  --condition="expression=resource.name.endsWith('/services/elevate-owned-llm'),title=owned-model-service-only" --quiet >/dev/null
printf 'Dedicated model identity and token access prepared. No GPU compute allocated.\n'
