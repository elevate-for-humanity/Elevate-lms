# Host Shop discovery, image loading, and student clarity

## Changes
- Business names and profile buttons open the same individual shop destination across network and program directories. Card photos have independent slideshow controls.
- The Barber & Beauty Network contains the actual searchable shop directory, contact/booking/directions links, free host recruitment, business benefits, and conditional paid apprenticeship messaging.
- Consolidates historical records sharing a public shop slug, retaining their approved occupations.
- Keeps a loaded gallery image visible while the requested image loads. Preloads gallery photos, prioritizes the first photo, and retains usable images when another photo fails.
- Optimizes Paola Petit Studio's externally published images as local WebP assets. Identical source images share one asset; source attribution is preserved. Published shop photographs are preserved. The B-52s interior crop is AI-enhanced from its published portfolio and explicitly labeled in the slideshow.
- Smaller shop galleries (480px maximum width, 320px maximum image height), more compact showcases, two-column mobile shop cards, and smaller FAQ illustrations.
- Shows free inquiry, enrollment application, and confirmed enrollment as distinct stages. Payment and application submission alone do not confirm enrollment or placement.
- Explains self-pay tuition, published totals/deposits/supplies, pay-in-full, program plans when offered, and third-party BNPL approval and repayment.

## Verification
- 36 focused tests across seven files passed, covering profile navigation, delayed/failed gallery loads, duplicate destination consolidation, approved occupations, page facts, and self-pay policy.
- Ten distinct currently advertised public shop links returned HTTP 200. Paola and Cal's pages were also opened in the live browser and their actual photographs verified as loaded.
- Source lint passed before the final additional copy/sizing edits. Final lint, full Marketing typecheck, and production build were started; do not infer completion from an empty log or a running process.
- Initial local build required GIT_SHA; restarted with current checkout identity.
- Browser kept open at Cal's profile, with slideshow paused. This is the current production page, not a preview of these un-deployed edits.

## Release and limits
- Code-only change, honoring the user's no-deployment instruction. Commit skips automatic push workflows so it does not start a billed production release.
- No social posts, email campaigns, paid ads, new account creation, or live application submissions performed.
- Customer visits, bookings, apprentice placements, earnings, and financing approval are not guaranteed. Walk-in availability must be confirmed by each business.
- Actual mobile viewport and final production release still require verification. Existing supplier activation and course/system work are outside this change.
