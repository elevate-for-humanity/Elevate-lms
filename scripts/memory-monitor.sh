#!/usr/bin/env bash
# Read-only process/container diagnostics; never equate disk usage with heap.
set -euo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec node "$script_dir/memory-manager.mjs" --monitor
