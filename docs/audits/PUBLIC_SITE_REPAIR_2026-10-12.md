# Public website sizing, narration and store repair

## Changes

- Standardized oversized hero height settings in Marketing pages and shared templates to clamp(260px,42svh,480px). Source audit oversized findings fell from 49 to 7.
- Unified relevant homepage, host-shop directory and program image frames at 4:3. The large Cal's Kutz homepage promotion now has the same frame ratio. Portrait artwork and videos are contained rather than distorted.
- Corrected the mobile responsive guard that replaced h-full media sizing with auto sizing.
- Added homepage duplicate-image protection alongside existing shop deduplication. The live homepage observed at audit time listed Kountry Kutz once; partner records were preserved.
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
- Image inventory: 425 references initially; no missing referenced local images detected by the initial size/signature scan. Follow-up decoding identified a damaged legacy microsoft-logo.png; Microsoft display components now use a valid SVG. Thirty groups of identical image binaries were found; these are documented, not all removed. Identical bytes with different program labels require editorial review, not blind file deletion.
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

## Final requirements and application consistency

- Confirmed release f6d96219f502910c7518422fa47a9cf686e275de live through /api/version and the public nail programme page. Shared page FAQs, self-pay notices and occupation FAQs are visible. Barber lists six primary-barber shops, cosmetology four primary-salon shops, and nails the approved Style and Scissor location.
- Corrected remaining raw hero scripts: barber 14 competencies/260 RTI hours; esthetics 20 competencies/300 RTI hours; nails 19 competencies/210 RTI hours; cosmetology hybrid 2,000–2,500-hour term/154 RTI hours. Removed day-one wage guarantees, the unsupported esthetics 1,500-hour claim, and the fixed nail 2,000-hour completion claim. Updated programme sound controls use the corrected transcript instead of native video sound.
- Programme-specific FAQ completion answers now derive from the registered-program contract. The cosmetology FAQ remains backed by its detailed hybrid-standard authority section.
- Canonical apprenticeship financial records are self-pay only. The conventional application and PARIS guided interview no longer offer funded choices for apprenticeship applicants. A saved funded draft must review self-pay again. Public application submission rejects unsupported apprenticeship funding even if a client sends a prior-approval acknowledgement; historical enrolment records are not rewritten.
- Removed the stale $600 cosmetology deposit claim without changing configured tuition, Stripe prices, or checkout amounts. Applicants review the current deposit and repayment terms in enrollment.
- Extended raster audit: 941 files decoded; 44 damaged legacy files recorded in DECODED_IMAGE_AUDIT_2026-10-12.json. Existing canonical aliases account for many of these paths. Several portrait references belong to unused legacy testimonial components; unknown real-person photos were not fabricated. Source corruption is distinguished from actual live delivery failure.
- Final combined suite: 89 tests passed across 20 files, covering the application policy, interview drafts, registered hero requirements, FAQs, host categories, media and narration. Marketing TypeScript and changed-file ESLint passed; the final Marketing build passed. The earlier 60-test repair suite remains recorded above.

## Deployed hero data parity

Post-deployment inspection found that the Docker image explicitly copies apps/marketing/public/data/hero-banners.json over the canonical public/data copy. Updating only the canonical file left the live nail hero on old text even though the new FAQ was correct. Both tracked JSON files now match. A unit regression checks parsed parity, and the existing hero-banner audit checks byte parity. The final hero correction must be verified after this data-parity release.

## Compact store demos and media follow-up

- Repair 40891a091b093d8c7de65d94eb3ea7c6e62b9a15 was verified live in Google Marketing revision elevate-marketing-migration-r40891a09-38303127074-1, with 100% traffic and matching /api/version.
- Move generic heading, link and button defaults into Tailwind’s base layer so explicit component sizes and CTA colors apply consistently. Remove the mobile rule that added 40px above and below every main section.
- Store role cards and demo landing previews use the same clearly labeled public sample records as the existing demos. Illustrative repository photos frame the landing pages; previews are rendered UI, not claimed product screenshots.
- Collapse the demo advisor until requested, load it lazily, disable its automatic voice greeting, and retain compact opt-in step narration. No customer, enrollment, order or payment records are changed.
- Normalize first-party gallery URLs to local paths before deduplication, avoiding duplicate absolute/path entries. The deployment globally disables the Next image optimizer; subsequent follow-up uses precompressed assets and defers distant slideshow images instead. Slideshow controls retain 44px tap targets without oversized default button padding.
- B-52s has a second portfolio slide: an AI-enhanced crop of its published interior, with visible disclosure. It does not claim to be an unedited new shop photo.
- Supplier research is documented separately. Supplier accounts and student-kit fulfillment are not activated.
- This follow-up requires its own production release and browser verification.
- Final follow-up checks: 72 tests passed across 18 files; Marketing TypeScript and changed-code ESLint passed. CSS layer behavior is checked with PostCSS; the full Marketing production build passed, including static generation.

### Browser audit findings retained for follow-up

