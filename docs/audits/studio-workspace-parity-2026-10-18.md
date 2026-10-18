# Studio workspace comparison and repair evidence

Scope: compare the requested ChatGPT Work-style experience with existing Elevate Studio code and authenticated production observations. This is not a claim that Elevate duplicates every ChatGPT feature.

Baseline checkout: `5c6a9a496789f87324386c6047335ac655ac5127`.

Official comparison reference: https://learn.chatgpt.com/docs/environments/cloud-environments

## Capability comparison

| Capability | ChatGPT Work comparison | Elevate evidence | Gap / disposition |
| --- | --- | --- | --- |
| Execution environment | Reusable cloud environment with setup and repository context | `services/studio-browser/server.mjs` owns one configured repository root and terminal endpoints; `RealRepoWorkspace.tsx` consumes them | Expose the existing environment prominently. Multiple independently selected project environments are not established by this implementation. |
| Environment configuration | Setup and environment configuration belong to a real runtime | `DevContainerPanel.tsx` explicitly says it does not provision a runtime | Rename the misleading Containers registry entry to Runtime Configuration. |
| Editor and terminal beside chat | Execution tools remain accessible while discussing work | Repository was rendered through the generic capability preview | Mount the existing repository workspace natively beside chat, starting on Runtime + Terminal. No second runtime is introduced. |
| Visible browser work | Browser is an execution tool, distinct from inference | Direct CDP service, `CloudBrowserWorkspace.tsx`; live system-health says browser reachable | Browser-intent commands now reveal the browser panel. Other commands preserve the current panel. Plan remains the execution owner; mounting the panel does not independently replay the whole command. |
| Runtime readiness | Configuration is not functional acceptance | Existing health code accepted any HTTP-success browser response | Validate service identity, CDP engine, connected browser lifecycle, aggregate readiness and reported storage/recovery checks. Older serving revisions without recovery fields report recovery as unverified, not a browser outage. Functional browser and terminal acceptance remain separate. |
| Actionable errors | Failures must identify a repairable reason | Planner stored evaluation reasons but printed only failed verification | Stream redacted reasons and selected evidence for newly failed steps. |
| AI inference | Model access and execution environment are separate capabilities | Live system-health reports external providers configured; Elevate Owned AI and Internal Engineering fail | Restore a valid supported owned-inference endpoint/credential through existing configuration and verify a real response. Do not disguise external inference as owned inference. |
| Conversational routing | An explanation should not become an operational plan | `shouldOrchestrateMessage()` matches execution verbs anywhere, including prohibitions; a live saved inference-only prompt became a failed plan | Still unresolved. Requires conservative routing of negative instructions while preserving actual action requests. |
| Provider selection | Selected model must have a defined effect | Chat passes selected provider; `streamOrchestratedPlan()` has no provider field | Still unresolved: define and propagate selection through authorized execution without bypassing inference billing controls. |
| Course syllabus and preview | Uploaded material should drive saved work | Live Course Builder exposes PDF/DOCX/TXT extraction, selected Ultimate build, saved checkpoints and lesson preview | Present, not absent. End-to-end upload-to-published-course acceptance was not executed here. |
| Course processing | Active work should be visible with saved progress | Live selected cosmetology build reported running, lesson film render, teaching-photo activity; first lesson built with findings, second running | Preserve the existing build. No duplicate course, reset or render was started for this comparison. |
| Persistence | Reconnect should retain useful work | Encrypted workspace/browser checkpoints and explicit terminal resume exist in the service | Source implementation exists; whole-runtime replacement acceptance is still required. Running processes are not restored. |
| Mobile workspace | Panels, browser and composer must remain usable | Responsive split workspace and mobile safety stylesheet exist; uploaded screenshot still shows overlap and overflow | Full mobile visual acceptance remains outstanding; source presence is not proof of usability. |

## Authenticated production diagnostic

A separate authenticated browser-session health response identified serving browser commit `23b4762710a6d5704205825fa51fd003434c430f`, connected CDP and healthy readiness. All four browser session slots were occupied; admission was unavailable. That is a capacity state, not a browser outage. The revision did not report the newer terminal/browser/repository recovery fields, so those remain unverified.

The system-health response at `2026-10-18T11:14:04.450Z` returned eight OK checks and two failed checks:

- Elevate Owned AI: missing or retired-provider inference configuration.
- Internal Engineering: requires owned inference and GitHub authorization.

Studio Browser Runtime, external AI providers, GitHub configuration, Backblaze upload configuration and Google deployment identity were reported OK. These are diagnostic reports, not independent proof of every provider action or deployment permission.

## Verification

- Six focused unit/contract suites: 58 tests passed, including environment visibility, browser visibility, existing terminal authorization boundaries, readiness contract rejection, and credential redaction.
- Scoped Studio and Admin-wide TypeScript checks: passed.
- Changed production files ESLint: no errors; repository ignores test files for lint.
- Admin build and Admin-wide typecheck: see current task result; do not infer a passing production deployment from local checks.
- GitHub publication: the initial dry-run push was rejected by automatic approval review. The owner subsequently explicitly approved publication of the prepared changes. Publication and deployment outcomes must be reported separately; this report does not certify production acceptance.

## Remaining acceptance sequence

1. Publish reviewed source changes after explicit authorization and required repository checks.
2. Deploy only affected services through existing Google workflows, then verify the serving SHA and actual traffic.
3. Repair and verify the owned-inference connection; separately resolve advisory routing and provider-selection semantics.
4. Demonstrate editor/terminal/browser work, reconnect persistence and mobile usability in the deployed workspace.
5. Demonstrate a saved syllabus driving the existing course pipeline through playable media and approved LMS release.

Do not label this comparison as full ChatGPT parity or full production acceptance.
