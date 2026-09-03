# Header Duplication Audit — 2026-08-08

## Canonical active shell
- `apps/marketing/app/layout.tsx` mounts `components/site/Header.tsx` exactly once at the root Marketing shell.

## Duplicate / legacy artifacts
- `components/ui/Header.tsx` is an unused re-export alias of the canonical header.
- `components/marketing/cf/site-header.tsx` is a separate legacy header implementation with no active repository callers found.
- `components/layout/PublicLayout.tsx` contains its own `<Header />` and footer shell even though the Marketing root layout already owns global chrome. No active Marketing caller was found; keeping it creates a future double-header regression risk.

## Active layout defect
At `xl` widths the canonical header rendered both:
1. `HeaderDesktopNav` (the full horizontal navigation), and
2. `HeaderDesktopMenu` (a second menu control), plus Sign In and Apply.

The full nav itself is `flex-row flex-nowrap`; the visual wrapping/collision is caused by excessive competing controls and shell duplication risk, not by the nav direction.

## Remediation
- Keep only `components/site/Header.tsx` as the Marketing header owner.
- Remove the unused `components/ui/Header.tsx` alias.
- Remove the unused CF `SiteHeader` implementation.
- Remove the unused `components/layout/PublicLayout.tsx` duplicate shell.
- On full desktop, render only the horizontal nav + Sign In + Apply. Keep the compact menu only below the full desktop breakpoint.
