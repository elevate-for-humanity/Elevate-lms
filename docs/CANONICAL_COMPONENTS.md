# Canonical Components

Verified: 2026-04-23. Importer counts from live grep across `app/` and `components/`,
excluding `_archived/`, `node_modules/`, and `.next/`.

## Status key

- **Canonical** — single source of truth; all new code imports from here
- **Intentionally parallel** — different API or responsibility; do not merge
- **Dead** — zero live importers; safe to delete when confirmed

---

## Breadcrumbs

| Path                             | Status                     | Importers | Notes                                                                                                       |
| -------------------------------- | -------------------------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| `components/ui/Breadcrumbs.tsx`  | **Canonical**              | 805       | Controlled: takes explicit `items: BreadcrumbItem[]`. Use for all new pages.                                |
| `components/seo/Breadcrumbs.tsx` | **Intentionally parallel** | 7         | Auto-generates from `usePathname()`; emits JSON-LD structured data. No props. Different API — do not merge. |

Audited 2026-04-23: JSON-LD is the ONLY structured data on all 7 pages (/programs/technology, /programs/healthcare, /programs/skilled-trades + their PageClient files). Keep seo/Breadcrumbs on all 7. Do not migrate — would silently drop BreadcrumbList JSON-LD with no replacement. Note: TechnologyPageClient.tsx, HealthcarePageClient.tsx, SkilledTradesPageClient.tsx have zero importers and are dead code (separate cleanup task).

---

## Button

| Path                           | Status                 | Importers | Notes                                                                                       |
| ------------------------------ | ---------------------- | --------- | ------------------------------------------------------------------------------------------- |
| `components/ui/Button.tsx`     | **Canonical**          | 65        | Full design-system button. Variants, sizes, loading state, `asChild`. Use for all new code. |
| `components/locked/Button.tsx` | **Deleted 2026-04-23** | 0         | Migrated to `ui/Button` with `asChild` + `<a>`. `components/locked/` directory removed.     |

---

## Hero (page-builder block)

| Path                         | Status        | Importers                            | Notes                                                                                                              |
| ---------------------------- | ------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `components/blocks/Hero.tsx` | **Canonical** | 1 (via `lib/components/registry.ts`) | Registered in `ComponentRegistry` for admin page-builder rendering. Not imported directly by pages. Do not delete. |

---

## HeroSection

| Path                                  | Status                     | Importers                     | Notes                                                                                                                                                                                                     |
| ------------------------------------- | -------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/ui/HeroSection.tsx`       | **Canonical**              | 0 direct (used via templates) | Full-featured: image/video variants (`full`, `split`, `illustration`), `data-hero` attribute, no gradient overlays. Use for new pages.                                                                    |
| `components/sections/HeroSection.tsx` | **Intentionally parallel** | 2                             | Simpler hero for program/category templates. Props: `title`, `description`, `badges[]`, `primaryCTA`, `secondaryCTA`. No image/video support. Used by `CategoryPageTemplate` and `ProgramDetailTemplate`. |

APIs are incompatible. Do not merge.

---

## HeroVideo

| Path                                 | Status        | Importers | Notes                                                                                                         |
| ------------------------------------ | ------------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| `components/marketing/HeroVideo.tsx` | **Canonical** | 30        | Premium video hero. Used across learner dashboard, program pages, and marketing pages. Single implementation. |

---

## NotificationBell

| Path                                  | Status        | Importers | Notes                                                                                                                         |
| ------------------------------------- | ------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `components/lms/NotificationBell.tsx` | **Canonical** | 4         | LMS notification bell. Used by `LMSNavigation`, `LMSSidebar`, `EnhancedDashboard`, LMS dashboard page. Single implementation. |

---

## CoursePlayer

| Path                                                        | Status                     | Importers | Notes                                                       |
| ----------------------------------------------------------- | -------------------------- | --------- | ----------------------------------------------------------- |
| `app/career-services/courses/[slug]/learn/CoursePlayer.tsx` | **Intentionally parallel** | 2         | Career-services-specific player, co-located with its route. |
| `components/UniversalCoursePlayer.tsx`                      | **Canonical**              | multiple  | Universal player for HSI and partner LMS routes.            |

Different feature domains. Do not merge.

---

## VideoPlayer

No `VideoPlayer.tsx` files found in live code. Not applicable.

---

## Loading boundaries

| Path                                      | Status        | Importers                       | Notes                                                                                                                                                  |
| ----------------------------------------- | ------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/LoadingSpinner.tsx`           | **Canonical** | 1 (`components/RouteGuard.tsx`) | Simple inline spinner.                                                                                                                                 |
| `components/system/FullScreenSpinner.tsx` | **Canonical** | 4 (loading.tsx delegates)       | Full-screen centered blue spinner for route-segment loading boundaries (`funding`, `employer-portal`, `onboarding`, `instructor`). Created 2026-04-23. |
| `components/system/LoadingFallback.tsx`   | **Canonical** | multiple                        | Red spinner with "Loading..." text, `min-h-[60vh]`. For content-area loading states.                                                                   |

Three spinners serve three distinct contexts. Do not merge.

---

## CTASection

| Path                                 | Status        | Importers | Notes                  |
| ------------------------------------ | ------------- | --------- | ---------------------- |
| `components/sections/CTASection.tsx` | **Canonical** | 2         | Single implementation. |

---

## Migrations still required

| Item                                           | Action needed                                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `components/seo/Breadcrumbs.tsx` (7 importers) | Audit whether JSON-LD is needed on those pages; if not, migrate to `ui/Breadcrumbs` |
| `components/blocks/Hero.tsx`                   | Document props schema in page-builder admin UI                                      |
