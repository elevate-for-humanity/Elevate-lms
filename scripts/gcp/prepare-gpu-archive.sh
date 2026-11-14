#!/usr/bin/env bash
set -Eeuo pipefail
project=elegant-racer-299721
deployer="serviceAccount:elevate-github-deploy@${project}.iam.gserviceaccount.com"
bucket="${project}-elevate-model-archive"
secret=elevate-gpu-archive-config
gcloud services enable storage.googleapis.com secretmanager.googleapis.com --project="$project"
if ! gcloud storage buckets list --project="$project" --format='value(name)' | sed 's#gs://##;s#/$##' | grep -Fxq "$bucket"; then
  gcloud storage buckets create "gs://$bucket" --project="$project" --location=us-central1 --uniform-bucket-level-access --public-access-prevention
fi
gcloud storage buckets update "gs://$bucket" --versioning --uniform-bucket-level-access --public-access-prevention
for role in roles/storage.objectCreator roles/storage.objectViewer; do
  gcloud storage buckets add-iam-policy-binding "gs://$bucket" --member="$deployer" --role="$role"
done
if ! gcloud secrets list --project="$project" --format='value(name)' | grep -Eq "(^|/)${secret}$"; then
  gcloud secrets create "$secret" --project="$project" --replication-policy=automatic
fi
for role in roles/secretmanager.viewer roles/secretmanager.secretVersionAdder roles/secretmanager.secretAccessor; do
  gcloud secrets add-iam-policy-binding "$secret" --project="$project" --member="$deployer" --role="$role" >/dev/null
done
echo 'Private model archive and scoped configuration access prepared. No GPU runtime created.'
