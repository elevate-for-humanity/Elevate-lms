# Hero Video Standard

## Rule

Hero videos play unmuted by default. No mute button is shown.

Browsers that block unmuted autoplay (first load, no prior user interaction) fall back
to muted silently. The user never sees a mute toggle.

## Implementation

All hero video components use `useHeroVideo` from `hooks/useHeroVideo.ts`.

The hook:
1. Attempts `el.muted = false; el.play()`
2. On failure, falls back to `el.muted = true; el.play()`
3. Pauses when scrolled off-screen (configurable via `pauseOffScreen`)

```ts
const { videoRef } = useHeroVideo();
```

## Video Element Rules

- No `muted` attribute on the `<video>` element — the hook sets it programmatically
- No `autoPlay` attribute — the hook calls `.play()` directly
- Always include `loop playsInline preload="auto"`
- Always include a `poster` image for the loading state

```tsx
<video
  ref={videoRef}
  loop
  playsInline
  preload="auto"
  poster={posterSrc}
  className="absolute inset-0 w-full h-full object-cover"
>
  <source src={videoSrc} type="video/mp4" />
</video>
```

## Hero Container Rules

- Height: `h-[45vh] min-h-[280px] max-h-[560px]`
- No gradient overlay
- No text, badges, or CTAs on top of the video
- All identity content renders in a white panel **below** the hero

## Voiceover (VoiceoverWithMusic)

Program pages with a separate voiceover audio track use `VoiceoverWithMusic`.
It auto-plays on first scroll. Pass `audioSrc` to `PageVideoHero` or render
`<VoiceoverWithMusic audioSrc="..." />` directly.

## Components That Use This Standard

| Component | Used By |
|-----------|---------|
| `components/ui/HomeHeroVideo.tsx` | Home page |
| `components/ProgramHeroBanner.tsx` | Programs index, ProgramPageLayout, ProgramTemplate |
| `components/ui/PageVideoHero.tsx` | ProgramDetailPage |
| `components/ui/VideoHeroBanner.tsx` | Mission page |
| `components/programs/ProgramCategoryPage.tsx` | Healthcare, Trades, Tech category pages |
| `hooks/useHeroVideo.ts` | All of the above |

## Prohibited

- `muted` attribute on hero `<video>` elements
- `autoPlay` attribute on hero `<video>` elements
- Mute/unmute toggle buttons on hero sections
- Gradient overlays on hero media
- Text rendered on top of hero video or image
