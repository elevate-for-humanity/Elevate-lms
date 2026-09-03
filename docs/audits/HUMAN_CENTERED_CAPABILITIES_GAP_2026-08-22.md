# Human-Centered Capability Audit — Elevate vs. Sandstorm Benchmark

Date: 2026-08-22
Scope: Marketing site, LMS/Admin product surfaces, shared design system, analytics, accessibility, AI, maintenance and research operations.

This document uses the capability categories supplied by the user as a benchmark. It does not copy Sandstorm's proprietary language or imply affiliation, certification, or equivalence. The goal is to identify what Elevate already has, what is fragmented, and what must be operationalized.

| Capability | Benchmark pattern | Elevate evidence | Gap | Required operating standard |
|---|---|---|---|---|
| Brand strategy | Audience motivations, positioning, storytelling, message discipline | Central marketing metadata, homepage/program content, page design standard, public-claims guardrails | Technical/platform language has leaked into public-facing copy; audience hierarchy was inconsistent | Public copy leads with learner/employer outcomes and plain language. Technology supports the story; it is not the story. Maintain audience-specific message maps for learners, employers/host sites, agencies and partners. |
| Creative design | Strong photography, hierarchy, whitespace, concise modular content | Shared page tokens, HeroMediaFrame, ProgramMediaCard, homepage image-led cards | Some pages remain text-heavy or use operational/compliance content as primary storytelling | Every major public landing page must have a clear hero, strong occupation-relevant image, concise intro, scannable cards and primary CTA. Avoid duplicate imagery within one page. |
| UX research | Test comprehension, navigation, flows and terminology | First-party page-view analytics, GA integration, e2e route tests | No formal research cadence or documented comprehension/usability protocol | Quarterly moderated/unmoderated task testing for top journeys; monthly analytics review; capture task success, abandonment, search/referral and CTA conversion. Findings become prioritized issues. |
| Accessibility & inclusive UX | WCAG, keyboard, contrast, semantics, content accessibility, ongoing retest | WCAG/axe Playwright suite, skip link, form-label helper, contrast guardrails, accessibility statement, compliance workflow | Previous audit targeted WCAG 2.1 and had fragmented/manual gaps | WCAG 2.2 AA target; automated critical/serious axe failures block release; keyboard/focus/form/alt/headings tests; reduced-motion and contrast guardrails; weekly production monitoring; manual screen-reader testing retained as human QA. |
| Web development | Cross-functional, incremental, reusable components | Next.js/React platform, shared components, CI/CD, program layouts, workflow checks | Route-level exceptions and duplicated page patterns have historically accumulated | Configuration-first, shared component architecture; canonical program data; no page-specific duplicate systems when a shared primitive exists; exact-SHA build/deploy gates. |
| Maintenance & support | Security, performance, content, feature maintenance | Compliance gate, dependency audit, production smoke tests, monitoring scripts, deployment workflows | Maintenance work is spread across many audits/issues with inconsistent evidence status | One release-health model covering security, accessibility, performance, broken links/media, deployment health, schema drift and public claims. Evidence must distinguish coded, tested and production-verified states. |
| AI strategy | Ethical, scalable, useful AI tied to real workflows | AI assistants, Course Builder, content/video tooling, Studio/agent work | AI is sometimes positioned as the product instead of a capability; governance and disclosure must remain explicit | AI augments advising, content generation and operations; human review for consequential outputs; no unsupported automated eligibility/outcome claims; preserve auditability and role controls. |
| Data analytics | Understand behavior and improve UX/ROI | Google Analytics plus privacy-minimized first-party page views with landing/referrer/UTM/session tracking | Page-view collection exists but formal decision cadence and conversion taxonomy are incomplete | Define conversion events for Apply, Check Eligibility, Funding Intake, Program Explore, Host Shop Apply, Contact and WorkOne orientation; monthly funnel review; changes tied to measured friction. |
| Component architecture | Reuse patterns and configure before custom development | page-design-tokens, shared program layouts/cards/funding blocks, shared accessibility and contrast layers | Legacy and specialized surfaces still bypass canonical patterns | New public pages must use shared hero/card/CTA/form/accessibility primitives unless an exception is documented. |
| Scalability | Reusable system, APIs/configuration first | Canonical data, Supabase, shared components, multi-app architecture | Historical duplicate routes/tables and one-off UI reduce scalability | Consolidate rather than add parallel tables/routes/components; keep Marketing, LMS and Admin boundaries explicit; publish shared contracts. |

## Side-by-side result

### Strong / substantially present
- Component-based development and shared program patterns.
- Automated CI/CD and release gating.
- First-party + GA traffic measurement.
- Accessibility foundations and automated axe testing.
- AI implementation depth.
- Structured program, apprenticeship, funding and credential infrastructure.

### Present but previously fragmented
- Brand strategy and public-message discipline.
- Accessibility governance.
- Maintenance evidence.
- Analytics-to-decision workflow.
- Visual consistency across legacy pages.

### Largest remaining maturity gap
Formal UX research. Automated tests tell us whether software works; analytics tell us what users do. Neither proves users understand the site. Elevate needs a recurring comprehension/usability process for first-time applicants, apprentices, host-site owners and workforce/agency users.

## Human-centered operating loop

1. **Understand** — define audience, task, question and evidence needed.
2. **Measure** — use traffic/funnel data, support questions, accessibility results and task testing.
3. **Design** — use plain language, real occupation imagery, concise sections and one dominant CTA per decision point.
4. **Build** — reuse shared components and canonical data before creating custom code.
5. **Verify** — type/build, accessibility, keyboard, links/media, claims and route tests.
6. **Release** — deploy exact tested SHA and run health/smoke checks.
7. **Learn** — review task completion and conversion data; create prioritized fixes; repeat.

## Homepage standard resulting from this audit

The homepage must answer these questions within the first two screenfuls:

1. What is Elevate? — Career training and registered apprenticeship provider.
2. What can I train for? — Business, HVAC, CDL, Barber and Beauty apprenticeship pathways.
3. Can I earn while learning? — Explain registered apprenticeship plainly without leading with RAPIDS/OJL/RTI jargon.
4. I own a shop; what is here for me? — Host Shop pathway with beauty/barber industry imagery and a direct CTA.
5. How might I pay? — Funding-navigation and self-pay/employer options stated carefully.
6. What should I do next? — Explore a program, apply, check eligibility, or become a Host Shop.
7. What validates the organization? — Registrations/approvals/funding alignment appear after the sales journey, not before it.

## Release criteria

A public-surface redesign is not complete because the code exists. It is complete only when:

- the page builds from the canonical branch;
- critical/serious automated accessibility findings are zero for the tested journey;
- keyboard navigation and visible focus work;
- imagery is relevant, has meaningful alt text, and is not duplicated without purpose;
- primary CTA language describes the next action;
- public claims are supported by controlling records;
- exact-SHA deployment health and smoke checks pass;
- the production page is verified after deployment.
