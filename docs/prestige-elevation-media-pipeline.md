# Prestige Elevation — Media Pipeline (Barber RTI)

**Product:** Prestige Elevation™ Barber Curriculum  
**Org:** Elevate for Humanity  
**Live course ID:** `3fb5ce19-1cde-434c-a8c6-f138d7d7aa17`  
**Program slug:** `barber-apprenticeship`

This doc explains how to generate **lesson videos** and **images** without Milady. The LMS course is **not read-only** — generated files go to `public/` and/or Supabase `course-videos`, then `course_lessons.video_url` is updated.

---

## What you need in Dev Studio → Container (or `.env.local`)

| Secret | Used for |
|--------|----------|
| `OPENAI_API_KEY` | TTS, GPT scripts, DALL-E lesson art, slide scripts |
| `RUNWAY_API_KEY` | Runway Gen4.5 clips (`api.dev.runwayml.com` — Runway **dev** API) |
| `NEXT_PUBLIC_SUPABASE_URL` | Must be `https://cuxzzpsyufcewtmicszk.supabase.co` (not a JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | Upload to `course-videos` / update lessons |
| `DID_API_KEY` | Optional: talking-head fallback (`fix-barber-missing-videos.ts`) |

**ffmpeg** must be installed on the machine running scripts (present on Cloud Agent VM).

Do **not** swap URL and service role key in `.env.local`.

---

## Three video tiers (pick one for v1)

### Tier 1 — B-roll + narration (fastest, good for bulk)

Uses existing `public/videos/broll/*.mp4` + OpenAI TTS. No Runway credits.

```bash
export HOME=/home/ubuntu
export NEXT_PUBLIC_SUPABASE_URL=https://cuxzzpsyufcewtmicszk.supabase.co
# OPENAI_API_KEY + SUPABASE_SERVICE_ROLE_KEY from Container secrets

pnpm tsx scripts/generate-barber-lesson-videos.ts --slug barber-lesson-1
pnpm tsx scripts/generate-barber-lesson-videos.ts          # all missing
pnpm tsx scripts/generate-barber-lesson-videos.ts --module 1 --chapter  # module reel
```

Output: `public/videos/barber-lessons/{slug}.mp4`

### Tier 2 — Prestige slide videos (canvas + DALL-E + instructor)

Branded slide format (`elevate-slide` / orange bar). Matches blueprint `videoConfig`.

```bash
pnpm tsx scripts/generate-barber-videos.ts --dry-run
pnpm tsx scripts/generate-barber-videos.ts --only barber-lesson-1,barber-lesson-2
pnpm tsx scripts/generate-barber-videos.ts --force
```

Output: `public/videos/barber-lessons/*.mp4` + DB `video_url` update.

### Tier 3 — Runway Gen4.5 (highest production cost)

One lesson at a time; ~5×10s clips + stitch + TTS per lesson.

```bash
pnpm tsx scripts/generate-lesson-video-runway.ts \
  --slug barber-lesson-1 \
  --title "Introduction to Barbering" \
  --module "Infection Control & Safety" \
  --out public/videos/barber-lessons/barber-lesson-1.mp4
```

Canonical client: `lib/video/runway.ts` (do not call Runway from app routes directly).

---

## Images

| Asset | Source |
|-------|--------|
| Instructor headshot | `public/images/team/instructors/instructor-barber.jpg` |
| Program hero | `data/programs/barber-apprenticeship.ts` → `/images/pages/barber-hero-main.jpg` |
| Per-lesson DALL-E | `videoConfig.generateDalleImage: true` in barber blueprint (used by slide/blueprint generators) |
| Upload to CDN | `pnpm tsx scripts/upload-videos-to-supabase.ts` (after local MP4s exist) |

---

## Recommended batch order (Prestige v1)

1. Seed curriculum (if needed):  
   `pnpm tsx scripts/seed-course-from-blueprint.ts --blueprint barber-apprenticeship-v1 --program barber-apprenticeship --mode missing-only`
2. Generate videos — **Tier 2** for consistent Prestige look, or **Tier 1** to fill all 50 quickly.
3. Audit: `pnpm tsx scripts/audit-barber-course.ts`
4. Upload to Supabase storage for production ECS (if not serving from `public/`):  
   `pnpm tsx scripts/upload-videos-to-supabase.ts`
5. Bind URLs: `pnpm tsx scripts/bind-barber-videos.ts` (if used in your deploy flow)

---

## Orchestrator (all-in-one entry)

```bash
pnpm tsx scripts/prestige-elevation-generate-barber-media.ts --dry-run
pnpm tsx scripts/prestige-elevation-generate-barber-media.ts --tier slide
pnpm tsx scripts/prestige-elevation-generate-barber-media.ts --tier broll --slug barber-lesson-1
```

---

## What this VM cannot do for you

- Runway/OpenAI generation **without** keys in Container secrets  
- Replace **shop OJT** or state board exam scheduling  
- Guarantee Indiana board acceptance — document alignment separately

---

## Branding on generated media

Set in `scripts/prestige-elevation-generate-barber-media.ts`:

- **Course line:** Prestige Elevation™ Barber Curriculum  
- **Instructor:** from blueprint (`Brandon Williams` in blueprint; slide script may use configured name/title)

Update program/orientation copy to match — see product checklist in AGENTS.md Cursor Cloud section.
