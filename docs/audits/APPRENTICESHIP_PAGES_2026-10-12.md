# Apprenticeship page audit — 2026-10-12

## Scope
46 Marketing page files containing apprenticeship/applicant routes were reviewed at source level, along with their shared program, payment, media, and directory components. Inventory is in APPRENTICESHIP_PAGE_INVENTORY_2026-10-12.json. All literal image references in those pages exist, and image references used by beauty components/featured partners decode successfully.

## Repairs
- Separates barber/nail hero media from page headings and controls so a fixed media height cannot crop enrollment text. Hero frames are 220–360px; supplementary salon/photo tours are capped at 320px.
- Removes duplicate program shop directories. Searchable placement listings remain available once; map uses the same occupation-filtered records as the directory.
- Adds active approved host_shops records missed by the former application-only loader. Includes J Noelle Collective in the cosmetology category, with its real interior/brand images from its official site, website, and booking link.
- Archived/inactive partner records are excluded from public approved listings and cannot reappear through curated fallback profiles. No record was unarchived.
- Removes contradictory free-funding and universal price/deposit promotions from apprenticeship pages. Tuition is self-pay; coupon eligibility and the final amount are confirmed by payment checkout.
- Aligns public apprenticeship pricing with programs.price/tuition, the authority used by invoice checkout. Verified published tuition: barber $4,980; cosmetology/esthetics/nails $6,000. Invoice installment descriptions use the actual four-invoice path rather than obsolete weekly estimators.
- Corrects residual cosmetology 1,500 RTI / 2,000-only / day-one-pay claims, stale nail deposit/kit promises, the nail category's barber photograph, and confirmation-page $500 copy.
- Replaces enrollment-success GET-side status updates and guessed next-Monday dates with a read-only status presentation scoped to the authenticated applicant and exact program. Paid/pending/approved records are not described as confirmed enrollment.

## Image provenance
J Noelle Collective: https://jnoellecollective.com/ matches the approved operational business at 1020 Gemini Ln, West Lafayette, Indiana. Official salon interior: Websitebuilder/20260526193402.jpg; branding: Websitebuilder/20251021175950.jpeg on the salon website's own RackCDN origin. Optimized WebP copies are retained under public/images/partners/j-noelle. No image was generated to impersonate a real shop.

## Validation and limits
Focused tests, lint, and Marketing type/build checks were run. Refer to final release evidence for terminal results; a running or empty log does not imply success. Source review is not equivalent to visual review of every protected page. The live barber page was inspected and showed cropped hero content, duplicate directories, incorrect funding promotion, and mixed-occupation map pins before the repair. Actual mobile and authenticated enrollment pages still require visual release verification.

## Data safety
No applications, enrollments, financial records, suppliers, or shop approvals were created or changed. No live payment or form was submitted. Automatic approval review rejected a broader private-application/metadata query; the audit continued using narrower approved-record reads. Supplier account activation and student-kit fulfillment remain incomplete from the earlier task.


## Follow-up release and public entry verification — 2026-10-12, 14:45 Eastern
- Deployed Marketing commit: 665deba2ac1c7c88ec91d70ed2eb1cdace51a618. Google workflow 38291286488 completed successfully. Ready revision elevate-marketing-migration-r665deba2-38291286488-1 serves 100% of traffic; the public version and homepage checks returned that exact SHA.
- Corrected the global image default that overrode explicit heights. Host-shop photos use positioned 4:3 frames; the shared program template restores a primary heading beneath custom hero media and removes obsolete weekly/deposit and universal discounted-price promises.
- Removed the stale release assertion requiring a universal $5,400 esthetics price. Release checks now validate the actual published self-pay information and public entry paths.
- Fixed the missing HTTP listener on the existing reserved Google public address 34.110.235.233. HTTP uses a dedicated redirect-only map/proxy and port-80 forwarding rule; the established HTTPS URL map remained unchanged. Both apex and www return permanent HTTPS redirects with paths and queries retained.
- HTTP repair workflow 38292587780 passed, including three redirect/guard unit tests and ten direct public checks. The same ten public checks passed again against the released Marketing SHA: four entry variants, live version, four apprenticeship pages/pricing endpoints, and the approved J Noelle profile.
- Verified tuition/first monthly invoice: barber $4,980/$1,245; cosmetology, esthetics and nails $6,000/$1,500 each. Actual terms remain subject to the displayed checkout and enrollment requirements.
- Marketing type validation, production build, final container checks, public route checks, and authenticated tax API boundaries passed. Natural speech returned HTTP 200, audio/mpeg, and 34,752 bytes of MP3 audio.
- Fresh mobile visual verification could not run in this follow-up because the selected coding/browser environment failed to initialize. The HTTP/content checks do not measure rendered card dimensions or replace that visual review. Authenticated enrollment flows and real payment processing were not exercised. Supplier account activation and kit fulfillment remain incomplete.

## Photo and placement follow-up — 2026-10-12
- Barber introductory content and uncropped hero share a two-column desktop layout; mobile shows media first. Main buttons, 2,000 OJL / 260 RTI hours, self-pay tuition, four-invoice terms, and inquiry/application/enrollment distinctions are in the introduction. Hours and tuition come from the existing program authorities.
- Kountry Kutz tour now precedes the directory and long FAQs.
- Placement cards, featured directories, and the network directory share a compact photo carousel: two mobile columns, three tablet columns, four wide-screen columns, 160px maximum photo height, uncropped photographs, and 44px playback targets. Existing decoded photos remain visible while the next photo loads or fails. Local images use Next image optimization with responsive card sizes.
- Cal's Kutz opens with its current storefront; Top Shelf opens with its current enhanced portfolio; B-52s uses its published portfolio rather than a representative stock interior. No generated shop imagery was added in this follow-up.
- Trade filters include each explicitly approved occupation; dual-approved businesses no longer disappear from their secondary approved trade. Unknown/unapproved trades remain excluded.
- Cookie preferences are an in-flow notice before site content, with no CTA-obscuring bottom overlay or keyboard focus trap. Saved choices and optional-tracking defaults remain unchanged.
- Nail and esthetics hero media use contain sizing.
- Validation: 73 focused tests across 14 files passed (slideshow, trade, invoice pricing, image decoding, current shop links, and cookie navigation); Marketing type checking and lint of changed source files passed. The full local Marketing production build, including type validation and static generation, passed. Live release and browser verification remain required before describing this follow-up as deployed.
- Former-partner images, provisioning/MOU routines, saved credential section, profile-specific exceptions, and obsolete audit/test references were removed from the current tree. Generic razor safety training and Git history remain intact; inactive partner approval gates continue to control public listings.
