#!/usr/bin/env bash
# Assembles the program holder orientation video from TTS audio + b-roll scenes.
# Requires: ffmpeg
# Run after generate-program-holder-audio.ts has produced all 9 MP3s.
#
# Usage: bash scripts/assemble-program-holder-video.sh
# Output: public/videos/program-holder-orientation.mp4

set -euo pipefail

SCENES_DIR="public/videos/program-holder-scenes"
BROLL_DIR="public/videos/orientation-scenes"
OUT="public/videos/program-holder-orientation.mp4"
CONCAT="$SCENES_DIR/concat.txt"

# Check ffmpeg
if ! command -v ffmpeg &>/dev/null; then
  echo "ffmpeg not found — install it first"
  exit 1
fi

# Check all 9 audio files exist
for i in $(seq -w 1 9); do
  f="$SCENES_DIR/scene-0${i}.mp3"
  # handle single digit padding
  f2="$SCENES_DIR/scene-$(printf '%02d' $i).mp3"
  if [ ! -f "$f2" ]; then
    echo "Missing: $f2 — run generate-program-holder-audio.ts first"
    exit 1
  fi
done

echo "Building scene videos..."
mkdir -p "$SCENES_DIR"

# B-roll pool — cycle through available orientation scenes
BROLL_FILES=("$BROLL_DIR"/scene-*.mp4)
BROLL_COUNT=${#BROLL_FILES[@]}

for i in $(seq 1 9); do
  SCENE_ID=$(printf 'scene-%02d' $i)
  AUDIO="$SCENES_DIR/${SCENE_ID}.mp3"
  # Pick b-roll by cycling through available scenes
  BROLL_IDX=$(( (i - 1) % BROLL_COUNT ))
  BROLL="${BROLL_FILES[$BROLL_IDX]}"
  OUT_SCENE="$SCENES_DIR/${SCENE_ID}.mp4"

  if [ -f "$OUT_SCENE" ]; then
    echo "  skip $SCENE_ID.mp4 (exists)"
    continue
  fi

  echo "  building $SCENE_ID.mp4 ..."

  # Get audio duration
  DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUDIO")

  # Loop b-roll to match audio duration, then mux with TTS audio
  ffmpeg -y -loglevel error \
    -stream_loop -1 -i "$BROLL" \
    -i "$AUDIO" \
    -map 0:v -map 1:a \
    -t "$DURATION" \
    -c:v libx264 -preset fast -crf 23 \
    -c:a aac -b:a 128k \
    -af "loudnorm=I=-14:TP=-1.5:LRA=11" \
    -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
    -r 30 \
    "$OUT_SCENE"
done

echo "Concatenating scenes..."
> "$CONCAT"
for i in $(seq 1 9); do
  SCENE_ID=$(printf 'scene-%02d' $i)
  echo "file '$(pwd)/$SCENES_DIR/${SCENE_ID}.mp4'" >> "$CONCAT"
done

ffmpeg -y -loglevel error \
  -f concat -safe 0 -i "$CONCAT" \
  -c:v libx264 -preset fast -crf 22 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  "$OUT"

SIZE=$(du -sh "$OUT" | cut -f1)
echo "Done: $OUT ($SIZE)"
