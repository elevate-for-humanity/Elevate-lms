#!/usr/bin/env bash
# A live Admin revision is approved only when it contains the last Admin
# runtime change and belongs to the workflow's trusted Git history.
set -euo pipefail

required_sha="${1:-}"
live_sha="${2:-}"
workflow_sha="${3:-}"

for sha in "$required_sha" "$live_sha" "$workflow_sha"; do
  [[ "$sha" =~ ^[0-9a-fA-F]{40}$ ]] || exit 1
  git cat-file -e "${sha}^{commit}" 2>/dev/null || exit 1
done

git merge-base --is-ancestor "$required_sha" "$live_sha" && \
  git merge-base --is-ancestor "$live_sha" "$workflow_sha"
