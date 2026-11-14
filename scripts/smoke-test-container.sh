#!/usr/bin/env bash

set -Eeuo pipefail

IMAGE="${1:?Image name is required}"
CONTAINER_NAME="${2:?Container name is required}"
HOST_PORT="${3:?Host port is required}"

HEALTH_PATH="${HEALTH_PATH:-/api/health}"
VERSION_PATH="${VERSION_PATH:-/api/version}"
CONTAINER_PORT="${CONTAINER_PORT:-3000}"
STARTUP_TIMEOUT_SECONDS="${STARTUP_TIMEOUT_SECONDS:-180}"

LOG_FILE="/tmp/${CONTAINER_NAME}.log"

cleanup() {
  echo "Cleaning up smoke-test container..."

  docker logs "$CONTAINER_NAME" \
    > "$LOG_FILE" \
    2>&1 || true

  docker rm -f "$CONTAINER_NAME" \
    >/dev/null 2>&1 || true
}

trap cleanup EXIT

docker rm -f "$CONTAINER_NAME" \
  >/dev/null 2>&1 || true

echo "Starting smoke-test container: $CONTAINER_NAME"

RUNTIME_ENV_ARGS=()
for NAME in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY; do
  if [[ -n "${!NAME:-}" ]]; then
    RUNTIME_ENV_ARGS+=(--env "${NAME}=${!NAME}")
  fi
done

docker run \
  --detach \
  --name "$CONTAINER_NAME" \
  --publish "127.0.0.1:${HOST_PORT}:${CONTAINER_PORT}" \
  --env NODE_ENV=production \
  --env PORT="$CONTAINER_PORT" \
  --env HOSTNAME=0.0.0.0 \
  --env DATABASE_URL="${SMOKE_DATABASE_URL:-postgresql://invalid:invalid@127.0.0.1:5432/invalid}" \
  --env NEXT_PUBLIC_SITE_URL="http://127.0.0.1:${HOST_PORT}" \
  "${RUNTIME_ENV_ARGS[@]}" \
  "$IMAGE"

START_TIME="$(date +%s)"

while true; do
  CURRENT_TIME="$(date +%s)"
  ELAPSED="$((CURRENT_TIME - START_TIME))"

  CONTAINER_STATUS="$(
    docker inspect \
      --format='{{.State.Status}}' \
      "$CONTAINER_NAME" \
      2>/dev/null || echo "missing"
  )"

  EXIT_CODE="$(
    docker inspect \
      --format='{{.State.ExitCode}}' \
      "$CONTAINER_NAME" \
      2>/dev/null || echo "unknown"
  )"

  echo "Container status: $CONTAINER_STATUS"
  echo "Elapsed: ${ELAPSED}s"

  if [[ "$CONTAINER_STATUS" == "exited" ]] ||
     [[ "$CONTAINER_STATUS" == "dead" ]] ||
     [[ "$CONTAINER_STATUS" == "missing" ]]; then
    echo "::error::Container exited before becoming healthy."
    echo "Exit code: $EXIT_CODE"

    docker logs "$CONTAINER_NAME" || true

    exit 1
  fi

  if curl \
    --fail \
    --silent \
    --show-error \
    --max-time 10 \
    "http://127.0.0.1:${HOST_PORT}${HEALTH_PATH}" \
    > /tmp/health-response.json
  then
    echo "Health endpoint passed."

    cat /tmp/health-response.json
    echo

    break
  fi

  if [[ "$ELAPSED" -ge "$STARTUP_TIMEOUT_SECONDS" ]]; then
    echo "::error::Container did not become healthy within ${STARTUP_TIMEOUT_SECONDS} seconds."

    docker logs "$CONTAINER_NAME" || true

    exit 1
  fi

  sleep 5
done

echo "Checking version endpoint..."

if curl \
  --fail \
  --silent \
  --show-error \
  --max-time 10 \
  "http://127.0.0.1:${HOST_PORT}${VERSION_PATH}" \
  > /tmp/version-response.json
then
  cat /tmp/version-response.json
  echo
else
  echo "::warning::Version endpoint did not return HTTP 200."
fi

echo "Confirming container remains alive..."

sleep 15

FINAL_STATUS="$(
  docker inspect \
    --format='{{.State.Status}}' \
    "$CONTAINER_NAME"
)"

FINAL_EXIT_CODE="$(
  docker inspect \
    --format='{{.State.ExitCode}}' \
    "$CONTAINER_NAME"
)"

if [[ "$FINAL_STATUS" != "running" ]]; then
  echo "::error::Container stopped after initially passing its health check."
  echo "Status: $FINAL_STATUS"
  echo "Exit code: $FINAL_EXIT_CODE"

  docker logs "$CONTAINER_NAME" || true

  exit 1
fi

echo "Smoke test passed for $IMAGE."
