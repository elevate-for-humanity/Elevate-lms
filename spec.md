# HVAC Lesson 1 — V16 Build + Playback Fix

## Problem Statement

Two issues prevent HVAC lessons from playing:

1. **Wrong codec**: All existing videos use H.264 High profile — not supported on iOS Safari or Android Chrome. Mobile requires Baseline/Main profile.
2. **`dbVideoUrl` ignored**: `HvacLessonVideo` accepts `dbVideoUrl` prop but never uses it. DB video URLs are bypassed entirely. Component falls back to `trades-guide.mp4` (also wrong codec) + MP3 audio.

## Fix 1 — HvacLessonVideo: use dbVideoUrl

Update `components/lms/HvacLessonVideo.tsx`:
- Add `dbVideoUrl?: string` to Props interface (already passed from lesson page)
- In the useEffect priority chain, check `dbVideoUrl` FIRST before local paths
- If `dbVideoUrl` is set and reachable (HEAD 200), use it as `mp4` mode
- Fall through to existing local path checks if dbVideoUrl is absent/fails

## Fix 2 — Assemble lesson 1 V16 with correct encoding

Build `scripts/assemble-hvac-v16.mjs`:

### Layout (matches V16b reference)
- Canvas: 1280x720, background #0A1628
- Brandon PiP left: crop center 500px from HeyGen clip → scale 350x504, position x=30 y=130, white 2px border
- Name tag: "Brandon — HVAC Instructor", white 16px, y=644
- Diagram right: scale 820x580, position x=430 y=80, slate border
- Title bar: top 65px, black@0.85, lesson title centered white 22px bold, "Lesson N" left green #00FF88 16px
- Fade-in labels: up to 5 key terms from hvac-lesson-content.ts, green #00FF88 24px bold, black pill 260x44px, two columns x=450/x=730, y starting 110, 80px spacing, evenly timed, 0.5s fade-in
- Arrows: green line from x=385 to each pill left edge
- Branding: "ELEVATE FOR HUMANITY" green #00FF88 14px, x=1080 y=700
- Audio: lesson MP3 (Marcus voice), Brandon clip muted

### Encoding (mobile-safe)
- `-profile:v baseline -level 3.1` — plays on all mobile browsers
- `-pix_fmt yuv420p`
- `-crf 22 -preset medium`
- `-c:a aac -b:a 128k -ar 44100`
- `-movflags +faststart` — starts playing before fully downloaded

### CLI
- `node scripts/assemble-hvac-v16.mjs --lesson 1` — build lesson 1 only
- `node scripts/assemble-hvac-v16.mjs --all` — batch all 95 (after approval)

### Output
- Local: `temp/assembled/hvac-lesson-001-v16.mp4`
- Upload to Supabase: `media/hvac/hvac-lesson-001-v16.mp4`
- Update DB `training_lessons.video_url` for lesson 1

## Acceptance Criteria

- [ ] Lesson 1 video renders without FFmpeg errors
- [ ] H.264 Baseline profile confirmed via ffprobe
- [ ] faststart confirmed (moov before mdat)
- [ ] Brandon PiP visible left, diagram right, not blocked
- [ ] Title bar with lesson title
- [ ] 3–5 key term labels fade in on diagram side
- [ ] Green arrows from Brandon edge to labels
- [ ] Name tag + ELEVATE branding visible
- [ ] Audio is Marcus MP3
- [ ] `HvacLessonVideo` uses `dbVideoUrl` when present
- [ ] Video plays on mobile Chrome (test via Supabase public URL)
- [ ] Under 30MB

## Implementation Steps

1. Update `HvacLessonVideo.tsx` — add `dbVideoUrl` to props, check it first in priority chain
2. Write `scripts/assemble-hvac-v16.mjs` with V16 FFmpeg filter_complex
3. Run `--lesson 1`, verify output locally
4. Upload to Supabase, update DB video_url for lesson 1
5. Confirm playback on mobile via Supabase URL
6. Batch all 95 after approval
