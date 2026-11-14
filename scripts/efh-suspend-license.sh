#!/usr/bin/env bash
set -euo pipefail

# EFH License Status Helper
# Run inside a client's repo to change license.status (default: suspended)
#
# Usage:
#   scripts/efh-suspend-license.sh          # sets status to "suspended"
#   scripts/efh-suspend-license.sh active   # sets status to "active"

TARGET_STATUS="${1:-suspended}"

if [[ "${TARGET_STATUS}" != "suspended" && "${TARGET_STATUS}" != "active" ]]; then
  echo "Status must be 'active' or 'suspended'."
  exit 1
fi

if [[ ! -f "config/license.json" ]]; then
  echo "config/license.json not found. Are you in a licensed client repo?"
  exit 1
fi

python3 <<PY
import json, sys, pathlib
path = pathlib.Path("config/license.json")
data = json.loads(path.read_text(encoding="utf-8"))
data["status"] = sys.argv[1]
path.write_text(json.dumps(data, indent=2), encoding="utf-8")
print("Updated license.status to:", data["status"])
PY "${TARGET_STATUS}"

echo
echo "✓ License status set to '${TARGET_STATUS}' in config/license.json."
echo "Next steps:"
echo "  - git add config/license.json"
echo "  - git commit -m \"Set license status to ${TARGET_STATUS}\""
echo "  - git push"
