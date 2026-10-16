# Architectural design repair — acceptance record

**Deployment held.** This record does not certify all 195 findings as resolved. Authenticated and dynamic-state reviews remain open. The single existing PR is #1905; no merge or deployment was performed.

## Preserved work and architecture

The existing branch `repair/full-platform-design-architecture-20261016` includes main `35abd5b5db43f1749b3ad2a6d1c09cb90d7fa0fa`, preserving the preceding Twilio credential, microphone readiness, public contact and voicemail-ingestion fixes and the approved carrier migration. Valid earlier repairs were retained. Course Builder engines, workers and queues are unchanged.

- Marketing/Admin/LMS global patches no longer force component grids, colors, section backgrounds or typography. Shared contrast defaults now use a low-priority native cascade layer; a white page ancestor cannot recolor nested dark heroes or light controls. Accessibility focus, minimum target sizes and reduced-motion behavior remain.
- Studio chat-provided preview URLs reach the live frame; workspace height accommodates its controls/composer; preview/device controls have accessible labels and states. Existing services and AI operations remain connected through their original interfaces.
- Admin record lists scroll locally, with readable labels and shared card sizing. Authorization and database queries are unchanged.
- Public repairs cover mobile catalog titles/controls, breadcrumbs, statistics clipping, Connect form labels/contrast and explicit directory failure rendering. Header and drawer share the 1180px cutoff; open menus release scroll lock when resizing to desktop. Navigation is checked by real browser interaction, including Escape and focus restoration.
- Approved homepage photographs remain. Earlier media reconciliation uses eight distinct optimized illustrative assets and inspected existing program assets. The Founder portrait now uses the existing canonical organization profile asset, replacing an incorrectly assigned group-training photo; no new portrait was generated.

## Media policy

All 104 strict findings from the preceding PR head have individual dispositions in `image-policy-dispositions.json`. Eighty-four image instances now use an inlined 8×8 loading backdrop exported from the existing blur-placeholder module. Native video-poster and optional intrinsic-size logo exceptions have explicit rationales. Image Contract reports **0 critical / 0 strict**, with 227 existing reporting advisories.

An AST comparison verified original image source, alt, crop, dimensions, responsive sizing and loading priority during the backdrop repair. The later Founder source correction is a deliberate exception using `organization.founder.imagePath`; homepage image assignments are unchanged.

Canonical hero, homepage uniqueness, media integrity and the 1,598-route platform duplicate audit pass. Shared-component reuse and binary-alias advisories remain separate from blocking cross-program/route duplication. Legitimate gradients and backed player controls were retained.

## Finding traceability

The exact baseline `565cb8228d` reproduces the original 195 findings. Each original file/line, surrounding source, classification and disposition remains in the companion JSON/Markdown. The browser inventory rejects a missing or duplicate original record. Thirty-eight findings link to rendered public-route evidence.

The updated summary records 25 additional source/render-supported false positives, five corrected/render-verified findings, 19 source-verified findings and four source-verified/previously-corrected findings. Still open: 104 source-reviewed entries, 37 source-corrected entries awaiting rendered verification, and one partially verified image-overlay review. These are not all confirmed defects. See `finding-dispositions.json`; no blanket closure or suppression was applied.

`additional-confirmed-findings.json` records twelve further defect groups found through rendering and interaction, including the shared contrast and tablet navigation failures.

## Verification

- Frozen install: **passed with pnpm 10.28.2**; dependency versions and lockfile unchanged.
- Marketing/Admin/LMS TypeScript and repository lint: passed. Final production-build and new-head workflow results are recorded in the PR verification section. The local Marketing production build passed; the scratch checkout was externally removed during Admin trace collection, interrupting the local build sequence. Clean GitHub container builds provide the remaining build evidence.
- Focused unit verification: the original 49 tests across eight files passed; the later five-file fixture/readiness regression run passed all 11 tests; seven audit regression tests passed.
- Browser coverage: 126 unique cases in bounded batches — seven representative routes across eight widths, plus 34 original-finding public routes at mobile/desktop and two shared-surface regressions. Required widths 320/375/390/768/1024/1440px and header boundaries 1179/1180px are covered. Targeted reruns verify the subsequent contrast, clipping and menu lifecycle corrections.
- Computed normal-text contrast assertions require at least 4.5:1 for the affected heroes, Community control, Pricing link and Connect input. Nested dark/light panels are tested through the actual compiled stylesheet.
- Image tests scroll through each visible lazy image and require a decoded asset; pending requests cannot count as passes. Carousel selection, target bounds, menu opening, Escape/focus and desktop resize cleanup are asserted.
- Hero/media/public-claims/application-route/enrollment/Studio architecture, credential, recovery-hardening and reliability guards were checked. No required workflow was disabled or weakened. Design Repair Verification now reruns the expanded public inventory in separate mobile/desktop steps and preserves distinct evidence directories.

See `browser-verification-summary.json` and `public-render-results.json`. The first large public run exposed an explicit directory failure and then lost its local dev server; smaller fresh-server batches passed. The authenticated orientation route is deferred by its actual enrollment requirement, rather than bypassed. Browser runtime packages are temporary and outside project dependencies. Only public Supabase client configuration was used locally.

## Visual evidence

The images below are actual local working-tree renders during repair, not production deployment certification.

![Shared contrast before and after](evidence/shared-contrast-before-after.jpg)

![Canonical Founder portrait correction](evidence/founder-portrait-before-after.jpg)

