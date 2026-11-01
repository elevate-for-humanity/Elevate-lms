# Admin dashboard connection audit — November 1, 2026

## Scope and disposition

Inspected the authenticated live /dashboard, /studio/courses and /phone pages, dashboard data aggregation/normalization, visible dashboard panel implementations, and the source routes for the 17 operational shortcuts/destinations. Source existence is not end-to-end acceptance. This is not certification of every nested admin screen or external provider.

Dashboard fixes and administrator course-inspection fixes are committed to main. Nine focused tests pass in an isolated Vitest environment with mocked Next Link/database boundaries. Modified TypeScript/TSX files pass TypeScript transpilation syntax checks. Full repository typecheck, lint, build and production deployment are **not verified**. The live Studio Run CI control returned **GitHub workflow dispatch rejected with HTTP 403**. Do not claim these changes are live solely because main contains them.

## Fixed source defects

| Area | Before | Result on main |
| --- | --- | --- |
| Enrollment funnel | Pending applications labeled Applied; Enrolled computed as active + certificate count; unrelated populations used as conversion percentages | Actual nonrevoked, filtered enrollment-record count is passed from the paginated database aggregator. Snapshot distinguishes pending applications, enrollment records, active enrollments and certificates. Removed unsupported conversion rates. Missing sources show Unavailable. |
| Health normalization | An explicitly empty live alert array was replaced with a fallback unavailable-health alert | Verified empty array is preserved; absent alert data retains fallback warning. |
| Program management links | Normalization discarded canonical slug even though links prefer it | Slug survives normalization. |
| Job-feed status | Presence of API configuration displayed Connected; absent config displayed Needs approval | Labels now distinguish API configured, API not configured and Status unavailable. Credentials alone do not establish successful provider operation. |
| Host Shop launcher | Archived shop/partner records mixed with operational cards; inactive partner could still be labeled Verified; disconnected action was a noninteractive span | Archived group uses both shop and partner active state. Archive records remain reviewable. Connection review opens the existing partner directory. No shops were deleted or reactivated. |
| Administrator course view | Draft-preview wording; admin playback still stopped seeking at checkpoints; assessment replaced with disabled completion panel | Full administrator course/lesson labels, free seeking in authenticated admin review, saved assessment questions/answer keys/rationales and Studio management link. Learner timing, result and completion writes remain excluded from admin inspection. No authorization guard was broadened. |

Focused coverage includes actual enrollment counts independent of certificate counts, unavailable count handling, empty health-alert preservation, slug preservation, enrollment availability preservation, admin unrestricted seeking, ordinary-preview checkpoint behavior and protection against learner persistence. Tests are tests/unit/admin-dashboard-truth.test.tsx and tests/unit/course-preview-readonly-video.test.tsx.

## Live findings still open

| Surface | Observed state | Meaning |
| --- | --- | --- |
| QuickBooks dashboard health | Company authorization unavailable; webhook verifier not configured | Actual integration failure reported by runtime checks, not a sample metric. No invoice or payment was sent. |
| Government job feed | 0 recent feed jobs; last import Never; neither displayed source configured | Import route is implemented, but configured/working provider access not established. No import was forced. |
| Phone network | Setup required; verified carrier number/connection required | Saved phone configuration is not proof of a live carrier path. |
| Voicemail | Enabled and transcription enabled; 0 new voicemail | Configuration only. No inbound call, recording or playback test was completed in this pass. |
| Meetings | UI says Connected, based on Elevate-owned browser-room availability | Room availability does not verify an actual two-party camera/mic/screen-share call. |
| Phone routing | Saved routing mode Automated menu; AI receptionist flag enabled; saved destinations/menu and extensions visible | No live call placement/transfer was asserted. Some old-shop destinations remain active; do not equate shop-directory archive display with carrier route removal. |
| Deployment panel | Services say healthy (revision not verified); last deploy absent | Reachability is not proof of deployed commit. |
| Run CI | Workflow dispatch HTTP 403 | Current deployment/CI access blocker remains. No new ready revision or runtime SHA obtained. |
| Program integrity | 12 critical rows reported in visible panel | Some programs lack canonical course/module/lesson/completion records. External-provider programs need their proper delivery evidence, not invented local curriculum. |
| Admin full view | Live LMS still shows old Admin draft preview banner | Source repair is not yet production-verified. |
| Dashboard email | Account notice and mailbox link present | Opening a mailbox does not verify send/delivery/attachment handling. No messages were sent. |

Displayed dashboard totals are sourced through Supabase queries, not hardcoded sample records in the inspected shell. This does not validate every underlying business record, close old applications, or establish financial reconciliation. Most placeholder search hits were historic audit documents or ordinary HTML input placeholders rather than live sample data.

Operational shortcut source files were verified for applications, students, programs, funding, documents/review, program-holders, phone, phone/email, partners, portals, analytics/traffic, reports, compliance, website-editor, system-health, operations/infrastructure-costs and enrollments. Each requires its own operational acceptance for downstream actions.

## Two course submissions

- Nail course reused: 377cd34a-b402-40ab-8ff9-2fcfd394b96d; build 370f51b9-08cd-469e-b4c3-69534156ce7c; initial job 064e2ced-b71a-4310-94fc-a0de3d8f8aa9.
- Esthetics course created: 8f3472fe-8fe9-4e16-bc31-d502e3de3c7a; build b79b0d56-e27d-4218-81a5-5de1f3376e8d; initial job 784263f9-9669-4701-b3e1-3c84185cae32.
- Both profiles preserve 19/20 competencies respectively. Both have the signed-standard representation and authored opening-unit text saved as instructional source records; PARIS monitoring is enabled.
- Direct launches reported unaccepted Google/GitHub dispatch. Scheduled workers subsequently wrote heartbeat evidence and esthetics initialized lesson autopilots; that is activity, not successful course completion.
- Latest inspected esthetics lesson records: six built_with_findings. Sample instruction jobs report ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED. The source selector binds sources by competency ID (or syllabus sources for explicitly configured Google authoring); the generic source IDs saved so far do not establish complete per-competency teaching.
- Full authored content and correct per-lesson source binding remain necessary for subjects beyond the opening units. Signed subject labels alone are not instructional curriculum. Do not bypass the source gate or relabel one opening unit as support for every competency.
- Nails remains queued in the latest inspected lifecycle. Neither course was represented as complete or published.

## Next acceptance evidence

Restore trusted workflow/worker dispatch, run required repository checks, deploy Admin/LMS, verify the actual ready revision and runtime SHA, then verify admin full-view behavior on published and unpublished lessons. Complete authentic course source mapping and instructional/media acceptance. Separately verify QuickBooks and phone-carrier paths, actual voicemail delivery/playback and a two-party meeting. Preserve all learner progress, signed standards and historical records throughout.
