# Dashboard CI root follow-up

Baseline: aa2130ad4806e5042867acd2208700e67fe42dd9. This audit does not equate cancelled or skipped workflows with passed checks.

## Verified failures and repairs

- LMS release run 41431672982, validation job 125231498549: `spawnSync gh ENOBUFS`. The successor inventory command buffered full metadata for 100 workflow runs. Filter by successor SHA at the API and project only the four fields used for duplicate suppression inside gh, before Node buffers stdout. Regression verifies the request/projection and prevents a second dispatch when the exact successor exists. Release SHA and main-only checks remain enforced.
- Enrollment job 125162538844 and public-device job 125183997793: Host Shop resume link hardcoded app origin while canonical site URLs resolve to lms. Use siteUrls.app for that link; preserve its onboarding destination and label.
- Authenticated responsive job 125183998645: invoiceAttested checkbox is 16 by 16 pixels. Give the required checkbox and its label explicit 44-pixel targets without changing invoice attestation or submission rules.
- Accessibility job 125162539106: serious color contrast failures show default dark text overriding explicit white/orange/slate text on dark cards and badges. Surface defaults now use zero-specificity :where selectors, so component text utilities win regardless of stylesheet import order. The standalone stylesheet successfully compiles through the real PostCSS/Tailwind pipeline. Focus outlines, reduced-motion behavior and high-contrast adaptations remain.
- Public runtime job 125183998645: password recovery form posts from the approved app alias, but POST compares Origin only against the configured canonical lms origin and returns 403. Preserve the request origin only when it is the configured origin or one of the two explicit production LMS origins. Match POST Origin to that exact request origin, retain safe reset-path/portal filtering and session-cookie handling, and reject cross-alias, unknown, missing and opaque origins. Regression covers alias success and cross-alias rejection without consuming tokens.

## Verification

Eight release resolver tests and 47 portal routing contract tests passed. Twenty-four focused unit tests passed; an additional four-suite run passed 19 tests, including the invoice target and application entry checks. Full LMS TypeScript passed. Changed production TypeScript/TSX ESLint and git diff whitespace checks passed. Standalone contrast stylesheet compilation passed.

Local Playwright verification could not run because Chromium is absent and the browser download failed in this environment. Live cross-device and per-person acceptance is still required; unit tests and compilation do not establish visual success.

## Deployment evidence inspected

The earlier 36e3ad2 repair has a successful exact LMS release workflow, run 41405187047. Live LMS health reports healthy/ready, passing Supabase auth/database checks, runtime SHA 63aca42be960e80aacd11a2517f6e3a15e78504e and revision elevate-lms-migration-00420-ghp. Git ancestry confirms that runtime contains 36e3ad2. Older CI/Integrity/Compliance runs for 36e3ad2 were cancelled and are not reported as passing.

At inspection, current-main CI and Compliance were queued, Integrity and the exact LMS image build were in progress. Their pending state is not a failure that can be cleared by changing a database flag. This follow-up repairs the observed failures while preserving the gates; its own rollout and final production acceptance must be checked separately.

No learner hours, approvals, payments, placements, enrollment statuses, accounts or credentials were changed.
