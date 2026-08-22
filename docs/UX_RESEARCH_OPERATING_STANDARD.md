# UX Research & Measurement Operating Standard

Effective: 2026-08-22
Scope: Elevate public website, application/funding journeys, LMS, apprenticeship/host-site portals and Admin experiences.

## Purpose

Engineering tests establish whether a feature functions. Accessibility tests establish whether automated accessibility requirements are violated. Analytics show behavior. None of those alone prove that a first-time user understands the product. This standard adds the missing human-centered research layer.

## Priority audiences

1. Prospective learner deciding what training is available.
2. Applicant trying to understand cost/funding and the next required action.
3. Apprentice trying to understand work-based learning, hours, documents and progress.
4. Barber/beauty business owner evaluating the Host Shop pathway.
5. Employer evaluating work-based learning or hiring support.
6. Workforce/agency user verifying programs, approvals, documentation and participant workflow.
7. Instructor/staff user completing operational tasks in LMS/Admin.

## Core task tests

### Public website
- In 10 seconds, explain what Elevate does.
- Find Business training.
- Find HVAC training.
- Find CDL training.
- Find a registered apprenticeship.
- Explain what “earn while you learn” means after reading the apprenticeship section.
- As a salon/barbershop owner, find how to become a Host Shop.
- Find funding information without assuming that funding is guaranteed.
- Start an application.

### Learner/apprentice portal
- Find the assigned course.
- Find missing documents.
- Upload a required document.
- Find progress and completed credentials.
- For apprentices, find OJL/RTI progress and clock-in/time-entry controls.

### Employer/Host Shop
- Find assigned apprentices.
- Review/verify work hours where authorized.
- Find agreements/documents needing action.
- Understand what Elevate handles versus what the Host Site handles.

### Agency/Admin
- Locate participant/program evidence.
- Trace enrollment/funding/apprenticeship records without duplicate sources of truth.
- Export or inspect the required audit evidence.

## Research cadence

### Every release
- Automated WCAG 2.2/axe checks.
- Keyboard/focus checks on changed critical flows.
- Build/type/lint and link/media/claim gates.
- Smoke test the changed production route.

### Monthly
- Review top landing pages and referral sources.
- Review Apply, Eligibility, Funding, Program, Host Shop and Contact journey traffic.
- Identify high-traffic exits and dead-end pages.
- Review repeated support/contact questions as evidence of comprehension problems.
- Convert findings into prioritized issues with owner and acceptance criteria.

### Quarterly
Conduct at least five representative task sessions across the priority audiences. More than one audience should be represented when possible.

Record:
- task success/failure;
- time to first correct action;
- wrong turns;
- terminology that causes confusion;
- content users skip;
- questions asked aloud;
- accessibility/assistive-technology barriers;
- recommended change.

## Evidence rules

- Do not record passwords, SSNs, financial account information, medical details or other sensitive inputs in UX evidence.
- Use synthetic/test records for operational demonstrations where possible.
- Screenshots/video used for evidence must redact personal information.
- A finding is not “fixed” until the production behavior has been verified.

## Message comprehension standard

Public pages should lead with:

1. What this is.
2. Who it is for.
3. What the person can do or become.
4. How the pathway works in plain language.
5. What action to take next.

Technical and compliance terminology belongs after the visitor understands the pathway. Terms such as OJL, RTI, RAPIDS, schema, LMS, API, AI agent, workflow engine and infrastructure must not substitute for the primary public explanation.

## CTA standard

Use action-specific labels. Prefer:
- Explore Business Training
- Explore HVAC Training
- Explore CDL Training
- See Apprenticeship Programs
- Become a Host Shop
- Check Eligibility
- Start Your Application
- Review Funding Options

Avoid generic repeated labels such as “Learn More” when the destination can be described.

## Photography standard

- Use occupation-relevant human photography.
- Host Shop imagery must visibly communicate barber/salon/beauty work.
- HVAC imagery must show HVAC/trade activity, not a generic classroom.
- CDL imagery must show commercial-driving context.
- Business imagery should show entrepreneurship/office/client work.
- Apprenticeship imagery should show supervised work in a real workplace.
- Avoid repeating the same image across adjacent cards or multiple pathways.
- Alt text describes the meaningful content/purpose rather than stuffing keywords.

## Decision loop

Research finding -> prioritized issue -> shared component/content fix -> automated regression coverage where possible -> exact-SHA deployment -> production verification -> measurement review.
