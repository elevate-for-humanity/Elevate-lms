# Marketing visual compliance audit

**Date:** 2026-05-30  
**Standards:** `docs/page-design-standard.md`, `docs/hero-video-standard.md`, `lib/page-design-tokens.ts`

## Rules (non-negotiable)

| Rule | Requirement |
|------|-------------|
| Hero / video frame | No gradient wash, no headlines or CTAs on the image |
| Hero height | `hero.imageWrap` — `h-[clamp(190px,32vw,360px)]` |
| Program cards | Photo on top, copy below; no text-on-image gradients |
| Card grid | Prefer `lg:grid-cols-3` — avoid 4+ columns that stretch cards too wide |
| Card image | `card.programImage` — `aspect-[16/10]` / `16/9`, `max-h-48` |

## Fixed in this pass

| Area | Change |
|------|--------|
| Homepage — How it works | 3-column grid; taller `card.programImage`; removed 6-column strip |
| Homepage — Career pathways | 3-column grid; `card.programImage` instead of squashed `lg:h-32` |
| `ProgramCard` / `ProgramGrid` | Shared `programImage` token; 3-col default |
| `VisualProgramTemplate` | Replaced gradient image cards with `ProgramMediaCard` |
| Legacy program pages (4) | `CleanPageHero` — image band + white copy panel |
| Design tokens | `grid.homePrograms`, `grid.programs` (3 col), `card.programImage` |

## Reusable components

- `components/programs/CleanPageHero.tsx` — static page heroes
- `components/programs/ProgramMediaCard.tsx` — image + caption below (no overlay)
- `components/marketing/HeroVideo.tsx` — video heroes (`compactBelowHero` for home)

## Remaining violations (prioritize by traffic)

Run to refresh counts:

```bash
rg "absolute inset-0 bg-gradient|bg-gradient-to-t from-(brand|slate|black)" app components --glob "*.tsx" -l
```

### P0 — Public marketing / program surfaces

| File | Issue |
|------|--------|
| `app/scholarships/page.tsx` | Hero gradient + text on image |
| `app/check-eligibility/page.tsx` | Hero gradient overlay |
| `app/partners/training-sites/page.tsx` | Hero gradient |
| `app/apprenticeships/ipla-exam/page.tsx` | Hero gradient |
| `app/help/page.tsx` | Hero gradient sections |
| `app/lms/(app)/courses/[courseId]/page.tsx` | Course hero gradient (learner-facing) |
| `components/templates/PageHero.tsx` | Full gradient header (legacy) |
| `components/templates/ContentPageTemplate.tsx` | Gradient header |

### P1 — Portals / secondary marketing

| Pattern | Examples |
|---------|----------|
| `program-holder/dashboard` | Hero gradient |
| `app/funding/jri/page.tsx` | Hero gradient |
| `app/store/licenses/page.tsx` | Hero gradient |
| `app/impact/page.tsx`, `app/donate/page.tsx` | Marketing gradient heroes |
| `components/portal/PortalPageLayout.tsx` | Default gradient props on heroes |

### P2 — Acceptable / out of scope

- UI chrome (progress bars, chat widget headers, achievement badges)
- Email HTML / API templates
- Admin dashboard decorative gradients
- Solid `bg-gradient-to-br` section backgrounds **without** image overlays (review case-by-case)

## Hero sizing gaps

| Pattern | Fix |
|---------|-----|
| `style={{ height: 'clamp(300px, 45vw, 520px)' }}` on heroes | Migrate to `hero.imageWrap` + below panel |
| `h-[45vh] min-h-[280px]` on old program pages | Use `hero.imageWrap` per design standard |
| Home below-hero block too tall | `HeroVideo` `compactBelowHero` on `HomeHeroVideo` |

## Program card grids

| Location | Grid |
|----------|------|
| `/` featured pathways | `grid.homePrograms` (3 col) |
| `/programs` catalog sections | `lg:grid-cols-3` (existing) |
| `ProgramGrid` | Default 3; max 4 with `max-w-6xl` |
| `/programs/catalog` DB cards | `xl:grid-cols-3` (OK) |

## CI recommendation

Add a lint script (future):

```bash
# Fail on image-frame gradient overlays (allowlist file for exceptions)
rg "absolute inset-0 bg-gradient-to-t" app components --glob "*.tsx"
```

## Sign-off checklist for new pages

- [ ] Hero uses `HeroVideo`, `HeroPicture`, or `CleanPageHero`
- [ ] Program cards use `ProgramCard` or `ProgramMediaCard`
- [ ] No `absolute` text on hero images
- [ ] Card grid ≤ 3 columns on desktop unless documented exception
