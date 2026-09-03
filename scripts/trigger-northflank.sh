#!/usr/bin/env bash

set -Eeuo pipefail

WEBHOOK_URL="${1:?Northflank webhook URL is required}"
IMAGE_TAG="${2:?Image tag is required}"

if [[ -z "$WEBHOOK_URL" ]]; then
  echo "::error::Northflank webhook URL is empty."
  exit 1
fi

if [[ -z "$IMAGE_TAG" ]]; then
  echo "::error::Image tag is empty."
  exit 1
fi

echo "Triggering Northflank deployment."
echo "Image: $IMAGE_TAG"

HTTP_STATUS="$(
  curl \
    --silent \
    --show-error \
    --output /tmp/northflank-response.json \
    --write-out "%{http_code}" \
    --request POST \
    --header "Content-Type: application/json" \
    --data "{
      \"image\": \"$IMAGE_TAG\",
      \"imageTag\": \"$IMAGE_TAG\",
      \"deploymentImage\": \"$IMAGE_TAG\"
    }" \
    "$WEBHOOK_URL"
)"

cat /tmp/northflank-response.json || true
echo

if [[ "$HTTP_STATUS" -lt 200 ]] ||
   [[ "$HTTP_STATUS" -ge 300 ]]; then
  echo "::error::Northflank rejected the deployment webhook."
  echo "HTTP status: $HTTP_STATUS"

  exit 1
fi

echo "Northflank accepted the deployment request."