## Remaining acceptance boundaries

A controlled authenticated Admin/LMS/Studio or enrolled-apprentice test session was not available in this runner. The repository's portal suite requires role-specific `E2E_*_EMAIL`/`E2E_*_PASSWORD` pairs; none of the Admin, learner, apprentice, Host Shop or Program Holder pairs were available. Private records, parameterized record states, all player/overlay states and actual application submission have not been certified. Local catalog timeouts also mean a geometry pass is not live database validation. All 147 possible custom-hero candidates remain an architectural review inventory, not 147 proven defects or an excuse to replace legitimate gradients.

The requested five checks passed on published head `8c5f47cbe2e19e314271c9ecf5a9f55313dc0f61`; their definitions, steps and decoded logs were inspected. The continuation must pass required checks on its new published head; the PR contains those final links. Do not infer production readiness solely from green regression gates.

No Northflank operation, Cloud Run deployment, Google Cloud build or course execution was initiated by this repair. PR automation was inspected: Marketing Staging Gate's misleading job name performs a GitHub-runner Docker build/smoke test, not a cloud deployment; deployment/recovery chains depend on main releases or explicit dispatch. Auto-merge remains off. Production revision/SHA verification belongs after an authorized merge and deployment.

## Main reconciliation and CI error preservation

Main advanced by two phone fixes during verification. GitHub’s merge checkout exposed three `preserve-caught-error` lint failures in the new microphone helper. The repair preserves the existing user-facing messages and capture cleanup while attaching the original error as `cause`. Its five existing microphone tests pass, with the three translated-error cases now asserting cause identity. The main updates were merged without conflicts.

The new main readiness requirement also exposed missing `navigator.mediaDevices` in the SIP browser-test fixture. The fixture now supplies a live audio track, checks capture constraints and release, and verifies blocked capture prevents SIP construction. All 114 tests in the phone workflow’s 17-file Vitest command pass locally, plus the five direct microphone tests. Production capture validation remains enabled.

## Cold-render and full-suite follow-up

On head `fe52e2e58d67ea63448cc70a1e97378a45e69acb`, 54/56 primary browser cases passed. The first student-entry render exposed an existing streamed server redirect to `/apply/student/interview`; the test now waits for that exact canonical destination and asserts the PARIS workspace heading. No redirect or application logic changed. A desktop catalog activation exposed a pre-hydration carousel control; ARC-11 adds readiness at the component source instead of retrying clicks or adding sleeps. Final-head results are linked from the PR.

The local Marketing, Admin and LMS production builds completed, including generated-route type checks, after restoring the removed scratch checkout. The latest carousel readiness change is rechecked separately and in the final-head Marketing build.

The final full-suite CI advisory log on `fe52e2e` reports **3,997 passed / 9 failed / 8 skipped** across 604 files. This is not a clean whole-suite pass even though the existing CI required gate is green. Four billing/MOU contract failures were independently reproduced on unmodified main `8e9d4a67a0` (four failures, 14 passes in the five-file comparison). Four audio tests fail only in the hosted runner with `object.stream is not a function`; they pass in that local main comparison. One Admin grid contract cannot start because the hosted runner lacks `rg`. These advisory limitations remain recorded; no test was disabled or turned into success by this repair, and billing/authorization behavior is preserved.

The production-mode Compliance run on `fe52e2e` found four shared label contrast defects across Business, HVAC, CDL, Funding and Check Eligibility. ARC-12 repairs their component colors; no Axe rule or severity threshold changed. The scan now requires a successful HTTP response and visible main/heading. The Admin mobile-grid source contract uses Node filesystem traversal with the same matching/assertion rules, removing the missing-`rg` failure. Remaining full-suite advisory results are recorded in the PR. The two previously failing primary browser routes pass 12 consecutive targeted local cases after the redirect/readiness correction.

The nine advisory failures were investigated rather than inferred from the green gate. The four audio fixtures now use native fetch response bodies with an audio content type, avoiding the hosted Node 22/jsdom Blob mismatch while retaining playback/mute/ownership assertions. The two MOU tests now verify the existing 14-section canonical document, its protected-information/noncompetition limitation and final signature section. The grid test retains its matching assertions with Node traversal. These five updated test files (including hydration) pass all 11 local cases. The two existing learner-billing contract mismatches remain separate from this design repair; no billing or authorization implementation was changed to satisfy those assertions.

After the last source corrections, the application/catalog routes passed 12 repeated local browser cases and all five affected pages passed ten desktop/Android Axe cases with successful-response and page-content guards. Source, loading/crop choices and homepage photo assignments remain preserved.

## Latest-main carrier reconciliation

Main advanced again through PR #1902 to `35abd5b5db43f1749b3ad2a6d1c09cb90d7fa0fa`. Its automatic merge checkout exposed `TS2339` in the LMS: the credential type was Asterisk-only, but an obsolete provider branch still read `credential.token` and loaded the retired browser SDK. That leftover branch is removed; unsupported runtime credentials now fail explicitly before asking for microphone access. Current SIP/PSTN routing, microphone verification and authorization are preserved. All 115 phone-contract tests, all three application TypeScript checks and repository lint pass locally.

The full-suite hosted run on `b235dcf` confirms the seven compatibility/MOU fixes: **4,006 passed / 2 failed / 8 skipped**. Only the two billing contract mismatches remain, independently reproduced on unmodified main. No advisory test was disabled. Final required workflow results for the subsequent head are recorded in the PR.
