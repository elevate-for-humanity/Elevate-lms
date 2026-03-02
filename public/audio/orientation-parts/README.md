# Orientation Audio Parts

Split from `orientation-full.mp3` for D-ID avatar generation.
Each part is ~2 minutes (D-ID safe limit).

## Generate avatar videos (chunked)

POST to `/api/admin/generate-avatar-video`:

```json
{
  "audioUrls": [
    "https://www.elevateforhumanity.org/audio/orientation-parts/part-000.mp3",
    "https://www.elevateforhumanity.org/audio/orientation-parts/part-001.mp3",
    "https://www.elevateforhumanity.org/audio/orientation-parts/part-002.mp3",
    "https://www.elevateforhumanity.org/audio/orientation-parts/part-003.mp3",
    "https://www.elevateforhumanity.org/audio/orientation-parts/part-004.mp3",
    "https://www.elevateforhumanity.org/audio/orientation-parts/part-005.mp3"
  ]
}
```

## Stitch results

After downloading all MP4s from D-ID:

```bash
# Create concat.txt
for i in 000 001 002 003 004 005; do echo "file 'part-${i}.mp4'" >> concat.txt; done

# Concatenate (no re-encode)
ffmpeg -f concat -safe 0 -i concat.txt -c copy orientation-guide.mp4

# If concat fails due to codec mismatch, re-encode:
ffmpeg -f concat -safe 0 -i concat.txt -c:v libx264 -c:a aac -movflags +faststart orientation-guide.mp4

# Move to final location
mv orientation-guide.mp4 ../../videos/avatars/orientation-guide.mp4
```
