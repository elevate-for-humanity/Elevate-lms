#!/usr/bin/env bash
set -euo pipefail

# Trigger Netlify deploy via build hook (no PAT required)
# Set NETLIFY_BUILD_HOOK_URL as an environment variable or in .env.local
HOOK_URL="${NETLIFY_BUILD_HOOK_URL:?Set NETLIFY_BUILD_HOOK_URL env var (Netlify > Site > Build hooks)}"

echo "Triggering Netlify deploy..."
curl -s -X POST "$HOOK_URL" -o /dev/null -w "HTTP %{http_code}\n"
echo "Deploy triggered. Check https://app.netlify.com for status."
