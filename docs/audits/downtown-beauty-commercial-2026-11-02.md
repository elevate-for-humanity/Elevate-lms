# Downtown beauty imagery and commercial

User-provided imagery maps to Mesmerized by Beauty nail and esthetician programs, overseen by Jozanna George, and Prestige Elevation cosmetology. Downtown address: 120 East Market Street, Suite 560, Indianapolis, IN.

The downtown gallery is included on the network, host shop, beauty apprenticeship, and Mesmerized school pages. The Salon Saloon team photograph was professionally relit with identity-preserving image editing.

Validation: marketing TypeScript passed; changed-file ESLint passed; git diff whitespace check passed. Full local production compilation could not run: the shared filesystem has no available build space (the repository requires 4 GiB). Browser validation is not complete: Playwright Chromium is unavailable.

Local commit: 2db99a0d4e42803f58dd9a3d2c65c57fc8b65ee5. Publication remains blocked by automatic approval review of the main-branch dry-run push, despite verification of the repository identity and connected-account push permission. No push or production deployment is claimed.

The existing partner marketing address/description records were corrected without changing approval, access, program assignments, or partnership states. After the media assets deploy, the public partner media galleries should be updated to use the three new program-specific images; do not publish nonexistent image paths.


## Approved publication and live verification

The user explicitly approved publishing these changes to `elevate-for-humanity/Elevate-lms` on `main` on November 2, 2026. Gallery assets and pages were published in `590b1f72e7545c7e1806882311319bcbd08e4706`; co-located shop identity protection and its regression test were published in `77af28fc4a6fe67c06aa6c7e01893ba9cadcaaff`.

The public `/api/version` and healthy `/api/health` now report serving commit `77af28fc4a6fe67c06aa6c7e01893ba9cadcaaff`. The network and Mesmerized school pages return HTTP 200 and include all three program images, the full downtown address, Jozanna George, and Prestige Elevation. Mesmerized and Salon Saloon profile routes return HTTP 200 with their correct separate portfolios. All four new first-party WebP files return HTTP 200 as image/webp. The production configuration serves direct unoptimized image URLs; an absent Next image-optimizer endpoint is not an image-loading failure.

Partner galleries now use canonical first-party image paths. Existing Salon Saloon portfolio images were retained. Both downtown partner marketing addresses use `120 East Market Street, Suite 560`; the obsolete Mesmerized ZIP code was cleared. A temporary equivalent postal abbreviation used during rollout was restored to the full address after the identity fix became live. Approval, authentication, program assignment, and partnership state were not changed.

The new co-location regression failed before the fix and passed afterward; both the new test and existing shop deduplication test pass. Marketing TypeScript and changed-source lint pass. The Google production build and final-container smoke test pass.

Scope limitation: release workflow `41453936455` reports failure in the separate `Verify live Supersonic entry and authenticated tax boundaries` step, after the healthy Marketing revision was activated and exact public-revision/homepage checks passed. This does not negate the targeted live gallery verification; it is not an all-green platform CI claim. No browser screenshot verification is claimed.
