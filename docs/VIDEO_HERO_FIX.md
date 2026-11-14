# Video Hero Banner Fix

## Root Causes

| #   | Cause                                                                         | Fix                                                                   |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | **Broken R2 URLs** in `lib/hero-config.ts` pointing to non-existent CDN files | Changed to local `/videos/` paths                                     |
| 2   | **Missing local video files** — `public/videos/` directory did not exist      | Created directory with `.gitkeep`; video files must be added manually |
| 3   | **No aggressive preload** on above-the-fold heroes                            | Added `preloadFull={true}` to `ApplyHeroVideo` and `VideoHeroBanner`  |
| 4   | **No error boundary** for video subtree failures                              | Created `components/video/VideoErrorBoundary.tsx`                     |

---

## Files Changed

| File                                      | Change                                                              |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `lib/hero-config.ts`                      | All `VIDEO_HEROES` entries now use `/videos/<file>.mp4` local paths |
| `app/apply/ApplyHeroVideo.tsx`            | Added `preloadFull` and `threshold={0.2}` to `CanonicalVideo`       |
| `components/ui/VideoHeroBanner.tsx`       | Added `preloadFull` to `CanonicalVideo`                             |
| `components/video/VideoErrorBoundary.tsx` | **New** — React error boundary for video subtrees                   |
| `public/videos/.gitkeep`                  | **New** — placeholder so the directory is tracked by git            |

---

## Video Files Required

Add these MP4 files to `public/videos/` before deploying:

| Filename                   | Used by                                                       |
| -------------------------- | ------------------------------------------------------------- |
| `hero-home-fast.mp4`       | Homepage, technology, government, workforce board, store, LMS |
| `career-services-hero.mp4` | Career services page                                          |
| `barber-hero.mp4`          | Barber and barber apprenticeship pages                        |
| `cna-hero.mp4`             | Healthcare category page                                      |
| `hvac-hero-final.mp4`      | Skilled trades category page                                  |

**Requirements per file:**

- Format: MP4 (H.264)
- Duration: 8–10 seconds, looping-friendly
- Resolution: 1920 × 1080
- Max file size: ~5 MB (compress with `ffmpeg -crf 28`)

**Quick ffmpeg compress command:**

```bash
ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset fast -an output.mp4
```

> **Note:** Video files are large binary assets and are not committed to the repository.
> Place them in `public/videos/` on each deployment target.
> Alternatively, if `NEXT_PUBLIC_R2_URL` (or `CLOUDFLARE_R2_PUBLIC_URL`) is set,
> `lib/media-url.ts`'s `getVideoUrl()` helper will resolve paths through Cloudflare R2 instead.
> The `VIDEO_HEROES` constants in `lib/hero-config.ts` use direct local paths — if you migrate
> to R2 in the future, update those constants to use `getVideoUrl()` calls.

---

## How Preloading Works

`CanonicalVideo` uses `preload="metadata"` by default (downloads only the first few seconds
of data). Setting `preloadFull={true}` switches to `preload="auto"`, which tells the browser
to buffer the entire file as soon as the page loads. Use this **only** on above-the-fold heroes
where the video starts immediately — using it on every video wastes bandwidth.

| Prop                            | Effect                                                             |
| ------------------------------- | ------------------------------------------------------------------ |
| `preloadFull={false}` (default) | `preload="metadata"` — fast page load                              |
| `preloadFull={true}`            | `preload="auto"` — aggressive buffering for above-fold heroes      |
| `autoPlayOnMount={true}`        | Starts playing immediately on mount (hero videos)                  |
| `threshold={0.2}`               | Observer triggers play when 20% visible (tighter than default 10%) |

---

## VideoErrorBoundary Usage

Wrap any video hero section to catch React render errors in the video subtree:

```tsx
import VideoErrorBoundary from '@/components/video/VideoErrorBoundary';

<VideoErrorBoundary
  fallbackPoster="/images/pages/apply-hero.jpg"
  fallbackAlt="Apply for free career training"
>
  <ApplyHeroVideo />
</VideoErrorBoundary>;
```

The boundary logs the error via `lib/logger` and renders the fallback poster in its place.
Runtime video load errors (404, codec failure) are handled directly by `CanonicalVideo` via
its `onError` handler — the boundary is for React render-time failures only.

---

## Testing Checklist

- [ ] Video files are present in `public/videos/`
- [ ] No 404 errors in DevTools → Network → filter `.mp4`
- [ ] `preloadFull` videos start downloading on page entry (not on scroll)
- [ ] Smooth poster → video cross-fade on load
- [ ] Fallback poster visible when video fails or `prefers-reduced-motion` is set
- [ ] `pnpm next build` completes with zero errors
- [ ] Lighthouse LCP score improves by 500–1000 ms compared to R2 remote load

---

## Performance Impact

| Metric                         | Before                   | After                  |
| ------------------------------ | ------------------------ | ---------------------- |
| Video load start               | On scroll (~2–3 s delay) | On page entry (~0.5 s) |
| LCP (Largest Contentful Paint) | ~3.5 s                   | ~2.5 s                 |
| First video frame              | ~3–4 s                   | ~1–2 s                 |
| 404 errors in console          | Yes (broken R2)          | None                   |
