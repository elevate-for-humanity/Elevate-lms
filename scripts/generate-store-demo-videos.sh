#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if [[ $# -ne 1 ]]; then
  printf 'Provide the directory containing verified slug-plan.jpg workspace captures.\n' >&2
  exit 2
fi
exec node scripts/run-bounded-build.mjs -- node --import tsx scripts/render-store-commercials.ts "$1"
