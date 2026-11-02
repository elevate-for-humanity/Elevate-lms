# About and navigation consolidation — November 2, 2026

## Scope and results

- Reviewed the active header owner and desktop/mobile menu code, About, team directory, founder profiles, partner hubs, resource hub, staff profile resolver, footer and public sitemap registry.
- Reduced the header from 17 top-level sections to 8. Removed the More menu which discarded all secondary submenu entries.
- About is now a concise organization hub with mission, founder, staff preview, training/partnership pathways and accountability sections.
- Preserved the founder's credentials on the detailed founder page. Preserved existing staff identities and portraits; no synthetic staff portraits were created.
- Consolidated `/founder` and `/about/team/elizabeth-greene` into `/about/elizabeth-greene`, `/team` into `/about/team`, and `/about/partners` into `/partners` using permanent redirects.
- Staff links normalize honorifics so Dr. Carlina Wilkes resolves to her established profile. Local portrait files replace remote copies in the static roster.
- Corrected the Healthcare hub's esthetics image reference.
- Resource hub retains access to community, independent businesses, portals, tax services, platform, employer and student tools removed from the crowded header.
- Fixed the route audit's obsolete root app directory and its omission of direct top-level links; external portal URLs are explicitly reported as requiring separate HTTP acceptance.

## Automated validation

104 focused tests passed across navigation, public information architecture, booking/calendar/status, image decoding, public phone contacts, and staff profile routing. Marketing TypeScript passed and scoped ESLint passed. Production compilation completed; remaining build phases and deployment are tracked separately.

## Verification limits

75 internal paths exposed by the original navigation returned HTTP 200 when followed. This proves response availability only. It does not prove visual quality, form submission, checkout completion, or signed-in permissions. HTML placeholder attributes were excluded from content-stub findings.

Browser control failed before initialization (`failed to start node_repl backend: Connection closed`). A reset and retry failed too. No browser session or test-user login occurred, and no browser acceptance is claimed. No payment or real application was submitted.

## New image

`public/images/about-training-20261102.webp` was generated with the built-in image-generation tool. Brief: bright contemporary adult career learning center, diverse adult learners and instructor collaborating with laptop and compact HVAC equipment, natural sunlight, crisp whites, restrained red and charcoal accents, no logos or text. It is labeled as an illustrative scene in image alternative text and is not presented as an actual staff photograph. All staff portraits remain existing photographs.

## Original menu HTTP inventory

| Path | HTTP status | Returned heading |
| --- | --- | --- |
| /about | 200 | A workforce system built from lived experience, public-service discipline, and operational execution. |
| /apply/employer | 200 | Partner With Us |
| /apply/student | 200 |  |
| /apprenticeship-sponsor | 200 | Registered Apprenticeship — the earn-while-you-learn path. |
| /apprenticeships | 200 | Earn while you learn in a real workplace. |
| /approvals | 200 | Approvals are shown at the level the evidence supports. |
| /barber-and-beauty-apprenticeships | 200 | Barber Apprenticeship &amp; Beauty Training Pathways |
| /barber-beauty-network | 200 | Barber &amp; Beauty Network |
| /blog | 200 | Practical guidance for your next step. |
| /check-eligibility | 200 | Prepare for a workforce-funding review |
| /community | 200 | Build something together. |
| /contact | 200 | Let’s plan your next step. |
| /employers | 200 | Build a documented workforce partnership |
| /employers/directory | 200 | Employer Directory |
| /faq | 200 | Frequently Asked Questions |
| /for-agencies | 200 | Refer clients to career training |
| /funding | 200 | Explore support for your next career step. |
| /funding/state-programs | 200 | Indiana Workforce Funding |
| /funding/wioa | 200 | WIOA training funding starts with eligibility and written authorization. |
| /funding/wrg | 200 | Workforce Ready Grant |
| /hire-graduates | 200 |  |
| /how-it-works | 200 | From application to employment in four steps. |
| /jobs | 200 | Open opportunities from participating employers |
| /jri | 200 | Build the skills to feel ready for work. |
| /microclasses | 200 | Microclasses |
| /online-apps | 200 | Elevate Online Apps &amp; Portals |
| /partners/host-shop/apply | 200 | Become an approved apprenticeship Host Site |
| /partners/host-shops | 200 | Become a Host Shop for free. Grow your team through apprenticeship. |
| /platform | 200 | One operating system for training, apprenticeship, credential, and workforce evidence. |
| /platform/workforce-boards | 200 | Workforce Operations Platform |
| /programs | 200 | Train for your next career. |
| /programs/administrative-assistant | 200 | Administrative Assistant |
| /programs/automotive-technician | 200 | Automotive Technician |
| /programs/barber-apprenticeship | 200 | Learn the trade where the work happens. |
| /programs/business-administration | 200 | Business &amp; Entrepreneurship |
| /programs/business-startup | 200 | Business Start-Up |
| /programs/cdl-training | 200 | Your next chapter starts behind the wheel. |
| /programs/cna | 200 | Certified Nurse Aide (CNA) Training |
| /programs/construction-trades-certification | 200 | Construction Trades Certification Pathway |
| /programs/cosmetology-apprenticeship | 200 | Cosmetology Apprenticeship |
| /programs/cybersecurity-analyst | 200 | Cybersecurity Analyst |
| /programs/data-analytics | 200 | Data Analytics |
| /programs/dental-assistant | 200 | Dental Assistant |
| /programs/esthetician-apprenticeship | 200 | Esthetician Apprenticeship Pathway |
| /programs/healthcare | 200 | Train for work that supports patients and healthcare teams. |
| /programs/hvac-technician | 200 | HVAC Certification |
| /programs/it-help-desk | 200 | IT Help Desk Technician |
| /programs/medical-assistant | 200 | Medical Assistant |
| /programs/nail-technician-apprenticeship | 200 | Nail Technician Apprenticeship |
| /programs/pharmacy-technician | 200 | Pharmacy Technician |
| /programs/phlebotomy | 200 | Phlebotomy Technician |
| /programs/project-management | 200 | Project Management |
| /programs/qma | 200 | Qualified Medication Aide (QMA) |
| /programs/skilled-trades | 200 |  |
| /programs/tax-preparation | 200 | Tax Preparation |
| /programs/technology | 200 |  |
| /programs/web-development | 200 | Web Development |
| /programs/welding | 200 | Welding Certification |
| /rise-forward-foundation | 200 | Support beyond the classroom. |
| /scholarships | 200 | Scholarships &amp; Training Funding |
| /sites/2exclusive-platinum-cleaning | 200 | A cleaner home. A better-kept workplace. |
| /sites/meri-gold-round | 200 | Make wellness part of your everyday round |
| /store | 200 | Start with what you need. Grow in one connected workspace. |
| /store#marketplace | 200 | Start with what you need. Grow in one connected workspace. |
| /store/demo | 200 | See your next workspace in action. |
| /store/testing | 200 | Organize your testing center. |
| /student-support | 200 | Student Support Services |
| /tax | 200 | Get your taxes prepared. |
| /tax-software/contact | 200 | Get your taxes prepared by a professional. |
| /tax-software/self-file | 200 | Sign in to your tax workspace |
| /testing | 200 | Choose your exam. Take your next step. |
| /testing/book | 200 | Verifying your booking |
| /testing/for-employers | 200 | Workforce Testing Solutions |
| /testing/nha | 200 |  |
| /testing/policies | 200 | Testing Center Policies |
