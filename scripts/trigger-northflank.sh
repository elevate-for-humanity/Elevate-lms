#!/usr/bin/env bash
set -Eeuo pipefail
# Compatibility command; use a component name, never a retired provider webhook.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/gcp/dispatch-release.mjs" "$@"
