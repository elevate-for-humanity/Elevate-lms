# Prestige Elevation™ — Media Pipeline

## Pexels API key (free stock video + photos)

1. Open **[https://www.pexels.com/api/](https://www.pexels.com/api/)**
2. Click **Get Started** / sign up (no credit card).
3. Copy your API key from the dashboard.
4. Add to secrets as **`PEXELS_API_KEY`**:
   - **Cursor Cloud / agent:** Environment setup → Add secret → `PEXELS_API_KEY`
   - **Dev Studio → Container:** paste `PEXELS_API_KEY=...`
   - **Supabase `platform_secrets`:** key `PEXELS_API_KEY` (loaded via `hydrateProcessEnv()`)
   - **Local:** `.env.local` → `PEXELS_API_KEY=your_key`

Free tier: ~200 requests/hour. Clips are free to use with [Pexels license](https://www.pexels.com/license/) (attribution appreciated).

## Generate barber lesson videos (slides + Pexels b-roll)

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://cuxzzpsyufcewtmicszk.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...
# OPENAI_API_KEY, GROQ_API_KEY, PEXELS_API_KEY from platform_secrets or env

pnpm tsx scripts/generate-barber-videos.ts --only barber-lesson-3
pnpm tsx scripts/generate-barber-videos.ts          # all missing MP4s
pnpm tsx scripts/generate-barber-videos.ts --no-pexels  # slides only
```

- **intro / concept / wrapup:** full-width Prestige slides  
- **visual / application:** slide (left) + **Pexels** loop (right) when `PEXELS_API_KEY` is set  

Output: `public/videos/barber-lessons/{slug}.mp4` → updates `course_lessons.video_url`.

## Scan blueprint for Pexels matches (no encode)

```bash
pnpm tsx scripts/scan-pexels-barber-videos.ts --blueprint barber-apprenticeship-v1
```

## Other secrets

| Secret | Purpose |
|--------|---------|
| `OPENAI_API_KEY` | TTS (onyx) + optional GPT scripts |
| `GROQ_API_KEY` | Script planning when OpenAI billing blocked |
| `RUNWAY_API_KEY` | Cinematic Gen4.5 (`generate-lesson-video-runway.ts`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Upload + lesson row updates |

Course ID: `3fb5ce19-1cde-434c-a8c6-f138d7d7aa17`
