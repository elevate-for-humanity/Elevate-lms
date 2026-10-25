# Responsive layout review — 25 October 2026

Proposed changes only. No main merge, Google deployment, production mutation, authentication change, or audience change is authorized by this review.

Source baseline: `577e75d36ed51b5fbfd12d2b7039d1c59ee203ba`.

## Repairs

- Program Integrity: wrap the title/badges and action row on phones; preserve the refresh handler/loading state, add a 44×44 minimum target and keyboard focus, and keep Show all usable.
- Program Holder reports: retain the existing fields, validation and JSON payload; enlarge six checkboxes to 32×32 inside clickable labels at least 44px high.
- Studio: put communication notices inside Studio navigation instead of above the full-height workspace. Standalone browser access has a collapsible messages section. Remove document bottom padding from the nested Studio main elements; the composer retains its own safe-area padding.
- Public program pages: use a single facts/metrics column below 390px. The live HVAC page's 320px layout had body scrollWidth 330px from text overflowing the two-column grid.
- Host-shop showcase: wrap slide controls and place the visual dots inside 44×44 buttons. The live apprenticeship page clipped slide controls at 320px and 390px.

## Current validation

- 96 isolated browser cases passed: Chromium 141 and WebKit 26.5 at 320×740, 390×844, 412×915, 768×1024, 844×390 and 1440×900.
- Views: Admin navigation/Program Integrity, Program Holder reports, Studio shell/navigation/resizable workspace, public program facts/host-shop carousel, and the shared Learner/Apprentice/Host Shop/Program Holder shells.
- Assertions include page overflow, mobile control dimensions, refresh disabled/loading behavior, 8/12-row expansion, form payload and checklist interaction, Studio viewport coverage, draft preservation across Chat/Work, notification navigation access, drawer open/close, and access to the final carousel slide.
- Original-source controls reproduced undersized Admin refresh and 16×16 report checkboxes; the original desktop Studio workspace measured 832px inside a 900px viewport. The Chromium public fixture reproduced 330px body width at 320px. The patched fixtures pass.
- Three outer-preview checks passed at 320px, 390px and 1440px, including view, width, revision and role switching.
- Nine existing focused unit tests passed (Studio viewport, resizable workspace and program-integrity contract). No production test assertions were removed or relaxed.
- Live anonymous public audit: six routes, each at 320px, 390px, 768px and 1440px, all HTTP 200. Routes: `/`, `/programs`, `/programs/hvac-technician`, `/funding`, `/apply/student`, `/apprenticeships`. The two issues above were found; the remaining measured layouts had no page overflow or clipped controls.
- A signed-in, read-only desktop Admin observation found no overflow at 1363px and a 44×44 live refresh target. It does not establish phone acceptance of this proposed commit.

## Preview boundaries and release gaps

The separate owner-private Sites preview uses exact source copies of the affected UI components and production Tailwind theme/global styles. Program fact JSX is extracted from ProgramDetailPage. Notifications, authentication, profile imagery, AI chat, browser contents, and remote tool services are isolated sample substitutes. Live learner records and credentials are not copied. This is component/shell layout validation, not a complete deployed LMS clone or proof of live service readiness.

Full `pnpm typecheck`, `pnpm lint`, Marketing build, Admin build and LMS build were attempted but stopped in dependency bootstrap because this sparse checkout does not contain the linked `packages/bounded-braces` workspace package. They did not reach compilation; this is an environment limitation, not evidence of a new product build regression. Protected CI must run against the complete repository before any release.

The authenticated nine-role production suite was not rerun and production was not changed. Issue #791's missing Studio browser stream and zero-shell/transient Program Holder evidence remain separate; no claim is made that those are repaired. Native iOS/Android installation, hardware keyboards/software keyboards on real devices, and full authenticated course/email/onboarding flows remain release validation. PR #2127's refresh minimum-target change is incorporated here with additional wrapping fixes; it is not independently certified for production by this preview.

Private preview project: `appgprj_6ade3173119c8191a813f3d43357631c`.

## CI runner compatibility

The initial PR Design Repair and Compliance browser jobs stopped at browser installation: `Playwright does not support chromium on ubuntu26.04-x64`. No responsive/accessibility/enrollment assertions ran in those failed jobs. Pin only responsive-marketing, e2e-enrollment and accessibility to ubuntu-24.04; preserve every assertion, test command, dependency version and permission. The updated jobs require a fresh run before release. Observed runs: 40213559735 and 40213559796.
