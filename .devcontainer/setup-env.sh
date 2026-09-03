#!/usr/bin/env bash
# .devcontainer/setup-env.sh
#
# Creates a local .env.local from .env.example when one is not present.
# Production and preview secrets are managed in Northflank/runtime secret groups.

cd "$(dirname "$0")/.."

ENV_FILE=".env.local"

echo "Setting up environment..."

if [ -f "$ENV_FILE" ]; then
  echo "  $ENV_FILE already exists — leaving it unchanged"
elif [ -f .env.example ]; then
  cp .env.example "$ENV_FILE"
  echo "  Copied .env.example to $ENV_FILE"
  echo "  Fill local-only values in $ENV_FILE or use Northflank secret groups for deployed services."
else
  echo "  No .env.example found — create $ENV_FILE manually"
  exit 1
fi

if [ ! -f apps/admin/.env.local ] && [ ! -L apps/admin/.env.local ]; then
  ln -s "$(pwd)/.env.local" apps/admin/.env.local
  echo "  Symlinked .env.local -> apps/admin/.env.local"
fi

echo ""
echo "  pnpm dev          -> http://localhost:3000  (LMS)"
echo "  pnpm dev:admin    -> http://localhost:3001  (Admin)"
