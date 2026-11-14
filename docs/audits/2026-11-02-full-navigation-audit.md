# Full navigation audit — November 2, 2026

## Scope

Source baseline: main commit 0d52ceeb157ea90d5e176e2a39230c288bf94296, plus the repairs in this changeset.

Inspected 82 current and retired navigation entry pages, followed 634 unique first-party destinations and image URLs, and ran the canonical source/import audit across 442 production files and 793 image references.

All 82 entry pages returned HTTP 200 after redirects. Of the linked destinations, 624 returned success and 10 failed: four removed group-artwork images and six nonexistent Student Support topic pages. Every deterministic failure has a source repair in this changeset. The observed responses below came from the older production release; they are not evidence that these repairs are deployed.

## Repairs

- Desktop menu sections now have real disclosure controls for click, hover, keyboard Escape/Arrow Down, focus departure, and selecting a destination. Explicit accessible expanded-state and panel relationships replace CSS-only disclosure.
- Student Support is one complete page with six topic sections and actionable destinations. Removed six dead topic links, corrected Apply to use student enrollment, replaced the unrelated narration/video hero with a compact photographic introduction, and removed text overlays on image cards.
- Retired support topic URLs permanently redirect to sections on the consolidated page. Unknown topics still return 404; the existing appointment route remains intact.
- Removed four references to nonexistent `team-new` group illustrations at rendering time. Verified staff portraits are retained; group scenes are labeled illustrative and are never substituted for unknown people.
- Removed a duplicate `siteUrls` import from the Host Shop application that blocked the complete Marketing TypeScript check.
- Old testing URLs preserve their query string while permanently redirecting to the consolidated testing page. The release gate now tests the intentional exact 308 status rather than requiring an obsolete 307, and still asserts the complete destination and query string.
- Refreshed funding, eligibility, agency and FAQ imagery. New advising artwork is illustrative, with no claimed staff identity.
- Employer Directory is now included in the canonical sitemap registry. The host application remains an application workflow rather than an editorial sitemap page.

## Generated artwork

`public/images/career-advising-20261102.webp` uses the built-in image-generation tool. Prompt brief: bright contemporary adult career advising space; Black female advisor and adult learner reviewing a training plan at a tidy desk; natural sunlight, crisp whites, burgundy and charcoal accents; professional editorial photography; no logos, text, or claimed actual staff identity. The scene is labeled illustrative.

## Validation and outstanding acceptance

114 focused unit tests pass across 19 files. The corrected release-routing and revision tests pass (72 tests). Hosted website, domain, assessment and PARIS contracts pass (29 tests). Claim integrity, public address integrity, source/image/CTA checks, scoped lint and Marketing TypeScript checks are run separately. Browser test discovery compiles the navigation audit suite across five configured device profiles.

The release acceptance suite now checks every current menu destination, decoded images, visible headings, JavaScript errors, server errors, overflow, menu controls and the founder/team journey. It includes disposable apprentice sign-in using identities provisioned and cleaned up by the existing Registered Apprenticeship acceptance workflow. Test discovery is not execution.

Interactive browser control failed before startup (`failed to start node_repl backend: Connection closed`). No local signed-in browser session is claimed. No test-user password is configured in this session. Existing release CI provisions disposable identities rather than reusing student accounts.

At the initial live check, production still served e3453b6e4c3ebec65e31b29dd85a5bd5804f17d3. The newer release failed before building at its outdated testing redirect assertion; this changeset fixes that assertion and the dropped query parameters it exposed. Final deployment and downstream browser acceptance must be confirmed from a completed release, not inferred from a successful push or queued run.

## Initial live failures and source resolution

| Observed failure | Resolution |
| --- | --- |
| `/images/team-new/team-1.jpg` — HTTP 404 | Normalize removed group artwork to appropriate, explicitly illustrative scenes in both team renderers. |
| `/images/team-new/team-2.jpg` — HTTP 404 | Normalize removed group artwork to appropriate, explicitly illustrative scenes in both team renderers. |
| `/images/team-new/team-3.jpg` — HTTP 404 | Normalize removed group artwork to appropriate, explicitly illustrative scenes in both team renderers. |
| `/images/team-new/team-4.jpg` — HTTP 404 | Normalize removed group artwork to appropriate, explicitly illustrative scenes in both team renderers. |
| `/student-support/academic` — HTTP 404 | Consolidate the topic into Student Support and redirect the historical URL to its section. |
| `/student-support/accessibility` — HTTP 404 | Consolidate the topic into Student Support and redirect the historical URL to its section. |
| `/student-support/career` — HTTP 404 | Consolidate the topic into Student Support and redirect the historical URL to its section. |
| `/student-support/counseling` — HTTP 404 | Consolidate the topic into Student Support and redirect the historical URL to its section. |
| `/student-support/financial-aid` — HTTP 404 | Consolidate the topic into Student Support and redirect the historical URL to its section. |
| `/student-support/scheduling` — HTTP 404 | Consolidate the topic into Student Support and redirect the historical URL to its section. |

