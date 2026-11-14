#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAGES="$ROOT/public/images/pages"
MIGRATION="$ROOT/supabase/migrations/20260623000001_publish_all_active_programs.sql"
command -v ffmpeg >/dev/null || { echo "ffmpeg required"; exit 1; }
grep -oE "'/images/pages/[^']+\.jpg'" "$MIGRATION" | tr -d "'" | sort -u | while read -r path; do
  base="$(basename "$path" .jpg)"
  jpg="$PAGES/${base}.jpg"
  webp="$PAGES/${base}.webp"
  [[ -f "$jpg" ]] && continue
  [[ -f "$webp" ]] || { echo "skip (no webp): $base" >&2; continue; }
  ffmpeg -y -loglevel error -i "$webp" -q:v 3 "$jpg"
  echo "created $jpg"
done
