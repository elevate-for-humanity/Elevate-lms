# Responsive layout repair — October 24, 2026

The Admin email directory squeezed four columns into a phone viewport, breaking
short labels, addresses, and status badges into narrow vertical stacks.

## Changes

| Surface | Repair |
| --- | --- |
| Shared email directory | Stacked mailbox cards below 768px; a locally scrollable table with readable minimum column widths above that breakpoint. Search uses the full phone width. Active filtering, inactive-account handling, member search, and mailbox destinations are preserved. |
| Marketing, Admin, LMS shared CSS | Use normal word wrapping, preserve table column intrinsic widths and intentional minimum widths, and remove substring-based tablet grid overrides that matched inactive responsive utilities. Use 16px mobile form inputs. |
| Admin navigation | Larger back/notification touch targets and device safe-area spacing, including notification panel bounds. |
| Learner navigation | Reserve the device bottom safe area. |
| Program Holder PWA | Remove its more-specific arbitrary-wrapping override. |
| Google release triggers | Include shared `styles/**` changes in all three web deployment workflows. |
| Guided application | Add English/Spanish certification labels. Mount the document panel only after successful interview initialization so document requests do not race session creation. |

## Earlier validation

The original local commit `23cbbb3feee8e23c3e166e536c60c7a7a94d214f` passed
29 tests, all three type checks, lint, and all three production builds (including
generated-route type checks). The actual directory component fixture passed at
320, 360, 390, 430, 768, 1024, and 1440 pixels, with document width matching the
viewport. A Program Holder fixture also passed at 390px.

A static Marketing geometry sweep checked 486 generated HTML files at 320, 390,
768, and 1440 pixels (1,944 page-width checks), finding no horizontally clipped
headings, paragraphs, or controls outside deliberate horizontal scrollers.
That sweep removed scripts and blocked external requests: it did not verify
hydration, loaded media, interaction, or authenticated operational workflows.
Redirect/error HTML can be included among generated files.

## Recovery and release

The original pushes were denied by automatic approval review. The user then
explicitly approved publication to `Elevate-lms/main` and Google deployment.
The local checkout had meanwhile been cleared, so the same repair was recreated
against the unchanged base `0ad9fa72b9eb67885765819d886e80ec4cc745b2`.
The replacement has a new commit identity and receives fresh local validation.

Fresh restoration validation passed: 29 tests across eight files, all three
application type checks, root lint, all three production builds and their
generated-route type checks, and both PWA/admissions architecture contracts.
Cookie-free live checks returned HTTP 200 for all three public version endpoints
and HTTP 307 to `/login` for Admin email accounts and the LMS dashboard.

Live unauthenticated checks do not authorize reading private Admin mailbox data.
Production readiness additionally requires the Google workflow run, image digest,
ready revision, and runtime SHA matching the replacement commit. Local builds
alone do not certify deployment or authenticated PWA acceptance.
