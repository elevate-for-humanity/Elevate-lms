# Hero Video Standard

## Canonical implementation

Marketing hero media must render through `components/marketing/HeroVideo.tsx`.
Compatibility wrappers such as `HomeHeroVideo` and `PageVideoHero` may adapt props, but they must not implement their own playback, looping, mute, resize, or error-fallback logic.

Hero video assignments are resolved through `lib/video/registry.ts` and `content/heroBanners.ts`. Page components must not hard-code hero MP4 URLs.

## Media rules

1. A marketing page receives one dedicated hero video only when that video is explicitly assigned to the page key in `HERO_VIDEO_BY_PAGE_KEY` or the raw banner URL is unique across the banner dataset.
2. A video already reused by unrelated banner entries is removed at runtime for those entries. The page uses its page/program-specific picture instead.
3. Mobile uses the page's dedicated mobile source when one exists; otherwise it reuses that same page's desktop source. It must never substitute an unrelated generic mobile video.
4. Video plays once and never loops.
5. Playback begins muted when the hero is substantially visible. Sound is user initiated. When a recorded `voiceoverSrc` exists, the sound control plays that narration instead of creating competing audio tracks.
6. A video load/playback failure falls back to `posterImage`. A failed MP4 must never leave a broken or permanently black hero.
7. Route changes and unmounts stop video, voiceover audio, and demo timers.
8. No primary sales copy or full-screen gradient is placed over hero media. Identity copy and CTAs render in the content panel below the media.

## Canonical data flow

`public/data/hero-banners.json` → `content/heroBanners.ts` → `lib/video/registry.ts` media assignment → `components/marketing/HeroVideo.tsx`

The copy JSON may exist in app public output for packaging, but runtime normalization is authoritative. Any generated/copy file must stay byte-equivalent to the canonical source and must not be hand-edited independently.

## Prohibited

- raw `<video>` hero implementations in Marketing pages
- page-level hard-coded hero MP4 overrides
- looping marketing hero videos
- generic mobile video fallbacks on unrelated pages
- multiple independent hero playback implementations
- silent failure without a relevant poster/picture fallback
- duplicate hero-video assignments that bypass the canonical registry
