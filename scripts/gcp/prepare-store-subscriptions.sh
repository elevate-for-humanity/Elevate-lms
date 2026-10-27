#!/usr/bin/env bash
# Project administrator preparation. Creates a dormant dispatcher, never runs it.
set -euo pipefail
PROJECT=elegant-racer-299721
REGION=us-central1
JOB=elevate-store-subscriptions
SECRET=elevate-billing-cron-secret
DEPLOY="serviceAccount:elevate-github-deploy@$PROJECT.iam.gserviceaccount.com"
RUNTIME="elevate-billing-runtime@$PROJECT.iam.gserviceaccount.com"
SCHEDULER="elevate-billing-scheduler@$PROJECT.iam.gserviceaccount.com"
gcloud auth print-access-token >/dev/null
gcloud services enable run.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com --project="$PROJECT" --quiet
for ACCOUNT in elevate-billing-runtime elevate-billing-scheduler; do
  IDENTITY="$ACCOUNT@$PROJECT.iam.gserviceaccount.com"
  if [[ -z "$(gcloud iam service-accounts list --project="$PROJECT" --filter="email=$IDENTITY" --format='value(email)')" ]]; then
    gcloud iam service-accounts create "$ACCOUNT" --project="$PROJECT" --display-name="$ACCOUNT" --quiet
  fi
  gcloud iam service-accounts add-iam-policy-binding "$IDENTITY" --project="$PROJECT" --member="$DEPLOY" --role=roles/iam.serviceAccountUser --condition=None --quiet >/dev/null
done
if [[ -z "$(gcloud secrets list --project="$PROJECT" --filter="name:$SECRET" --format='value(name)')" ]]; then
  gcloud secrets create "$SECRET" --project="$PROJECT" --replication-policy=automatic --quiet
fi
# Split only the existing Google-owned cron value; no provider credential is copied.
SOURCE_DIR="$(mktemp -d)"
trap 'rm -rf "$SOURCE_DIR"' EXIT
chmod 700 "$SOURCE_DIR"
gcloud secrets versions access latest --secret=elevate-admin-runtime-config --project="$PROJECT" | python3 -c 'import json,sys; v=json.load(sys.stdin)["runtimeEnvironment"].get("CRON_SECRET"); assert isinstance(v,str) and len(v)>=16,"Admin cron credential is missing"; sys.stdout.write(v)' > "$SOURCE_DIR/cron"
chmod 600 "$SOURCE_DIR/cron"
if [[ -z "$(gcloud secrets versions list "$SECRET" --project="$PROJECT" --filter=state:ENABLED --format='value(name)' --limit=1)" ]]; then
  gcloud secrets versions add "$SECRET" --project="$PROJECT" --data-file="$SOURCE_DIR/cron" --quiet >/dev/null
else
  gcloud secrets versions access latest --secret="$SECRET" --project="$PROJECT" > "$SOURCE_DIR/existing"
  cmp -s "$SOURCE_DIR/cron" "$SOURCE_DIR/existing" || { printf 'Existing billing cron credential differs; resolve its rotation before deployment.\n' >&2; exit 1; }
fi
gcloud secrets add-iam-policy-binding "$SECRET" --project="$PROJECT" --member="serviceAccount:$RUNTIME" --role=roles/secretmanager.secretAccessor --condition=None --quiet >/dev/null
gcloud artifacts repositories add-iam-policy-binding elevate --project="$PROJECT" --location="$REGION" --member="serviceAccount:$RUNTIME" --role=roles/artifactregistry.reader --condition=None --quiet >/dev/null
gcloud run services add-iam-policy-binding elevate-admin-migration --project="$PROJECT" --region="$REGION" --member="serviceAccount:$RUNTIME" --role=roles/run.invoker --quiet >/dev/null
if [[ -z "$(gcloud run jobs list --project="$PROJECT" --region="$REGION" --filter="metadata.name=$JOB" --format='value(metadata.name)')" ]]; then
  IMAGE="$(gcloud run services describe elevate-admin-migration --project="$PROJECT" --region="$REGION" --format='value(spec.template.spec.containers[0].image)')"
  [[ "$IMAGE" =~ ^us-central1-docker.pkg.dev/elegant-racer-299721/elevate/admin@sha256:[a-f0-9]{64}$ ]]
  gcloud run jobs create "$JOB" --project="$PROJECT" --region="$REGION" --image="$IMAGE" --service-account="$RUNTIME" --command=node '--args=-e,process.exit(0)' --cpu=1 --memory=512Mi --tasks=1 --parallelism=1 --max-retries=0 --task-timeout=600s --quiet >/dev/null
fi
gcloud run jobs add-iam-policy-binding "$JOB" --project="$PROJECT" --region="$REGION" --member="serviceAccount:$SCHEDULER" --role=roles/run.invoker --quiet >/dev/null
gcloud run jobs add-iam-policy-binding "$JOB" --project="$PROJECT" --region="$REGION" --member="serviceAccount:$RUNTIME" --role=roles/run.viewer --quiet >/dev/null
printf 'Scoped Google billing identities and dormant job prepared. No scheduler, invoice, payment or job execution was created.\n'
