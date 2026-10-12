# Approved lesson compatibility comparison

Owner approved the narrated slideshow lesson on October 12, 2026, then requested removal of duplicated narration, unexplained silent gaps, blank delays, and redundant same-page pictures. A source picture may be reused when it visibly teaches a different technique. This is a delivery reference, not a substitute for Appendix A or proof of completed media QA.

| Requirement from approved lesson | Existing builder behavior | Change / acceptance evidence |
| --- | --- | --- |
| Preserve existing courses and student records | Existing canonical course and lesson IDs | Apply preset to the two existing course IDs during profile hydration; no student or enrollment mutation |
| Charcoal, white and warm accents; no blue slide | Bright/blue layouts and instructor-specific colors | Scoped premium composition and explicit palette; unrelated courses retain their current layout |
| Whole photograph with explanation beside it | Full-frame cover crops and overlay text | One contain-fit image/video panel and separate instruction panel; component tests verify contain fit, panel separation and one visual |
| Different pictures/clips as teaching advances | Scene-based media assignments already exist | Retain resolved, licensed scene assignments; no arbitrary replacement clip or fabricated entitlement |
| Separate number, heading and instruction fades | Standard scene layout | Premium composition fades those elements separately while keeping the image visible |
| Numbered tools/guards and preparation through service reset | Existing authored source and assessments | Source-grounded author receives approved teaching requirements; exact technical details must be supported by source |
| Recap after teaching moment without replaying speech | Source-bound stages with existing duplicate-speech check | Source-grounded author requested to produce a fresh short recap/question within each moment; existing sources still require instructional review |
| No blank audio delays | Rounded-up speech plus one second per scene; silent 3-second intro/2-second outro | Frame-quantized measured speech durations; omit silent bookends; synchronization, render length and VTT offsets agree |
| No missing TTS or dropouts | Duration check and aggregate narration QA | Require each premium scene to have speech and media; inspect approved audio signal and reject silence of at least 1.5 seconds at -40 dB, inaudible tracks and missing measurements |
| No simultaneous narrator/demo voices | Demo clips muted; full-lesson and scene audio could coexist | Muted demos retained; reject simultaneous full-lesson and per-scene narrator tracks |
| Bottom captions | Word-timed caption cues exist | Dedicated premium bottom band uses those measured cues; VTT begins at the same scene time |
| No obsolete rendered chunks after format changes | Render checkpoints hashed scenes and duration | Add presentation preset/layout version to checkpoint fingerprint |
| Interactive test, feedback, retry and practical checkoff | Existing canonical assessments and release package | Preserve these; visual/template adoption does not certify test or practical completion |
| Publish to LMS and student dashboard | Existing verified release pipeline | Release remains blocked until current media/instruction/narration/learner QA evidence passes |

## Live inventory at the comparison

| Existing course | Lessons | Lessons with video URL | Lessons with quiz items | Published lesson rows |
| --- | ---: | ---: | ---: | ---: |
| Prestige Barber Course | 14 | 0 | 14 | 0 |
| Hair Stylist / Cosmetology RTI | 40 | 29 | 40 | 0 |

A URL or a rendering status is not evidence of a completed, playable, approved lesson. The barber worker was blocked on media dependencies; its resume request has been queued. Cosmetology has an active narration worker. Existing generated sources, rendered video, assessment alignment and learner access must still be inspected. The repository's canonical Appendix A currently defines barber, esthetician and manicurist; it does not define a cosmetology work-process schedule. No generic cosmetology hours are substituted by this change.

## Release limits

This implementation does not upload the approved sample, generate the missing demonstration footage, approve existing lesson content, change student records, or declare either course published. Deploy only after the repository's required build checks pass, then verify the ready Google revision and a freshly rendered lesson before releasing either course.
