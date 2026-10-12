# Public website sizing, narration and store repair

## Changes

- Standardized oversized hero height settings in Marketing pages and shared templates to clamp(260px,42svh,480px). Source audit oversized findings fell from 49 to 7.
- Unified relevant homepage, host-shop directory and program image frames at 4:3. The large Cal's Kutz homepage promotion now has the same frame ratio. Portrait artwork and videos are contained rather than distorted.
- Corrected the mobile responsive guard that replaced h-full media sizing with auto sizing.
- Added homepage duplicate-image protection alongside existing shop deduplication. The live homepage observed at audit time already omitted Razor's Image and listed Kountry Kutz once; partner records were preserved.
- Connected verified host-shop video scripts to play/pause controls in both database-backed profiles and featured shop showcases. Salon Saloon's full shop-specific script remains visible with the video.
- Added global generation checks for late natural-voice requests and standalone playback; scrolling respects user-started audible media and narrated tours. Extended the narration text limit to avoid truncating the salon script.
- Reduced oversized barber tour frames and reorganized the host-shop directory into consistent responsive cards.
- Made job posting and the employer directory directly accessible from the Barber & Beauty Network. The existing secure job-posting route still enforces employer onboarding and approval.
- Put the store catalog ahead of longer explanatory sections; replaced decorative mock product previews with relevant photography and consistent 4:3 frames. Changed the store hero and HVAC lesson preview image. Removed the fixed-aspect mobile demo panel that could crop its own controls.
- Recorded supplier evidence and actual activation gaps in docs/store/STUDENT_KIT_SUPPLIERS_2026-10-12.md. No supplier credentials, payments or customer orders were created.

## Verification

- Marketing TypeScript: passed.
- LMS TypeScript: passed.
- Admin TypeScript: initial default-heap attempt ran out of memory; rerun with an 8192 MB heap passed.
- ESLint on changed production TS/TSX files: passed, no errors or warnings.
- Six focused test files: 23 tests passed, covering exclusive natural audio, pending audio cancellation, video/page narration ownership, shop-tour play/pause/resume, shop photo deduplication and media dimensions.
- Final Marketing production build: passed. Existing Supabase Edge Runtime Node API warnings remain.
- Public media/navigation source audit: passed its deterministic blocking checks; review warnings remain.
- Image inventory: 425 references initially; no missing/corrupt referenced local images. Thirty groups of identical image binaries were found; these are documented, not all removed. Identical bytes with different program labels require editorial review, not blind file deletion.
- git diff --check: passed.

## Verification limits and remaining work

The 801-page public-page source audit is not a rendered visual review of every route. The broader audit still reports 211 layout/text pattern findings and 144 pages without canonical hero markers; pattern findings require page-specific review. Seven large minimum-height findings remain and have not been proven to be defects. No claim is made that every card on all 801 pages is identical or that every text-heavy page has been redesigned.

No local mobile/desktop browser preview was available through the required Sites browser workflow. Live homepage and Salon Saloon profile were inspected before changes. Their new rendered appearance and production voice endpoint still need post-deployment verification.

Admin/LMS production builds and the entire repository test suite were not completed in this session. The existing natural-voice pacing test has two baseline expectation mismatches against unchanged pacing constants; focused exclusivity tests pass. Google Cloud publication must be verified from the current release workflow and live SHA; source synchronization alone is not a deployment claim.

Supplier signup and kit fulfillment remain blocked. The repository contained research checklists with no completed supplier account mapping. Current direction is free signup/no negotiation, Elevate prices, supplier-direct student shipping. Ready-made professional kits exist, but no supplier meeting every criterion was fully activated. Browser authentication guidance requires user completion of new-account signup. CJdropshipping additionally returned a persistent human-verification screen in this browser. No paid supplier membership or opening inventory purchase was accepted.
