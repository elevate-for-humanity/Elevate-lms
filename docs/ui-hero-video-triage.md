# Hero Video — Canonical Rules and Defect Register

## Canonical components

| Component | Use for |
|-----------|---------|
| `components/marketing/HeroVideo.tsx` | Marketing pages with voiceover, brand bug, transcript |
| `components/ui/PageVideoHero.tsx` | Program and content pages — video frame only |

All hero video usage must go through one of these two components. No page-level `<video>` tags in hero sections.

## Non-negotiable rules

1. Hero video autoplays on initial load — no scroll required to start
2. Hero video starts muted — browser policy requires this for autoplay
3. Hero video loops seamlessly
4. Hero video uses `playsInline` — required for iOS
5. Hero video has a `poster` image — prevents black flash on first paint
6. No text, headlines, CTAs, or overlays rendered on top of the video frame
7. All page identity content (h1, description, CTAs) renders **below** the video
8. Scroll may pause the video when off-screen — it must never be required to start it
9. Reduced-motion preference disables video; poster image is shown instead
10. `autoPlay`, `muted`, `controls` must not appear as JSX attributes on hero `<video>` elements — the component handles these programmatically

## Development enforcement

`lib/hero-video-audit.ts` — call `validateHeroVideoElement(videoRef.current)` inside any hero component's `useEffect`. Logs errors in development, no-ops in production. Both canonical components already call this.

## Defect register

Defects found and fixed in the May 2026 audit pass:

| File | Defect | Fix |
|------|--------|-----|
| `app/getstarted/page.tsx` | Text/CTAs on video, no poster, raw `autoPlay` | Replaced with `PageVideoHero`, content moved below |
| `app/programs/APPRENTICESHIP_TEMPLATE.tsx` | Full-bleed text overlay on video, no poster, raw `autoPlay` | Replaced with `PageVideoHero`, identity section added below |
| `components/ui/PageVideoHero.tsx` | `title`/`subtitle`/`badge` props rendered on video with gradient overlay | Props removed; component is video frame only |
| `app/programs/finance-bookkeeping-accounting/page.tsx` | Raw `autoPlay` + `muted` JSX attributes, no poster | Replaced with `PageVideoHero` |
| `app/store/apps/sam-gov/page.tsx` | 5 identical screenshots — UX trust defect on live page | Replaced with 5 distinct images from existing library |

## Patterns that must not appear in hero sections

```tsx
// Prohibited — raw video in hero
<video autoPlay muted loop playsInline>

// Prohibited — text on video
<div className="absolute inset-0">
  <h1 className="text-white">...</h1>
</div>

// Prohibited — gradient overlay on video
<div className="absolute inset-0 bg-gradient-to-t from-black/70 ...">

// Prohibited — scroll-triggered playback
window.addEventListener('scroll', () => { videoRef.current?.play(); });
IntersectionObserver(([e]) => { if (e.isIntersecting) video.play(); }); // in hero context
```

## Acceptable patterns

```tsx
// Correct — PageVideoHero for program/content pages
<PageVideoHero
  videoSrc="/videos/example.mp4"
  posterSrc="/images/pages/example-poster.jpg"
  posterAlt="Descriptive alt text"
  size="marketing"
/>

// Correct — identity content below the hero
<section className="bg-white border-b py-10 px-4">
  <h1>Page Title</h1>
  <p>Description</p>
  <Link href="/apply">Apply Now</Link>
</section>

// Correct — IntersectionObserver to PAUSE when off-screen (not to start)
// This is what useHeroVideo.ts does — threshold: 0, pauses only when fully gone
```
