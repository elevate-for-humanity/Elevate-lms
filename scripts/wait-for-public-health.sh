#!/usr/bin/env bash

set -Eeuo pipefail

HEALTH_URL="${1:?Health URL is required}"
EXPECTED_SHA="${2:-}"

MAX_ATTEMPTS="${MAX_ATTEMPTS:-40}"
SLEEP_SECONDS="${SLEEP_SECONDS:-10}"

echo "Waiting for service health:"
echo "$HEALTH_URL"

for ATTEMPT in $(seq 1 "$MAX_ATTEMPTS"); do
  echo "Health attempt $ATTEMPT of $MAX_ATTEMPTS"

  HTTP_STATUS="$(
    curl \
      --silent \
      --show-error \
      --location \
      --max-time 15 \
      --output /tmp/public-health.json \
      --write-out "%{http_code}" \
      "$HEALTH_URL" \
      || true
  )"

  if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "Service returned HTTP 200."

    cat /tmp/public-health.json
    echo

    if [[ -n "$EXPECTED_SHA" ]]; then
      if grep -qi "$EXPECTED_SHA" /tmp/public-health.json; then
        echo "Expected SHA verified."
        exit 0
      fi

      SHORT_SHA="${EXPECTED_SHA:0:12}"

      if grep -qi "$SHORT_SHA" /tmp/public-health.json; then
        echo "Expected short SHA verified."
        exit 0
      fi

      echo "Service is healthy, but expected SHA is not visible yet."
    else
      exit 0
    fi
  else
    echo "Current HTTP status: $HTTP_STATUS"
  fi

  sleep "$SLEEP_SECONDS"
done

echo "::error::Service failed deployment verification."
echo "URL: $HEALTH_URL"
echo "Expected SHA: $EXPECTED_SHA"

cat /tmp/public-health.json || true

exit 1
