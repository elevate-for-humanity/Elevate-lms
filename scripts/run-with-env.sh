#!/usr/bin/env bash
# Loads env chunks and runs the given command with all vars exported.
# Usage: bash scripts/run-with-env.sh pnpm tsx scripts/verify-bnpl-stripe.ts
set -euo pipefail
cd "$(dirname "$0")/.."

# Source chunks — set -a exports every assignment automatically
set -a
[ -f .env_local_1.txt ] && . ./.env_local_1.txt || true
[ -f .env_local_2.txt ] && . ./.env_local_2.txt || true
[ -f .env_local_3.txt ] && . ./.env_local_3.txt || true
set +a

exec "$@"
