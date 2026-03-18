# Hero Video Standard

This document defines the non-negotiable rules for hero banners on www.elevateforhumanity.org. All current and future pages must follow this standard. Deviations require explicit approval.

---

## Rules

### What is prohibited on the video frame

- No gradient overlays (`bg-gradient-to-t`, `from-black`, `before:` / `after:` pseudo-element overlays, dark opacity wash layers)
- No headlines, subheadlines, paragraphs, checklists, or CTA stacks rendered on top of the video
- No text baked into the video asset itself
- No page-specific custom hero styling that breaks consistency with this system

### What is allowed on the video frame

- One discreet sound toggle (bottom-right corner)
- One play/pause control (bottom-right corner, adjacent to sound toggle)
- One micro-label of 2–4 words maximum (bottom-left corner)
- One small brand bug if explicitly required (top-left corner)

### Where primary messaging lives

All headlines, subheadlines, supporting copy, and CTAs render **below the video frame** in the below-hero content block. Never on top of the video.

---

## Shared Component

**`components/marketing/HeroVideo.tsx`**

All hero banners must use this component. Do not build page-level custom hero markup.

```tsx
import HeroVideo from '@/components/marketing/HeroVideo';
```

Props:

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `videoSrcDesktop` | `string` | Yes | MP4 path |
| `videoSrcMobile` | `string` | No | Falls back to desktop if omitted |
| `posterImage` | `string` | Yes | Shown while video loads and as reduced-motion fallback |
| `voiceoverSrc` | `string` | No | Separate audio track, controlled by sound toggle |
| `microLabel` | `string` | No | 2–4 words max, bottom-left of video |
| `showBrandBug` | `boolean` | No | Small logo, top-left of video |
| `belowHeroHeadline` | `string` | No | Rendered below the video |
| `belowHeroSubheadline` | `string` | No | Rendered below the video |
| `ctas` | `HeroVideoCta[]` | No | Rendered below the video |
| `trustIndicators` | `string[]` | No | Rendered below the video |
| `transcript` | `string` | No | Expandable section below the fold |
| `analyticsName` | `string` | No | Used for aria-label and tracking |
| `children` | `ReactNode` | No | Custom below-hero content slot |

---

## Centralized Content Model

**`content/heroBanners.ts`**

All per-page hero content (headlines, subheadlines, CTAs, transcripts, video sources, poster images) is defined here. Pages import from this file — they do not define hero content inline.

```ts
import heroBanners from '@/content/heroBanners';
const hero = heroBanners.home; // or .about, .platform, etc.
```

To add a new page, add an entry to `heroBanners` in `content/heroBanners.ts` and use `HeroVideo` in the page.

---

## Behavior

| Behavior | Implementation |
|----------|---------------|
| Autoplay | Muted, looped, starts on mount |
| Pause when off-screen | IntersectionObserver at 20% threshold |
| Reduced motion | Poster image shown, video never plays |
| Video load failure | Falls back to poster image |
| Sound | Off by default; user-initiated via toggle |
| Voiceover sync | Audio element synced to sound toggle state |
| Keyboard access | Play/pause and sound toggle are focusable buttons with `aria-label` |
| Transcript | Expandable `<button>` below the fold, never over the video |

---

## Height and Spacing

| Token | Value |
|-------|-------|
| Hero height | `clamp(280px, 56vw, 680px)` — no layout shift |
| Below-hero padding | `py-10 sm:py-14` |
| Below-hero max-width | `max-w-4xl` |
| CTA gap | `gap-3` |
| Transcript placement | Below below-hero block, `bg-slate-50 border-b` |
| Control placement | `bottom-4 right-4` (sound + play/pause) |
| Micro-label placement | `bottom-4 left-4` |

---

## Page Inventory

| Page | Route | Config key |
|------|-------|------------|
| Homepage | `/` | `heroBanners.home` |
| About | `/about` | `heroBanners.about` |
| Platform | `/platform` | `heroBanners.platform` |
| Funding / How It Works | `/funding/how-it-works` | `heroBanners['funding-how-it-works']` |
| Healthcare Programs | `/programs/healthcare` | `heroBanners.healthcare` |
| Skilled Trades | `/programs/skilled-trades` | `heroBanners['skilled-trades']` |

Program pages that use `ProgramPageLayout` (`components/programs/ProgramPageLayout.tsx`) automatically use `HeroVideo` — no per-page hero code required.

---

## Video Asset Gaps

One page uses a temporary video asset pending a dedicated production:

| Page | Current asset (temporary) | Replace with |
|------|--------------------------|--------------|
| Funding / How It Works | `/videos/orientation-full.mp4` | `/videos/funding-how-it-works.mp4` |

To swap: update `videoSrcDesktop` in `content/heroBanners.ts` for the `funding-how-it-works` key. No other code changes required.

The About page now uses `/videos/about-mission.mp4` — no gap.

---

## What to do when adding a new top-level page with a hero

1. Add an entry to `content/heroBanners.ts`
2. Use `<HeroVideo ... />` in the page, passing the config key
3. Put all headlines, subheadlines, and CTAs in the `children` slot or as props — never on the video
4. Provide a `posterImage` — required
5. Provide a `transcript` if a voiceover is used

Do not create a new hero component. Do not add a gradient overlay. Do not render text on the video.
