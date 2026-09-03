#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SENTRY_AUTH_TOKEN:-}" || -z "${SENTRY_ORG:-}" || -z "${SENTRY_PROJECT:-}" ]]; then
  echo "[sentry-release] missing vars; skipping" >&2
  exit 0
fi

RELEASE="${GITHUB_SHA:-$(git rev-parse --short HEAD)}"
ENVIRONMENT="${SENTRY_ENVIRONMENT:-${GITHUB_REF_NAME:-local}}"

echo "[sentry-release] create release $RELEASE env=$ENVIRONMENT";
curl -sS https://sentry.io/api/0/organizations/${SENTRY_ORG}/releases/ \
  -H "Authorization: Bearer ${SENTRY_AUTH_TOKEN}" -H 'Content-Type: application/json' \
  -d "{\"version\": \"${RELEASE}\"}" >/dev/null || true
curl -sS https://sentry.io/api/0/organizations/${SENTRY_ORG}/releases/${RELEASE}/deploys/ \
  -H "Authorization: Bearer ${SENTRY_AUTH_TOKEN}" -H 'Content-Type: application/json' \
  -d "{\"environment\": \"${ENVIRONMENT}\"}" >/dev/null || true
echo "[sentry-release] done"