## Entry-page HTTP inventory

| Entry page | Followed response |
| --- | --- |
| `/` | 200 |
| `/about` | 200 |
| `/about/elizabeth-greene` | 200 |
| `/about/team` | 200 |
| `/apply/employer` | 200 |
| `/apply/student` | 200 |
| `/apprenticeship-sponsor` | 200 |
| `/apprenticeships` | 200 |
| `/approvals` | 200 |
| `/barber-and-beauty-apprenticeships` | 200 |
| `/barber-beauty-network` | 200 |
| `/blog` | 200 |
| `/check-eligibility` | 200 |
| `/community` | 200 |
| `/compliance/center` | 200 |
| `/contact` | 200 |
| `/employers` | 200 |
| `/employers/directory` | 200 |
| `/faq` | 200 |
| `/for-agencies` | 200 |
| `/founder` | 200 |
| `/funding` | 200 |
| `/funding/state-programs` | 200 |
| `/funding/wioa` | 200 |
| `/funding/wrg` | 200 |
| `/hire-graduates` | 200 |
| `/how-it-works` | 200 |
| `/jobs` | 200 |
| `/jri` | 200 |
| `/microclasses` | 200 |
| `/online-apps` | 200 |
| `/partners` | 200 |
| `/partners/host-shop/apply` | 200 |
| `/partners/host-shops` | 200 |
| `/platform` | 200 |
| `/platform/workforce-boards` | 200 |
| `/programs` | 200 |
| `/programs/administrative-assistant` | 200 |
| `/programs/automotive-technician` | 200 |
| `/programs/barber-apprenticeship` | 200 |
| `/programs/business-administration` | 200 |
| `/programs/business-startup` | 200 |
| `/programs/cdl-training` | 200 |
| `/programs/cna` | 200 |
| `/programs/construction-trades-certification` | 200 |
| `/programs/cosmetology-apprenticeship` | 200 |
| `/programs/cybersecurity-analyst` | 200 |
| `/programs/data-analytics` | 200 |
| `/programs/dental-assistant` | 200 |
| `/programs/esthetician-apprenticeship` | 200 |
| `/programs/healthcare` | 200 |
| `/programs/hvac-technician` | 200 |
| `/programs/it-help-desk` | 200 |
| `/programs/medical-assistant` | 200 |
| `/programs/nail-technician-apprenticeship` | 200 |
| `/programs/pharmacy-technician` | 200 |
| `/programs/phlebotomy` | 200 |
| `/programs/project-management` | 200 |
| `/programs/qma` | 200 |
| `/programs/skilled-trades` | 200 |
| `/programs/tax-preparation` | 200 |
| `/programs/technology` | 200 |
| `/programs/web-development` | 200 |
| `/programs/welding` | 200 |
| `/resources` | 200 |
| `/rise-forward-foundation` | 200 |
| `/scholarships` | 200 |
| `/sites/2exclusive-platinum-cleaning` | 200 |
| `/sites/meri-gold-round` | 200 |
| `/store` | 200 |
| `/store/demo` | 200 |
| `/store/testing` | 200 |
| `/student-support` | 200 |
| `/tax` | 200 |
| `/tax-software/contact` | 200 |
| `/tax-software/self-file` | 200 |
| `/team` | 200 |
| `/testing` | 200 |
| `/testing/book` | 200 |
| `/testing/for-employers` | 200 |
| `/testing/nha` | 200 |
| `/testing/policies` | 200 |

## Post-deployment findings

Revision 590b1f72e7545c7e1806882311319bcbd08e4706 served the new About, Team, and Student Support headings with HTTP 200. The full production build, generated-route typecheck, container tests, and Cloud Run activation passed. A later acceptance assertion still required a direct homepage Tax link; it now verifies the approved Homepage → Resources → Tax discovery path while retaining the protected API checks.

Wire-level probes found that page-level compatibility redirects streamed HTTP 200 with a refresh element. Retired About, Founder, Team, and Support URLs are now resolved in middleware before rendering, returning an exact HTTP 308 with query strings and section fragments preserved. Customer domains, mutation requests, unknown topics, and the real scheduling page retain their own routing.

Public EPA scheduling returned five slots. QuickBooks readiness returned HTTP 503: client and company settings exist, but access/refresh tokens are absent; the runtime also reports a missing webhook verifier. This requires authorized account connection/configuration before payment readiness can pass. No payment was attempted and no connection credentials were fabricated.
