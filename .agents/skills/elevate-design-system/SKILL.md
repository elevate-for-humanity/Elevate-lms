---
name: elevate-design-system
description: Implement and verify Elevate marketing, LMS, Admin, Studio, course, and portal design changes while preserving the canonical Elevate visual system.
---

# Elevate Design System

Use this skill for any request involving visual design, layout, heroes, banners,
responsive behavior, shared UI components, imagery, accessibility, or visual QA.

## Authority

The current repository and live Elevate surfaces are authoritative. OpenHands is
the implementation container; it is not the visual brand. Do not copy another
product's interface, protected assets, or component implementation.

Inspect and reuse these sources before adding UI architecture:

- `lib/page-design-tokens.ts`
- `components/hero/`
- `components/ui/`
- `components/programs/`
- `config/efhImageMap.ts`
- each affected application's `globals.css`

## Required workflow

1. Re-read current `main` and identify every consumer of the shared component.
2. Inspect the current live surface with Studio Chromium at mobile, tablet,
   desktop, and large-desktop widths.
3. Repair the shared primitive or token when the defect has multiple consumers.
4. Use governed Elevate-owned or licensed imagery and preserve provenance.
5. Verify keyboard operation, focus visibility/order, semantic names, contrast,
   reduced motion, zoom/text scaling, and error feedback.
6. Run:

   - `node scripts/design-enforcer.mjs --strict`
   - `node scripts/audit-visual-layout.mjs`
   - `node scripts/check-home-visual-integrity.mjs` for homepage/shared hero work
   - the relevant Playwright responsive/accessibility tests

7. Deploy only after required gates pass. Reopen the live revision and capture
   viewport, console, network, keyboard, and accessibility evidence.

## Visual rules

- Preserve Elevate's premium workforce-institution identity.
- Use canonical responsive containers, spacing, typography, and brand colors.
- Keep hero media intentional, correctly cropped, revisioned, and free of
  flashing duplicate layers.
- Do not introduce fixed-height patches that clip content.
- Do not duplicate shared cards, headers, heroes, navigation, or controls.
- Do not declare a visual fix from source code or a deployment label alone.

## Required evidence

Return changed files, shared consumers, viewport results, accessibility results,
automated test output, commit, deployed revision, live browser evidence, and any
remaining human brand-review decision.
