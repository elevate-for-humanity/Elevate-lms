# Program Holder focused task tabs — 2026-10-28

## Requested behavior

Home contains only To-dos and Alerts. One persistent navigation menu selects the middle workspace. Each operational tab has a relevant visual, one assignment, and its own three-step PARIS lesson. Lessons advance after narration ends and support pause, resume, replay and manual steps. Viewing a lesson does not mutate official records or mark work complete.

## Changes

- Consolidated the outer portal menu and nested PlatformShell into one parent PlatformShell. Section-level approval checks remain in place; private records and administrator preview restrictions are unchanged.
- Grouped navigation into Start, People, Training, Office, and Records & Setup. The most-specific route is the single active item. Phone, Email, Calendar & Video, AirScript, Community and Handbook retain canonical destinations.
- Home now contains the outstanding applicant, hours, student-follow-up, compliance and agreement action queue, followed by alerts. Live communication notices appear inside Alerts. Incoming-call and push listeners remain active across tabs.
- Removed the all-programs hero, roster snapshot, office directory, repeated action cards and whole-dashboard slideshow from Home. Full records stay on their task pages; program syllabi stay in Programs; initial setup stays in Office Setup. Assigned regional training remains accessible in role references.
- Added 24 route-specific lesson definitions with published local imagery and visible narration captions. Closed PARIS lessons and the floating assistant do not autoplay on Home.
- Calendar & Video retains the real calendar, student appointments, invitation status and secure LiveKit rooms. Added a local-only camera/microphone/screen-share check; it requests devices only on click and stops tracks on close or unmount.
- Added an IMPACT meeting brief to the Gary launch assignment. Provider-location lookup IDs were transcribed from DWD approval emails dated June 12 and August 3, 2026. The brief distinguishes provider, course, site and participant approval, and asks the liaison for the local partnership setup process. Historical referral-hold language was removed at the user’s direction.
- Payment addendum signing remains in Sign Agreement. An unsigned addendum is an alert at Home and the full payment summary and provider invoice upload remain in Payments & Invoices.

## Visual asset provenance

New asset: `public/images/pages/phone-support-coordinator-v2.webp` (96,514 bytes).

Generated using the built-in image-generation tool, then encoded as WebP for website delivery. Prompt: “Use case: photorealistic-natural. Asset type: landscape 16:9 hero photograph for Elevate for Humanity's Phone dashboard tab. Show a professional Black woman workforce-training coordinator wearing a real over-ear USB headset with boom microphone, seated at a tidy laptop workstation, calmly speaking with a participant over a browser phone call. Camera framing wide medium side view; headset, microphone and laptop clearly visible, authentic office setting, natural daylight, navy and warm neutral tones, high quality candid editorial photography. No words, logos, watermarks, captions, fake dashboard screenshots, or overlaid text. This image must clearly communicate making a phone call, not generic office teamwork.”

Existing images were visually inspected: the applauding-audience report image and unrelated compliance-worker image were excluded from the new lesson choices.

## Validation and limits

- Focused UI, authorization-boundary, notification, calendar, phone, narration and screen-share checks run locally; exact results are recorded in the PR.
- Marketing, Admin and LMS typechecks passed with the repository’s bounded memory runner. Changed-source ESLint passed.
- Marketing and Admin production compilation and generated-route typechecks passed. Final LMS production build results are recorded in the PR.
- Live natural voice endpoint returned HTTP 200, `audio/mpeg`, 33,600 bytes for a non-private navigation test.
- Account configuration was checked for enabled extensions, meeting-host access and active organization mailboxes. Configuration checks do not prove a successful real-world call or working camera/microphone on a person's device.
- The available live browser session is an administrator preview. It correctly disables private calendar and meeting writes. No student invitation, outbound call or email was sent during checks.
- Spotify hosting/publication is not changed by this code. The per-tab lessons run inside the LMS using the existing natural voice service.
- Production acceptance requires a ready Google Cloud revision and live UI verification against the deployed commit. A local build or merged PR alone is not deployment evidence.