- Live cosmetology page: five approved salons are listed and linked, including J Noelle Collective. Salon Saloon opens its own profile and displays a shop-specific written tour and service links.
- Browser review found shared program pages labeling the curriculum/RTI subtotal as total training hours and retaining inconsistent application/payment promises. The subsequent content follow-up labels related instruction separately, removes the apprenticeship no-payment promise, and clarifies self-pay enrollment review. Deployment verification remains required.
- Physical-phone visual review and supplier account activation remain unverified.

## Program facts and job-board follow-up

- Shared registered apprenticeship pages take required RTI hours from registered-program-contract rather than summing classroom/lab/course-support hours, and distinguish related instruction from workplace training, show self-pay choices without the employer-sponsorship selection, and describe inquiry, application review and confirmed enrollment separately. Tuition, checkout prices, invoices and saved enrollment records are unchanged.
- Job board and employer posting entry now have contained hero photographs and visible next-step links. The board empty state links to posting an opening and the employer directory instead of looping to itself or claiming government listings that are not shown.
- The public postings component distinguishes an unavailable query from a successful empty result. The data helper exposes query errors only when explicitly requested; other existing callers keep their original empty fallback. This is read-only; no jobs were created or submitted.
- Focused follow-up validation: 44 tests passed across nine files; changed-code lint passed. The final follow-up suite now has 71 passing tests across 12 files, including deferred gallery downloads and real image decoding. Registered-program architecture and the strict duplicate-picture audit pass. Final Marketing typecheck and production build passed, including all 35 static pages. Production acceptance is verified by the release workflow after publication.

- Visual release f182f0ba3245c0862dfd8cad115c705c83f26db6 was verified live in Google revision elevate-marketing-migration-rf182f0ba-38308920003-1. Ready=true, 100% traffic, matching public /api/version and homepage HTTP 200. Browser inspection confirmed five barber-approved shop cards, loaded 160px image frames, working shop destinations, the upper Kountry Kutz tour and B-52s two-slide gallery.
- Repository gates identified a direct standards import and shared store/demo hero. Follow-up uses registered-program-contract for the same published barber hours and gives the store a distinct AI-generated illustrative hero. Both gates pass locally, including 1,590 routes in the duplicate audit.
- B-52s interior is precompressed from 2,715,137-byte PNG to 338,534-byte WebP at the same 1448×1086 dimensions. Slideshow rendering defers distant images and retains the decoded current image during transitions. No global image-optimizer configuration is changed.

### Store hero provenance

Asset: public/images/store/barber-beauty-platform-2026.webp (1536×1024, 207,372 bytes), created with the built-in image-generation tool and encoded as WebP for delivery. This is explicitly illustrative imagery; it is not a real host shop or identifiable enrolled students.

Prompt: Use case: photorealistic-natural. Asset type: unique website store hero for Elevate for Humanity, landscape 3:2. Create a polished, bright editorial-style illustration of three diverse young adult barber and beauty professionals collaborating around a laptop at a tidy business desk inside a modern training studio. One barber wears a clean charcoal apron; a cosmetology professional and a business coordinator join the discussion. Natural confident smiles, professional clothing, realistic skin and hands. All three complete heads and upper bodies comfortably within the frame with generous margins, no cropped faces. Laptop faces mostly away from camera, no invented interface, no readable screen text. A small neat tool case and a notebook give a professional learning context. Warm daylight, clean neutral background, subtle red and navy accents, inviting and credible, clear photographic detail, no logos, signs, slogans, watermark, or product-brand packaging. This will be explicitly described as illustrative imagery, not an actual host shop or real students.
- Additional live browser checks: nail page links only the nail-approved Style and Scissor profile; esthetics shows recruitment without borrowing barber or cosmetology shop listings. Neither page overflowed the reviewed desktop viewport. Store role selectors and student demo links work; requested demo narration enters Stop state and returns to Hear Demo when stopped. Physical-phone review remains unverified.

## Narration stop-control follow-up

Visual/facts release 7115721d06877390251e61ee98647c05bf2516f7 passed CI, Integrity Gate, Compliance Gate, image audit, and Google Marketing/LMS/Admin deployment. Marketing ready revision elevate-marketing-migration-r7115721d-38316120256-1 served 100% traffic with matching public version and healthy Supabase.

Browser review identified a separate idle/failure stop-control bug. The narrated-by-default experience and saved preferences are preserved. The button now turns narration off whenever the mode is enabled, including after a failed start, clears the notice and prevents subsequent scroll-triggered requests. Its label and mute icon describe that action consistently. Retry guidance explains turning off and back on. Audio ownership and pacing implementations are unchanged; stale pacing assertions were aligned with their existing values.

Focused narration suite: 22 tests passed across five files, including failed-start cancellation, no speech over user-started media, pending-request ownership, and pacing. Marketing typecheck and full production build passed. This change will be rebased onto the current repository head, preserving concurrent runtime and tooling changes; publication acceptance is checked by the release workflow.
