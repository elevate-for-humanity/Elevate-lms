# Spec: Replace DALL-E Slideshow with HeyGen Avatar Training Video

## Problem Statement

The current HVAC Module 1 lesson video (`course-videos/hvac/hvac-module1-lesson1.mp4`, 13.5 MB) is a slideshow — static DALL-E images with OpenAI TTS robot narration and text overlaid via canvas rendering. It does not teach effectively. A training video needs a visible instructor who speaks to the student with relevant visual context behind them.

The user's "learning curve" requirements specify: 2–7 minute length, single learning objective, 30-second hook, step-by-step demonstrations, on-screen text/annotations, summary, and CTA. The current video meets none of these criteria.

## What Exists Today

| Component | Status | Location |
|---|---|---|
| HeyGen API key | ✅ Valid, 2,227s remaining | `.env.local` |
| HeyGen avatars | ✅ 1,287 public avatars | API: `/v2/avatars` |
| HeyGen voices | ✅ Many English options | API: `/v2/voices` |
| Lesson script | ✅ Single long string (~1,200 words) | `courses/hvac/module1/lesson1-script.ts` |
| DALL-E image pipeline | ✅ Generates + saves to disk | `lib/autopilot/lesson-to-scenes.ts` |
| TTS service | ✅ OpenAI TTS | `server/tts-service.ts` |
| Video pipeline (slideshow) | ✅ Canvas + FFmpeg | `server/video-generator-v2.ts` |
| HeyGen service wrapper | ❌ Does not exist | Needs to be created |
| Current video in Supabase | ✅ 13.5 MB | `course-videos/hvac/hvac-module1-lesson1.mp4` |
| Module 1 page | ✅ Plays from VIDEO_URL | `app/preview/hvac-module-1/page.tsx` |

## HeyGen API Capabilities (Confirmed)

The HeyGen v2 `/video/generate` endpoint supports:
- **Multiple scenes**: each entry in `video_inputs[]` is a separate scene
- **Background per scene**: `color` (hex), `image` (URL or asset_id), or `video` (URL or asset_id)
- **Avatar per scene**: public avatar with `avatar_id` + `avatar_style`
- **Voice per scene**: text-to-speech with `voice_id` + `input_text`
- **Dimension**: configurable (1920x1080)

**Not supported via API alone**: text overlays, annotations, arrows, split-screen layouts. These require either:
- Pre-composited background images (DALL-E images with text/labels baked in)
- Post-processing with FFmpeg after HeyGen renders the avatar

## Requirements

### R1: Create HeyGen Service Wrapper
Build `server/heygen-service.ts` with functions to:
- Create a multi-scene video via `/v2/video/generate`
- Poll for completion via `/v1/video_status.get`
- Check remaining credits via `/v2/user/remaining_quota`

### R2: Structure the Lesson Script into Scenes
Split the existing single-string lesson script into 5-6 structured scenes following the learning curve format:
1. **Hook** (~30s): Why HVAC matters, what you'll learn
2. **System Overview** (~30s): Split system, indoor/outdoor units
3. **Components Deep-Dive** (~90s): Compressor, condenser coil, fan motor, capacitor, contactor, service valves
4. **Inspection Walkthrough** (~60s): 4-step technician inspection
5. **Quiz Preview** (~20s): Preview the 5 questions
6. **Wrap-Up + CTA** (~15s): Summary, next steps (3D lab + quiz)

Total: ~4 minutes (~240 seconds). Well within the 2,227s credit budget.

### R3: Generate DALL-E Background Images with Visual Context
For each scene, generate a DALL-E background image that provides visual context for what the instructor is teaching:
- Scene 1 (Hook): HVAC technician at a residential condenser unit
- Scene 2 (Overview): Cutaway diagram of a split AC system showing indoor and outdoor units
- Scene 3 (Components): Close-up of condenser internals with labeled parts (labels baked into the DALL-E prompt)
- Scene 4 (Inspection): Technician with multimeter at an open condenser panel
- Scene 5 (Quiz): Clean classroom/training whiteboard environment
- Scene 6 (Wrap-Up): Professional training completion setting

Since HeyGen doesn't support text overlays via API, key labels and annotations are baked into the DALL-E image prompts (e.g., "photorealistic image of HVAC condenser internals with labeled arrows pointing to compressor, condenser coil, fan motor").

### R4: Generate the HeyGen Avatar Video
- Avatar: Professional male, business/training setting (e.g., `Brandon_Business_Standing_Front_public`)
- Voice: Clear, informative English male (e.g., `61ac6ff657244feb9da60288fbcfea20` — David Boles Informative)
- Each scene: avatar speaks the script with the DALL-E image as background
- Output: 1920x1080 MP4

### R5: Upload and Replace
- Download the rendered MP4 from HeyGen
- Upload to Supabase storage at `course-videos/hvac/hvac-module1-lesson1.mp4` (overwrite)
- No page code changes needed — the Module 1 page already plays from this URL

## Visual Strategy

Since HeyGen renders the avatar in front of a background image, the visual approach is:

| Scene | Background Image | Visual Effect |
|---|---|---|
| Hook | Outdoor condenser unit, residential setting | Instructor introduces topic in front of real equipment |
| Overview | Diagram of split AC system (indoor + outdoor) | Instructor explains system layout with diagram behind |
| Components | Labeled condenser internals (annotations baked into DALL-E image) | Instructor teaches components with labeled visual |
| Inspection | Technician inspecting condenser with tools | Instructor walks through inspection steps |
| Quiz Preview | Clean training room / whiteboard | Instructor previews quiz |
| Wrap-Up | Professional completion setting | Instructor closes with CTA |

The avatar appears as a visible instructor in front of contextual HVAC visuals. Each scene transition marks a topic change. This is significantly better than the current slideshow because:
1. A visible instructor creates engagement and trust
2. Background images provide visual context for each topic
3. Scene transitions mark topic changes
4. Natural avatar speech replaces robot TTS

## Acceptance Criteria

- [ ] `server/heygen-service.ts` exists with `createVideo()`, `pollVideo()`, `getRemainingCredits()`
- [ ] Lesson script is restructured into 5-6 scenes with hook/demo/recap/CTA format
- [ ] Each scene has a DALL-E background image with relevant HVAC visuals
- [ ] HeyGen generates a multi-scene avatar video (1920x1080)
- [ ] Avatar is a professional-looking instructor speaking the lesson script
- [ ] Video is uploaded to Supabase at `course-videos/hvac/hvac-module1-lesson1.mp4`
- [ ] Video plays correctly on the Module 1 page without page code changes
- [ ] HeyGen credit usage is under 300 seconds
- [ ] Total video length is 3-5 minutes

## Implementation Steps

1. **Create `server/heygen-service.ts`** — HeyGen API wrapper (create video, poll status, check credits)
2. **Create `courses/hvac/module1/lesson1-scenes.ts`** — Restructured 6-scene script with hook/demo/recap/CTA format, each scene with narration text and DALL-E image prompt
3. **Create `scripts/generate-heygen-video.ts`** — Orchestration script that:
   a. Generates fresh DALL-E background images (saves to disk temporarily)
   b. Uploads images to a public URL (Supabase storage) so HeyGen can fetch them
   c. Calls HeyGen `createVideo()` with all 6 scenes
   d. Polls for completion
   e. Downloads the finished MP4
   f. Uploads to Supabase storage at `course-videos/hvac/hvac-module1-lesson1.mp4`
4. **Run the script** — Execute to generate and upload the video
5. **Verify playback** — Confirm the video plays on the Module 1 page
6. **Clean up** — Remove temporary DALL-E images from disk and Supabase temp storage
