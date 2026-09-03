# Commercial Media Studio — Artlist + InVideo AI Gap Audit

**Date:** 2026-08-11  
**Scope:** Elevate Media Studio, hero media, Store demos, commercial generation, image generation, voice, media projects, captions, and export.  
**Decision:** Extend the existing canonical Elevate media stack. Do not create a parallel Artlist/InVideo clone.

## Executive finding

Elevate already owns most of the underlying production primitives: organization-scoped `media_assets`, AI image providers, OpenAI natural voice, Pexels stock video, Runway generative video, FFmpeg composition, hero playback, Website Builder, Store demos, and direct product/page context.

The missing value was orchestration and productization: one creator, persistent projects, a real storyboard-to-video workflow, aspect-ratio controls, captions, reusable assets, predictable media sourcing, and bright visual demos.

That is the gap this branch closes.

## Side-by-side

| Capability | Artlist | InVideo AI | Elevate before this pass | Decision / implementation |
|---|---|---|---|---|
| Unified creation entry point | Dynamic prompt box for image/video/voice/music | Prompt-to-video AI workflow | Media library existed; creator paths were fragmented | **Add.** Admin Media Studio now exposes Create / Projects / Library. |
| Persistent project/session | Sessions + My Library | Persistent projects/edits | Canonical `media_assets`, but no useful project grouping in Studio | **Add.** Generated assets persist with `project_name` metadata and group into Projects. |
| AI image generation | Multi-model generation/editing | Generated images inside video projects | Real provider layer existed, but older Media Studio mocks used Picsum/sleep | **Add.** Admin Studio calls real `aiGenerateImage()` and persists output to `media`. |
| Text-to-video | Multiple video models | Core AI-video workflow | Runway Gen4.5 client already existed | **Use existing.** Commercial renderer can use Runway. |
| Stock video | Large licensed catalog | 16M+ stock media / premium stock options | Pexels video client already existed | **Use existing.** Stock mode sources Pexels. Do not recreate a stock marketplace. |
| Quality/source modes | Model selection | Basic stock / generative quality tiers | Provider pieces existed but no buyer-facing mode | **Add.** Stock / Hybrid / Generative modes. Hybrid favors generative opening shots and stock for speed/cost. |
| Script/storyboard generation | Creative planning tools | Prompt → script → scenes | Old PARIS video creator produced simple templated scenes | **Replace orchestration.** AI commercial planner returns validated scene JSON with narration, on-screen text, stock query, visual prompt and timing. |
| Prompt-based editing | Conversational AI Agent | Magic Box prompt edits | No canonical commercial revision contract | **Add backend contract.** `reviseCommercialPlan()` edits an existing validated storyboard from plain-language instructions. |
| Natural voice | TTS, speech-to-speech, custom voice | Many voice/language/accent choices | Strong OpenAI natural voice route already existed | **Reuse.** Creator exposes voice preview; commercial renderer uses the chosen voice. |
| Captions/subtitles | Media editing workflows | Subtitle style + Dynamic Text | Store demos had text labels; commercial export had no narration captions | **Add.** Renderer burns narration subtitles plus concise on-screen headline. |
| Background music | Stock + AI music | AI/stock music with mood controls | Video pipelines had partial music support | **Add practical path.** Commercial can mix an approved audio asset from Media Library. Do not add AI music licensing complexity yet. |
| Multiple formats | Social/platform formats | 16:9, 9:16 and other formats | Hero system had desktop/mobile media but generator was not productized | **Add.** Commercial exports support 16:9, 9:16 and 1:1. |
| Avatar / UGC actor | Not core differentiator | Avatar clones, actors, UGC styles | HeyGen infrastructure exists historically | **Defer from canonical P0.** Valuable for select campaigns, but requires consent/identity/provider lifecycle and should plug into the same commercial provider contract later. |
| Video object/frame editing | Model-specific editing/recreate/extend | Prompt edits, Runway editing, media replacement | No unified visual edit contract | **P1.** High value, but not required to make the commercial generator useful. Add as scene replacement/edit operations, not a second editor. |
| Full manual timeline | External/editor workflows | InVideo Studio manual timeline | FFmpeg pipelines exist, no commercial timeline UI | **P1.** Add only after storyboard/scene replacement is stable. |
| Direct website/product publishing | Not website-native | Export/share video | Elevate hero/store/LMS/product context already exists | **Elevate advantage.** Media assets can carry use metadata and hero treatment; keep page deployment explicit rather than silently mutating static Marketing content. |

