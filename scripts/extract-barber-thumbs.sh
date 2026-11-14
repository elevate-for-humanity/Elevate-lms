#!/usr/bin/env bash
set -euo pipefail

ROOT="/workspaces/Elevate-lms"
OUT="$ROOT/public/videos/barber-lessons/thumbs"
mkdir -p "$OUT"

for FILE in \
  "$ROOT/public/videos/barber-lessons/barber-lesson-1.mp4" \
  "$ROOT/public/videos/barber-lessons/barber-lesson-15.mp4"
do
  NAME=$(basename "$FILE" .mp4)
  mkdir -p "$OUT/$NAME"

  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$FILE")
  STEP=5

  t=0
  while (( $(echo "$t < $DUR" | bc -l) )); do
    TS=$(printf "%05.1f" "$t")
    ffmpeg -y -ss "$t" -i "$FILE" -vframes 1 "$OUT/$NAME/frame-$TS.jpg" >/dev/null 2>&1 || true
    t=$(echo "$t + $STEP" | bc)
  done
done

echo "Done. Thumbnails in $OUT"
