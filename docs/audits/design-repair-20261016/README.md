# Architectural design repair — acceptance record

Status: **not ready for merge or deployment**. This is an evidence record, not a claim that all 195 issues were defects or that the entire platform has been visually certified.

## Source and finding coverage

- Existing branch: `repair/full-platform-design-architecture-20261016`.
- Compared with main `c413260b05c76fe3479564f7ad5f6c4848938bf8`; main's Twilio credential fix was merged into this branch without changing it.
- The historical report saved only its top 60 files. Reconstructing active source at `565cb8228d` reproduces **195** layout/text findings. The companion JSON/Markdown preserve an individual disposition and surrounding source for every finding.
- Fresh pre-repair audit: 184 layout/text candidates. Current audit: 142 candidates, all overlay/gradient or decorative-alt review items; no opaque light-surface contrast or image-sizing/preload findings remain in the syntax-aware scan.
- The 147 possible noncanonical Marketing heroes remain a manual-review inventory. A hero-like name or custom layout alone is not evidence of a defect.

## Repairs and evidence

| Area | Before | Implementation | Evidence / limitation |
|---|---|---|---|
| Global CSS | Unlayered typography, container, mobile and brand patches overrode component designs | Removed broad grid, color, section, hero and sizing overrides; base defaults allow component utilities and inherited dark-surface foregrounds | All three service stylesheets changed; source verification and builds; rendered review pending |
| Admin | Pale labels/status text; wide record grids compressed on phones | Component neutral-600 foregrounds; scrollable shared card; minimum-width career-course and verification lists | TypeScript/lint; authenticated visual checks require an account |
| Studio | Chat preview callback discarded; fixed workspace cap consumed by controls/composer | Forwarded returned preview URL to frame; expanded workspace; labeled preview input/device controls; exposed selected tool state | Preview navigation regression test; existing viewport, file and repository tests |
| Media text | Image/video labels lacked predictable backing | Readable backings in shared pathways, archetype, mobile player and staff/founder sections | Source checks; approved primary photographs preserved; see media reconciliation |
| Audit correctness | Regex crossed JSX elements, treated hover/placeholder/translucent colors as base colors, and flagged sized images based on prop order | Parse individual JSX elements; retain manual overlay review inventory | Seven focused Node tests demonstrate retained real-defect detection |
| Duplicate audit | SEO metadata and JSON-LD counted as extra visible pictures | Exclude only exported Next metadata and the verified JSON-LD component; retain rendered JSX/data checks | 1,598 active routes: zero blocking route-owned/hero duplicates |
| Program image audit | Card and hero for the same program counted as unrelated assignments | Parse assignment owners and preserve rejection across separate program entries | Cross-program reuse remains a failure; no assets replaced |
| Responsive testing | Requested width coverage not isolated in a repeatable check | Added 320/375/390/768/1024/1440px read-only browser tests and CI verification workflow with screenshots | Local Chromium download failed. Initial GitHub browser run executed all 42 cases: 30 passed, 12 exposed shared-public assets not being served in Next dev; startup repair applied and remote rerun required. |

## Executed checks

- `pnpm typecheck`: passed Marketing, Admin, LMS before final Studio changes; final rerun also passed.
- `pnpm lint`: passed before final Studio changes; final rerun also passed.
- Seven focused existing unit-test files: **48 tests passed**.
- Additional preview navigation behavior: **1 test passed**.
- Syntax-aware audit regressions: **7 tests passed**.
- Canonical hero audit: **passed**, 186 normalized entries, 16 dedicated video assignments, 40 internal program contracts.
- Platform duplicate-media audit: **passed**, 1,598 routes.
- Marketing image audit: no missing or corrupt local images; reuse/alias advisories remain.
- Design Enforcer: zero critical / strict findings; reporting advisories remain.
- Image Contract: zero critical, 104 strict and 227 reporting advisories. Do not interpret the canonical hero pass as resolution of these separate advisories.
- Application-route, public-claims, enrollment-architecture, Studio-architecture, credential-scan, recovery-hardening and platform-surface checks passed.
- Local browser execution: failed before rendering because Chromium was absent. Browser installation failed with truncated ZIP output.
- Live homepage inspected independently at the cloud browser's available 500px viewport: no horizontal overflow or broken loaded images. That inspection concerns existing production, **not this branch**.

## Unresolved acceptance items

1. Cross-program registry image reuse: **corrected**. Eight unique optimized illustrative training assets plus inspected existing photographs replace conflicting program assignments. Assets are 73–106 KB each. See `media-reconciliation.json`.
2. Homepage uniqueness: **corrected** after the user's follow-up authorized resolving these conflicts. Approved photographs remain in primary placements; repeated secondary occurrences use distinct existing assets. Homepage and platform media audits pass.
3. Rendered review of remaining overlays/custom heroes and all six viewport sizes is outstanding. New CI can run the public read-only tests. Authenticated Admin/LMS/Studio review and actual application submission require controlled test identities and a test-data cleanup contract; no production applications were submitted.
4. Required remote GitHub checks must pass on the final head before readiness. Historical main successes do not certify this branch.
5. Production merge/deployment is not authorized by this design delivery step and has not been performed. No Google Cloud build/execution or Northflank deployment was triggered. No Course Builder generation engine, worker or queue was changed. Approved homepage photographs are unchanged.

See `finding-dispositions.json` for the complete 195-row evidence record. Items marked rendered verification outstanding remain open.

## Follow-up verification

All three sequential production builds and final per-app TypeScript checks completed successfully. Repository lint also passed. Public-page browser execution on GitHub exposed missing app-local shared media (404 responses in traces); the development startup now mirrors shared media without replacing local overrides. The five requested checks were separately inspected; see `requested-check-review.md`. The final head still needs remote checks and rendered acceptance.
