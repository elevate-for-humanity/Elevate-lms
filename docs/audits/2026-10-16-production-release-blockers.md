# Production release blocker audit — 2026-10-16

## Scope and evidence

Baseline: Marketing/Admin live health reported f9471ea1310fb835168e7ce28350b4c5180870a4 at approximately 20:54 UTC. LMS reported ad774208f3f247f9e21997026885636f56d089ae. Reviewed main: fab6a69122fb62b824cbf968792d80e14f7d4fb8. Runtime health establishes the responding revision, not every revision's traffic allocation.

Marketing workflow 38954288228, job 117153123075 failed before image build at scripts/verify-paris-release-source.mjs. Admin workflow 38954304141, job 117153178678 failed before image build in the sender tests. No new release was initiated for this repair.

## TaxSiteShell — all 187 lines compared

| Lines | Finding |
|---|---|
| 1–23 | Imports, navigation and style constants unchanged |
| 24–29 | Component and banner unchanged |
| 30 | tel:+13179999620 becomes tel:+14632401404 |
| 31–32 | Anchor styling unchanged |
| 33 | (317) 999-9620 becomes (463) 240-1404 |
| 34–132 | Header, logo, desktop/mobile navigation, children and footer unchanged |
| 133 | tel:+13179999620 becomes tel:+14632401404 |
| 134–135 | Anchor styling unchanged |
| 136 | (317) 999-9620 becomes (463) 240-1404 |
| 137–187 | Footer navigation, disclosure and component closure unchanged |

The manifest still accepted the deployed file digest. Its new digest is 30bd570692bb874af95beda59fcefbe5fa045de204e40b9ee3d4036e40a83d46. This is a manifest drift defect, not a JSX compilation error.

The full 34-entry local digest audit found two additional mismatches:

| File | Changed lines | Correction |
|---|---|---|
| tax-software/about/page.tsx | 59, 62 | Same telephone link/display replacement |
| tax-software/contact/page.tsx | 25, 26 | Same telephone link/display replacement |

Updated only those three reviewed local digests and documented their change reason. Preserved all sourceSha256 values and the immutable upstream commit da64dcbbab9347e9e94b6ec29668a946db6427e5.

## Root prevention

- The source verifier now checks every local manifest entry before remote requests and reports all failures together. It never updates expected digests automatically.
- All 34 upstream sources remain independently verified against their original hashes.
- Regression tests cover unchanged source provenance, multiple stale entries and missing files.
- The normal PR pre-deploy workflow checks local source integrity before dependency installation, catching drift before a merged release reaches an expensive image build.
- Marketing deployment keeps full immutable-source verification and runs verifier regressions.

## Admin sender test blocker

lib/phone/sending-number.ts now uses TWILIO_PHONE_NUMBER and constrains the database fallback to provider=twilio. The former test still supplied TELNYX_PHONE_NUMBER and expected a query without the provider filter. This caused three failures. Updated expectations to the active provider, renamed the test to test-phone-sending-number.mjs, and updated its workflow caller. Production selection logic was not weakened.

## Validation

- Full original source verifier after digest repair: 34/34 local and immutable upstream sources pass.
- Refactored source verifier: 34/34 local and immutable upstream sources pass.
- Source verifier, sender, main-release and Studio configuration regressions: 12 pass.
- Exact-candidate activation tests: 29 pass.
- Course Builder procurement architecture gate: pass after expanding the sparse local checkout; initial missing-file result was a local checkout limitation.
- Tax calculation failure handling and W-2 validation suites: pass after linking existing dependencies into the isolated checkout; initial missing TypeScript was a local dependency limitation.
- Changed workflow YAML parses; git diff --check passes.

## Remaining production verification

These fixes have not been deployed. A successful preflight is not proof that a complete deployment will succeed. Store public health timed out during this audit; its earlier Google deployment reported success. Studio and Course Builder serving images were not inventoried. The generic deploy-google-repaired.yml still contains a Telnyx-specific Admin post-deploy gate; this is separate from the active deploy-admin.yml pre-build failure repaired here and requires the active telephony integration's readiness contract. No complete platform-wide line-by-line pass is claimed.
