#!/usr/bin/env bash
# Run in Google Cloud Shell as the project administrator.
set -euo pipefail
PROJECT_ID=elegant-racer-299721
POOL=elevate-github
PROVIDER=github-main
SA=elevate-github-deploy
SA_EMAIL="$SA@$PROJECT_ID.iam.gserviceaccount.com"
gcloud projects describe "$PROJECT_ID" --format='value(projectId)' >/dev/null
test "$(gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)')" = True
gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com run.googleapis.com artifactregistry.googleapis.com --project="$PROJECT_ID"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA" --display-name="Elevate GitHub deployment" --project="$PROJECT_ID"
fi
if ! gcloud iam workload-identity-pools describe "$POOL" --location=global --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$POOL" --location=global --project="$PROJECT_ID" --display-name="Elevate GitHub"
fi
SCHEDULED_COURSE_WORKFLOW="elevate-for-humanity/Elevate-lms/.github/workflows/dispatch-google-course-job.yml@refs/heads/main"
MARKETING_PUSH_WORKFLOW="elevate-for-humanity/Elevate-lms/.github/workflows/deploy-google-marketing-trigger.yml@refs/heads/main"
ADMIN_PUSH_WORKFLOW="elevate-for-humanity/Elevate-lms/.github/workflows/deploy-admin.yml@refs/heads/main"
COURSE_WORKER_PUSH_WORKFLOW="elevate-for-humanity/Elevate-lms/.github/workflows/deploy-google-course-worker.yml@refs/heads/main"
CONDITION="assertion.repository_id == '1096408995' && assertion.repository_owner_id == '286334428' && assertion.ref == 'refs/heads/main' && (assertion.event_name == 'workflow_dispatch' || (assertion.event_name == 'schedule' && assertion.workflow_ref == '$SCHEDULED_COURSE_WORKFLOW') || (assertion.event_name == 'push' && (assertion.workflow_ref == '$MARKETING_PUSH_WORKFLOW' || assertion.workflow_ref == '$ADMIN_PUSH_WORKFLOW' || assertion.workflow_ref == '$COURSE_WORKER_PUSH_WORKFLOW')))"
MAPPING="google.subject=assertion.sub,attribute.repository_id=assertion.repository_id"
if gcloud iam workload-identity-pools providers describe "$PROVIDER" --workload-identity-pool="$POOL" --location=global --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers update-oidc "$PROVIDER" --workload-identity-pool="$POOL" --location=global --project="$PROJECT_ID" --issuer-uri=https://token.actions.githubusercontent.com --attribute-mapping="$MAPPING" --attribute-condition="$CONDITION"
else
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" --workload-identity-pool="$POOL" --location=global --project="$PROJECT_ID" --issuer-uri=https://token.actions.githubusercontent.com --attribute-mapping="$MAPPING" --attribute-condition="$CONDITION"
fi
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" --project="$PROJECT_ID" --role=roles/iam.workloadIdentityUser --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/attribute.repository_id/1096408995" --condition=None >/dev/null
# Deployment identity can manage Cloud Run and container images, but cannot
# change project IAM, billing, or make a service public.
for ROLE in roles/run.developer roles/artifactregistry.admin roles/serviceusage.serviceUsageConsumer roles/logging.viewer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA_EMAIL" --role="$ROLE" --condition=None >/dev/null
done
for APP in marketing admin lms; do
  RUNTIME="elevate-$APP-runtime@$PROJECT_ID.iam.gserviceaccount.com"
  if ! gcloud iam service-accounts describe "$RUNTIME" --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud iam service-accounts create "elevate-$APP-runtime" --project="$PROJECT_ID"
  fi
  gcloud iam service-accounts add-iam-policy-binding "$RUNTIME" --project="$PROJECT_ID" --member="serviceAccount:$SA_EMAIL" --role=roles/iam.serviceAccountUser --condition=None >/dev/null
done
printf '\nGoogle authorization prepared. No application deployed.\n'
printf 'Provider: projects/%s/locations/global/workloadIdentityPools/%s/providers/%s\n' "$PROJECT_NUMBER" "$POOL" "$PROVIDER"
printf 'Service account: %s\n' "$SA_EMAIL"
