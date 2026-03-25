#!/bin/bash
# Start Next.js dev server with .env.local loaded
set -a
# shellcheck disable=SC1091
source /workspaces/Elevate-lms/.env.local
set +a
exec pnpm next dev --turbopack
