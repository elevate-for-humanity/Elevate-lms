# Google Cloud lesson and approved-video production contract

Status: **implementation specification**. This document does not claim that Google Workflows, separate media workers, or a live deployment already exist.

## Ownership and provenance

The existing Ultimate Course Builder owns curriculum, lesson objectives, narration, storyboard, visual assignments, validation and LMS publication. Google Cloud Run owns compute execution only. Supabase remains the durable source of truth for job claims, lesson checkpoints and completion. A cloud task must never infer lesson requirements from a filename, stock video title, or a Cloud Run task index.

Each lesson execution must carry immutable identifiers: `courseId`, `buildId`, `competencyId`, `lessonBuildId`, `contractVersion`, `scriptHash`, `storyboardHash`, `mediaManifestHash`, `renderProfile`, and `executionGeneration`. A missing or mismatched prerequisite blocks only that lesson stage and produces an actionable diagnostic. Reuse already approved artifacts when their input hashes are unchanged.

## Approved video reference — source of truth

The **approved video uploaded by the course owner** is the creative reference for how lesson videos should look and flow. Do not substitute a stock template or infer approval from a similarly named asset. Record its durable asset ID, storage URI, checksum, owner approval record, approval date, permitted uses, reference aspect ratio, pacing and layout notes. If any of those required fields are missing, mark the style reference `awaiting_owner_reference`; never fabricate the reference or assert the output matches it.

Reference video is a **style and editorial guide**, not permission to copy third-party footage or claim it demonstrates a procedure. Preserve the approved instructional script and licensed media rules.

## Slideshow and source-video rendering instructions

1. **Script first.** Lock the authored narration and learning objectives before planning visuals. Divide the script into scenes and narration segments; preserve their exact identifiers.
2. **Storyboard every scene.** For each scene specify `sceneId`, `scriptSegmentId`, `narrationStartMs`, `narrationEndMs`, `visualType` (`approved_image`, `licensed_video`, `instructional_graphic`), `assetId`, `sourceUri`, `licenseEvidenceUrl` where required, `relevanceReason`, `cropMode`, `motion`, `caption`, and `teachingSteps`. Use real evidence, not placeholder URLs.
3. **Slideshow photos.** Prefer full-bleed, sharp, properly exposed, high-resolution relevant photographs. Apply gentle Ken Burns motion only where it improves attention; do not crop out hands, tools, heads or critical demonstrations. Keep captions high contrast and within safe margins. Avoid repeated pictures and generic filler.
4. **Source video clips.** Use approved or licensed footage that actually depicts the action described. Trim to the demonstrated procedure; preserve natural motion and aspect ratio. Never imply stock footage proves a specific competency or safety action without verified frame evidence. Do not loop a short clip to fill narration.
5. **Instructional overlays.** Number procedural steps; synchronize each overlay with its narrated statement. Use the existing narration-bound visual validator. A graphic is authored teaching content, not something presumed to be present in a stock photograph.
6. **Audio.** Narration is the timing master. Align each scene to its actual decoded audio duration. Normalize levels, avoid clipping and abrupt cuts, and duck background music where present. Generate captions from the approved script and verify alignment.
7. **Transitions.** Use restrained consistent transitions. Never conceal a procedure with decorative effects or create a washed-out, generic look. Match the approved reference video's palette, typography, framing and pacing when that reference is present and documented.
8. **Render.** The renderer receives a complete, immutable scene manifest, never an open-ended instruction to search for visuals while rendering. Remotion assembles images, licensed clips, instructional overlays, captions and narration deterministically.
9. **Inspect.** Verify output dimensions, duration, audio track, playable URL, no blank frames, no black gaps, no truncated titles, scene-to-narration correspondence, media licenses and course-specific practical teaching coverage. Store sampled-frame evidence and a render manifest checksum.
10. **Release.** Publish only when the existing lesson contract, accessibility checks, assessment coverage, traceability and learner run-through pass. Keep failures targeted; do not invalidate unrelated completed lessons.

## Cloud execution and dependencies

Proposed stages: `standards -> script -> storyboard -> media_assignment -> narration + visual_preparation -> render -> audio_visual_qa -> release`. Parallel branches may start only after the script/storyboard inputs are locked. Rendering must wait for both narration and all assigned assets to be available. A retry must use the same immutable manifest and must not duplicate a published lesson.

Suggested resource separation (subject to measured capacity and regional quota):
- **Instruction worker:** lightweight CPU, no video encoding.
- **Narration/asset worker:** CPU or managed speech service, bounded per-asset concurrency.
- **Render worker:** dedicated high-memory Cloud Run Job with Remotion concurrency capped according to actual CPU/memory and regional quota.
- **Coordinator:** Google Workflows or authenticated Cloud Run dispatcher; GitHub Actions only for deployment. Supabase fenced claims remain the authority for exclusive processing.

Cloud Run Jobs provision tasks, but **do not understand curriculum or independently assign Supabase jobs**. The application must claim and acknowledge jobs, respect task retries and checkpoints, and measure resource needs before raising parallelism. Do not create new billable Google services until IAM, quota, billing, retry safety and observability are verified.

## Acceptance evidence

For each lesson retain: source approvals; immutable script/storyboard/media hashes; asset IDs and license evidence; actual narration duration; scene timeline; render URI and checksum; frame inspection; accessibility and assessment results; worker/execution ID; completion checkpoint; and owner-facing preview. Missing evidence means **not approved**, not a silent fallback to generic imagery.
