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
- Image inventory: 425 references initially; no missing referenced local images detected by the initial size/signature scan. Follow-up full decoding identified two damaged legacy files: razors-image-storefront.webp and microsoft-logo.png. Razor gallery URLs now resolve to its verified 2026 storefront photo; Microsoft display components now use a valid SVG. Thirty groups of identical image binaries were found; these are documented, not all removed. Identical bytes with different program labels require editorial review, not blind file deletion.
- git diff --check: passed.

## Verification limits and remaining work

The 801-page public-page source audit is not a rendered visual review of every route. The broader audit still reports 211 layout/text pattern findings and 144 pages without canonical hero markers; pattern findings require page-specific review. Seven large minimum-height findings remain and have not been proven to be defects. No claim is made that every card on all 801 pages is identical or that every text-heavy page has been redesigned.

No local mobile/desktop browser preview was available through the required Sites browser workflow. Live homepage and Salon Saloon profile were inspected before changes. The first release was subsequently inspected live: homepage omitted Razor, listed Kountry once, and had no horizontal overflow at 1363px. Salon Saloon displayed its actual full script and a muted playable video. Follow-up equal homepage cards and gallery containment address sizing found during that inspection. Production synthesized audio and mobile rendering still need direct verification.

Admin/LMS production builds and the entire repository test suite were not completed in this session. The existing natural-voice pacing test has two baseline expectation mismatches against unchanged pacing constants; focused exclusivity tests pass. Google Cloud publication must be verified from the current release workflow and live SHA; source synchronization alone is not a deployment claim.

Supplier signup and kit fulfillment remain blocked. The repository contained research checklists with no completed supplier account mapping. Current direction is free signup/no negotiation, Elevate prices, supplier-direct student shipping. Ready-made professional kits exist, but no supplier meeting every criterion was fully activated. Browser authentication guidance requires user completion of new-account signup. CJdropshipping additionally returned a persistent human-verification screen in this browser. No paid supplier membership or opening inventory purchase was accepted.

## Host categorization follow-up

- All pathway host sections now use the canonical live directory, including approved records that lacked static featured cards. Programme aliases normalize nail_technician and uppercase barber labels.
- Primary barber/salon categories stay separate; independently approved nails/esthetics remain eligible. Unknown occupation records are not assigned an invented pathway. Directory failures are surfaced rather than rendered as false empty categories.
- Prestige Elevation's approved record now has a linked promotional profile with a photograph from its published Booksy portfolio. Source: https://booksy.com/en-us/1766191_prestige-elevation-barber-and-beauty-institute_barber-shop_19577_indianapolis .
- Current repository media is prioritized and curated before choosing directory photos. All four trade filters remain available; empty categories have visual recruitment cards and a free Host Shop application.
- Esthetics has an explicitly illustrative generated recruitment image, not a purported real shop. Asset: public/images/programs/esthetician-host-recruitment-2026.webp. Prompt described an esthetics instructor mentoring adult apprentices in a bright skincare studio, with no business identity or lettering.
- Programme enrollment CTAs and the main Host Shop recruitment CTA include relevant photography. Approved profiles without portfolios use a clearly labeled training illustration.
- Seven combined focused files: 28 tests passed, including programme normalization, strict separation, unknown occupations, merged approvals, stable links, query failures, audio ownership, tour resume and looping until narration completes.
- First repair release 941cf96fd63bffed15b8d4c7c635924218ffd877 passed Google Marketing deployment and was verified live by the workflow. This follow-up requires its own deployment verification.

- Live review showed Cal’s Kutz was still larger than adjacent cards. Follow-up puts four shops and four recruitment/pathway cards into the same eight-card grid with equal row heights and 4:3 photos.
- Carousel photos are positioned inside their aspect-ratio container, preventing intrinsic portrait height from expanding the page. Profile copy is aligned at the top.
- Short muted tour videos repeat while their longer shop script plays; narration completion pauses the video. Visible status distinguishes loading, playing and paused audio.

## Owner corrections and self-service facts

- Owner clarification October 12: apprenticeship programmes are self-pay only. Removed third-party funding selections and claims from beauty apprenticeship data, the canonical funding resolver, programme facts, tuition listings, apprenticeship overview, employer recruitment, eligibility cards, application notice, and barber application choices. Retained self-pay installments and provider-approved financing as repayment options.
- Updated general footer and homepage disclosure to explicitly separate apprenticeship self-pay from other evidenced workforce programmes. Removed the barber testimonial that claimed WIOA tuition support, rather than altering an attributed quote.
- Added a responsive, image-backed FAQ section through the shared Marketing footer. Questions vary by programme/apprenticeship, Host Shop/network, employer/jobs, store, funding, and general pages; each includes a self-service next-step link. Existing detailed occupation FAQs remain available. No invented schedule, tuition amount or kit availability is published in the shared answers.
- Store cards now have distinct offer-specific repository photographs for the principal business, AI, education and workforce products instead of one repeated category picture. Photographs illustrate their subject and do not claim to be screenshots of the software.
- Final Marketing build with the shared FAQ and owner self-pay correction: passed. Combined repair tests: 60 passed across 14 files. Changed-file ESLint and the public media/navigation blocking checks passed. Marketing and LMS TypeScript passed. The DOL information page now lists canonical registered occupations rather than unrelated rows from the funding_sources table.
- Admin production build hit the default V8 heap limit; a larger-heap retry was killed by the environment. Admin build validation remains incomplete. Shared Marketing and LMS typechecks passed before the owner correction.