## What adds material value now

1. One canonical Media Studio instead of a collection of generation scripts.
2. Real image generation replacing simulated Picsum results.
3. Real persistent organization media API on the Admin domain.
4. Projects derived from canonical media metadata.
5. Commercial brief → validated AI storyboard.
6. Stock / Hybrid / Generative visual modes.
7. Pexels stock-video sourcing and Runway generative-video reuse.
8. OpenAI natural commercial narration.
9. Burned captions for muted viewing.
10. Optional background music from approved Media Library audio.
11. 16:9, 9:16 and 1:1 exports.
12. FFmpeg installed in the actual Northflank Admin runtime.
13. Hero focal-point and overlay controls saved with the asset.
14. Bright Store/Website Builder demonstrations and screenshot-safe `object-contain` treatment.
15. A click-through Website Builder simulation instead of a text-only walkthrough.

## What should not be copied

### A second media database

Do not adopt the older placeholder `media_items` / Picsum path as another source of truth. `media_assets` is already organization-scoped and production-oriented.

### Dozens of product-specific video scripts

The repository already documented a historical proliferation of video scripts. Commercial generation must stay behind one planner/renderer contract.

### A giant stock marketplace

Pexels plus generated media covers the production need. Artlist/InVideo's catalog economics are not the differentiator for Elevate.

### A provider/model zoo in the UI

Users should choose outcome and quality/source mode. Provider selection belongs behind the platform contract unless an advanced operator explicitly needs it.

### Silent Marketing mutation

Hero treatment metadata can be saved in Studio, but static Marketing publication must remain explicit and auditable. Do not make an Admin slider silently modify production pages without a controlled publish step.

## Canonical architecture after this pass

```text
Admin / Studio / Media
├── Create
│   ├── Commercial Video
│   │   ├── brief
│   │   ├── storyboard
│   │   ├── Stock / Hybrid / Generative
│   │   ├── natural voice
│   │   ├── captions
│   │   ├── music asset
│   │   └── 16:9 / 9:16 / 1:1 export
│   ├── AI Image
│   ├── Voiceover Preview
│   └── Hero Treatment
├── Projects
└── Library
    └── media_assets
```

```text
AI planner / image provider
        ↓
Pexels + Runway + OpenAI voice
        ↓
FFmpeg composer
        ↓
Supabase media bucket
        ↓
media_assets registry
        ↓
Store / Hero / LMS / Course / Marketing usage
```

## Remaining P1 enhancements

These are valuable but should extend this same system rather than block the current commercial generator:

- scene-level “replace media” and “regenerate this shot” controls;
- direct UI control for `reviseCommercialPlan()` instructions;
- asynchronous worker execution for long multi-scene generative jobs;
- word-timed animated captions rather than scene-level subtitles;
- start/end-frame and reference-image video generation;
- image editing/upscale/background removal using real providers;
- avatar/UGC actor provider under explicit identity/consent controls;
- speech-to-speech/custom brand voices;
- translation/dubbing/lip-sync;
- manual timeline only if customer demand justifies it;
- controlled “Publish hero treatment” step that maps approved asset metadata into Marketing's canonical hero registry and deploy workflow.

## Commercial hardening rule

The product is already commercialized. This work is commercial hardening: consolidate the media engine, make demonstrations sell the real product, make generation persistent and auditable, and make production output reusable across the existing Elevate operating system.
