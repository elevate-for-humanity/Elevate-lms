#!/usr/bin/env bash
# Generate SQL INSERT statements for app_secrets from .env.local.
#
# Usage:
#   bash scripts/seed-app-secrets.sh > /tmp/seed-secrets.sql
#   # Then paste into Supabase SQL Editor
#
# Bootstrap vars (kept in Netlify env, NOT inserted into app_secrets):
#   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
#
# Build-only vars (NEXT_PUBLIC_*) are tagged scope='build'.
# Everything else is scope='runtime'.

set -euo pipefail

ENV_FILE="${1:-.env.local}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found" >&2
  exit 1
fi

# Bootstrap vars — these stay in Netlify env, skip them
BOOTSTRAP="NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY"

echo "-- Auto-generated from $ENV_FILE on $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "-- Run in Supabase SQL Editor (requires service_role)"
echo ""
echo "INSERT INTO app_secrets (key, value, scope) VALUES"

first=true
while IFS= read -r line; do
  # Skip comments and blank lines
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// /}" ]] && continue

  key="${line%%=*}"
  value="${line#*=}"

  # Skip bootstrap vars
  skip=false
  for b in $BOOTSTRAP; do
    [ "$key" = "$b" ] && skip=true
  done
  $skip && continue

  # Skip empty values
  [ -z "$value" ] && continue

  # Determine scope
  if [[ "$key" == NEXT_PUBLIC_* ]]; then
    scope="build"
  else
    scope="runtime"
  fi

  # Escape single quotes in value
  escaped_value="${value//\'/\'\'}"

  if $first; then
    first=false
  else
    echo ","
  fi
  printf "  ('%s', '%s', '%s')" "$key" "$escaped_value" "$scope"

done < "$ENV_FILE"

echo ""
echo "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, scope = EXCLUDED.scope, updated_at = now();"
