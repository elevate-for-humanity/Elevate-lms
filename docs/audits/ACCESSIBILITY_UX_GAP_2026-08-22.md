# Accessibility & UX Gap Review — August 22, 2026

Benchmark themes reviewed: accessibility audit, design/development remediation, content accessibility, and ongoing release/retest.

| Area | Before | Implemented now | Remaining human verification |
| --- | --- | --- | --- |
| Standards target | WCAG 2.1 AA statement/test coverage | WCAG 2.2 AA target and axe tags | Periodic manual screen-reader review |
| Keyboard/focus | Partial tests and inconsistent focus visibility | Global focus-visible guardrails and keyboard regression tests | Manual complex-widget walkthroughs |
| Contrast | Existing CSS guardrails; automated test disabled contrast rule | Contrast rule enabled in regression suite; light/dark guardrails retained | Visual review of exceptional branded surfaces |
| Motion | No platform-wide reduced-motion contract | Global prefers-reduced-motion behavior | Verify third-party embeds separately |
| Forms | Runtime label helper plus limited tests | Programmatic label checks on application controls | Review complex dynamic form error announcements |
| Images/non-text | Existing alt-text practices | Multi-route missing-alt regression checks | Editorial review for alt-text quality/context |
| Links/buttons | Existing semantic components | Automated accessible-name checks | Editorial review for descriptive wording |
| Heading structure | Partial homepage check | Single-H1/no-skipped-level regression on homepage | Extend manual checks to unusual legacy pages |
| Public journeys | Homepage-heavy automated coverage | Key program, apprenticeship, host-shop, funding, application and contact routes | Expand route set as navigation changes |
| Release testing | Accessibility job on push/PR | WCAG 2.2 release gate retained and upgraded | Monitor failures before deployment approval |
| Ongoing monitoring | No dedicated production cadence | Weekly production accessibility monitor with evidence artifacts | Quarterly human review recommended |
| Public commitment | WCAG 2.1 statement | WCAG 2.2 statement plus Audit → Design/Development → Content → Release/Retest process | Update statement when standards/process change |

## Homepage UX changes completed in the same pass

- Removed video/voiceover startup dependency from the homepage hero.
- Converted the homepage hero to server rendering to reduce startup flash.
- Removed the dark media overlay and replaced it with a clear split-content/image hero.
- Rewrote the hero around visitor goals rather than platform/compliance terminology.
- Moved featured career pathways immediately below the hero.
- Focused featured pathways on Business, HVAC, CDL, Barber Apprenticeship, Beauty Apprenticeships, and Host Shop.
- Rewrote the apprenticeship section around learner/employer decisions rather than OJL/RTI/RAPIDS implementation details.
- Simplified funding copy into understandable choices and actions.
- Rewrote the final CTA around deciding, applying, and asking for help.
- Moved institutional registrations/approvals/funding proof to the end of the homepage.

## Release principle

Accessibility is treated as an engineering and content lifecycle, not a one-time badge or claim. Automated tests reduce regressions but do not replace keyboard, assistive-technology, content-quality, document, or third-party-service review.
