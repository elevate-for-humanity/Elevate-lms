# Build Stability Investigation — 2026-05-29

## Scope

Phase 1 discovered that `pnpm next build` cannot complete in this container because the Node heap is exhausted. This report records the evidence gathered so the build issue is treated as a production-stability blocker, not a vague cleanup item.

**Directive for this investigation:** measure the build surface and identify the top contributors before making optimization changes. No production code was refactored as part of this report.

## Build attempts

### Attempt 1 — default heap

```bash
pnpm next build
```

Result: **FAIL** — production build reached `Creating an optimized production build ...` and aborted with JavaScript heap OOM near the default ~4 GB heap limit.

### Attempt 2 — 6144 MB heap

```bash
NODE_OPTIONS='--max-old-space-size=6144' pnpm next build
```

Result: **FAIL** — production build reached startup and aborted with JavaScript heap OOM near the 6 GB heap limit.

### Attempt 3 — memory debug mode

```bash
NODE_OPTIONS='--max-old-space-size=4096' pnpm next build --experimental-debug-memory-usage
```

Result: **STOPPED FOR SAFETY** — memory debug mode confirmed steady heap/RSS growth and started writing a 2.4 GB heap snapshot. The process RSS reached about 13 GB while snapshotting, so it was killed to protect the container.

Observed memory progression before termination:

| Build phase marker |      RSS | Heap used | Heap allocated | Heap max | Heap used % |
| ------------------ | -------: | --------: | -------------: | -------: | ----------: |
| Starting build     |   222 MB |     71 MB |         121 MB | 4,288 MB |       1.66% |
| Periodic snapshot  |   948 MB |    506 MB |         653 MB | 4,288 MB |      11.81% |
| Periodic snapshot  | 1,698 MB |  1,225 MB |       1,352 MB | 4,288 MB |      28.57% |
| Periodic snapshot  | 2,150 MB |  1,653 MB |       1,761 MB | 4,288 MB |      38.55% |
| Periodic snapshot  | 2,795 MB |  1,909 MB |       2,359 MB | 4,288 MB |      44.51% |
| Periodic snapshot  | 3,248 MB |  1,839 MB |       2,777 MB | 4,288 MB |      42.89% |
| Periodic snapshot  | 3,851 MB |  3,061 MB |       3,150 MB | 4,288 MB |      71.38% |

At 71.38% heap usage, Next.js started saving `.next/periodic-memory snapshot.heapsnapshot`. The snapshot reached **2,406,534,623 bytes** before it was deleted.

## Repeatable audit command

A repeatable route/build-surface audit script was added so the measurements below can be re-run without hand-written shell snippets:

```bash
node scripts/audit-build-surface.mjs
```

The script reports route counts by build root, largest route groups, largest route-adjacent modules, JSON/data load sites, recursive scan sites, `generateStaticParams` declarations, and any retained `.next` generated output.

## Static build surface evidence

The original coarse count combined the root LMS app and standalone admin app. The measured build surface should be read in two parts because `app/` is the root LMS build tree and `apps/admin/app/` is the admin build tree.

| Root             | Route files | Pages | API routes | Source size |
| ---------------- | ----------: | ----: | ---------: | ----------: |
| `app`            |       2,096 |   956 |        880 |    12.50 MB |
| `apps/admin/app` |         844 |   364 |        416 |     3.99 MB |

Combined repository app-router surface:

| Metric                                        |    Count |
| --------------------------------------------- | -------: |
| `page.tsx` files across both route roots      |    1,320 |
| `route.ts` files across both route roots      |    1,296 |
| Total route entry/support files measured      |    2,940 |
| Total route-root source measured by the audit | 16.49 MB |

## Top route groups by count

### Root LMS build tree (`app/`)

| Rank | Route group          | Pages | API routes | Dynamic files | Route files | Source size |
| ---: | -------------------- | ----: | ---------: | ------------: | ----------: | ----------: |
|    1 | `app/api`            |     0 |        873 |           106 |         873 |     3.60 MB |
|    2 | `app/programs`       |    86 |          0 |            19 |         108 |     0.70 MB |
|    3 | `app/lms`            |    68 |          0 |            19 |          81 |     0.77 MB |
|    4 | `app/store`          |    65 |          0 |             5 |          77 |     0.66 MB |
|    5 | `app/partners`       |    59 |          0 |             3 |          64 |     0.51 MB |
|    6 | `app/program-holder` |    42 |          0 |             4 |          49 |     0.45 MB |
|    7 | `app/employer`       |    28 |          0 |             5 |          35 |     0.18 MB |
|    8 | `app/legal`          |    27 |          0 |             1 |          27 |     0.34 MB |
|    9 | `app/onboarding`     |    25 |          0 |             0 |          33 |     0.26 MB |
|   10 | `app/compliance`     |    23 |          0 |             0 |          26 |     0.28 MB |

### Standalone admin build tree (`apps/admin/app/`)

| Rank | Route group                 | Pages | API routes | Dynamic files | Route files | Source size |
| ---: | --------------------------- | ----: | ---------: | ------------: | ----------: | ----------: |
|    1 | `apps/admin/app/api`        |     0 |        415 |            71 |         415 |     1.90 MB |
|    2 | `apps/admin/app/admin`      |   340 |          0 |            61 |         395 |     1.93 MB |
|    3 | `apps/admin/app/instructor` |    20 |          0 |             8 |          26 |     0.16 MB |
|    4 | `apps/admin/app/auth`       |     1 |          1 |             0 |           2 |     0.00 MB |
|    5 | `apps/admin/app/login`      |     1 |          0 |             0 |           2 |     0.00 MB |

## Top 10 likely contributors to build memory

This ranking is based on route count, source size, build-time inclusion, and imports/load patterns. It is **not** a heap-object attribution because the heap snapshot was intentionally deleted after it reached 2.4 GB.

| Rank | Contributor                          | Evidence                                                                                                                                                     | Interpretation                                                                                                                                                   |
| ---: | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    1 | Root LMS API surface                 | `app/api` contains **873** route handlers and 106 dynamic route files.                                                                                       | Each handler is a separate server entry to parse, compile, trace, and bundle; this is the largest single route-count contributor in the LMS build.               |
|    2 | Root LMS page surface                | `app/` contains **956** `page.tsx` files.                                                                                                                    | Even with small individual files, the number of entries creates a large static-analysis and server-component graph.                                              |
|    3 | Program route tree                   | `app/programs` contributes **86** pages / 108 route files and 19 dynamic files.                                                                              | Public program pages are a major page-count bucket and also import program data/layout components.                                                               |
|    4 | LMS learner route tree               | `app/lms` contributes **68** pages / 81 route files and contains the 83,832-byte lesson renderer.                                                            | Learner pages are core and unavoidable, but they are among the largest compiled route modules.                                                                   |
|    5 | Store and partner route trees        | `app/store` has **65** pages; `app/partners` has **59** pages.                                                                                               | These two public/non-core route groups add 124 pages before considering layouts and metadata.                                                                    |
|    6 | Standalone admin API surface         | `apps/admin/app/api` contains **415** API routes.                                                                                                            | This does not belong to the root LMS route tree, but it remains the largest admin build contributor and must be measured separately in admin builds.             |
|    7 | Standalone admin page surface        | `apps/admin/app/admin` contains **340** pages and 61 dynamic route files.                                                                                    | Admin should stay isolated in the admin build; mixing it back into the LMS build would make the OOM worse.                                                       |
|    8 | Dev Studio route/client modules      | `apps/admin/app/api/devstudio/execute/route.ts` is 167,551 bytes; `DevStudioClient.tsx` is 64,998 bytes; `chat/route.ts` is 54,295 bytes.                    | Dev Studio is high-density admin tooling and should not be on the public LMS build path.                                                                         |
|    9 | Large route-adjacent data/modules    | `app/data/programs.ts` is 136,263 bytes; HVAC/course JSON payloads range from 72 KB to 1.35 MB.                                                              | Several routes import or synchronously read large data; these are secondary compared with route count but still affect parsing/tracing.                          |
|   10 | Sitemap/navigation generated content | `config/site-map.auto.ts` is 1,061 lines / 57,290 bytes with 878 `href` entries; `app/sitemap.ts` has about 109 static route entries and is `force-dynamic`. | Sitemap content is measurable but not currently the dominant memory suspect; it should be audited for correctness, not treated as the first optimization target. |

## Largest route-adjacent files

### Root LMS (`app/`)

|      Size | File                                                           |
| --------: | -------------------------------------------------------------- |
| 136,263 B | `app/data/programs.ts`                                         |
|  83,832 B | `app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` |
|  61,863 B | `app/apply/student/StudentApplicationForm.tsx`                 |
|  59,271 B | `app/program-holder/mou/page.tsx`                              |
|  56,308 B | `app/api/barber/webhook/route.ts`                              |
|  55,421 B | `app/apply/actions.ts`                                         |
|  53,733 B | `app/testing/book/page.tsx`                                    |
|  53,126 B | `app/learner/dashboard/page.tsx`                               |
|  50,768 B | `app/lms/(app)/courses/[courseId]/page.tsx`                    |
|  49,974 B | `app/lms/(app)/dashboard/page.tsx`                             |

### Standalone admin (`apps/admin/app/`)

|      Size | File                                                                       |
| --------: | -------------------------------------------------------------------------- |
| 167,551 B | `apps/admin/app/api/devstudio/execute/route.ts`                            |
|  64,998 B | `apps/admin/app/admin/dev-studio/DevStudioClient.tsx`                      |
|  54,295 B | `apps/admin/app/api/devstudio/chat/route.ts`                               |
|  42,400 B | `apps/admin/app/admin/mission-control/MissionControlClient.tsx`            |
|  36,389 B | `apps/admin/app/admin/course-builder/generate/GenerateCourseClient.tsx`    |
|  29,940 B | `apps/admin/app/api/admin/course-builder/generate-from-blueprint/route.ts` |
|  29,167 B | `apps/admin/app/admin/documents/templates/PageClient.tsx`                  |
|  29,070 B | `apps/admin/app/admin/course-builder/CourseBuilderPageClient.tsx`          |
|  28,985 B | `apps/admin/app/admin/grants/snap-et/SnapEtClient.tsx`                     |
|  28,490 B | `apps/admin/app/admin/courses/ai-builder/AICourseBuilderChat.tsx`          |

## Build-time generated files and large payloads

Largest JSON payloads outside `node_modules` / `.next`:

|        Size | File                                                         | Build relevance                                                                                 |
| ----------: | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1,490,303 B | `scripts/generated/barber-course.generated.json`             | Script artifact; not currently observed as a direct route import.                               |
| 1,346,111 B | `public/data/hvac-quizzes.json`                              | Read by `app/hvac/lesson/[lessonId]/page.tsx`.                                                  |
| 1,246,364 B | `docs/audits/root-archive-2026-05-14/quarantine-routes.json` | Documentation artifact; should not be in route graph.                                           |
|   234,423 B | `public/data/barber-apprenticeship-blueprint.json`           | Loaded by `lib/ebook/barber-chapters.ts`; `generateStaticParams` expands 8 ebook chapter pages. |
|   196,150 B | `public/data/hvac-lesson-quizzes.json`                       | Public data payload; check import/load paths before optimizing.                                 |
|   192,122 B | `public/data/hero-banners.json`                              | Public content payload; check import/load paths before optimizing.                              |
|   108,229 B | `public/data/hvac-lesson-content.json`                       | Loaded by HVAC AI/content helpers.                                                              |
|   106,901 B | `public/data/hvac-epa608-prep.json`                          | Loaded by HVAC preview/instructor helpers.                                                      |
|    91,035 B | `public/data/hvac-quiz-banks.json`                           | Loaded by HVAC preview/instructor helpers.                                                      |
|    72,573 B | `public/data/course-definitions.json`                        | Read synchronously by several HVAC/course routes and APIs.                                      |

Confirmed generated/static-param expansion:

| Item                          | Finding                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `generateStaticParams`        | Only one declaration was found: `app/ebook/barber-theory/[chapter]/page.tsx`.                                                           |
| Generated static params count | The barber ebook chapter map has 8 entries.                                                                                             |
| Recursive route generation    | No recursive `generateStaticParams` pattern was found.                                                                                  |
| Runtime recursive scans       | Found in course scan/sitemap APIs and Dev Studio QA/execute routes; these are runtime API behaviors, not direct static route expansion. |

## Sitemap generation cost

Sitemap/navigation is measurable but does not currently explain a 13 GB RSS peak by itself.

| File                      | Evidence                                                                                                   | Assessment                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `config/site-map.auto.ts` | 1,061 lines, 57,290 bytes, 878 `href` entries.                                                             | Moderate generated file; imported by `config/navigation.ts`, not the XML sitemap route.                 |
| `config/navigation.ts`    | Imports `siteMapSections` and exports `footerSections = siteMapSections`.                                  | The generated sitemap array can enter any bundle that imports this navigation config.                   |
| `app/sitemap.ts`          | `force-dynamic`; about 109 static route entries plus a runtime Supabase query for published program slugs. | Dynamic metadata route should not pre-render every URL during build; low priority as an OOM root cause. |
| `app/site-map/page.tsx`   | Uses `headerNavigation` from `lib/navigation/site-nav.config`, not `config/site-map.auto.ts`.              | Site-map page itself is not the primary path for the auto-generated sitemap payload.                    |

## Generated output ranking

Generated output could not be ranked in this container during this pass because no `.next` directory was retained after the OOM attempts. The repeatable audit script now reports the top `.next` files automatically when a completed or partially retained build artifact exists.

Required follow-up in the Northflank production builder:

```bash
NODE_OPTIONS='--max-old-space-size=8192' pnpm run build:lms:compile
node scripts/audit-build-surface.mjs > /tmp/elevate-build-surface-after-build.md
```

If the build still fails, retain `.next` and any heap snapshot long enough to rank generated files and inspect heap dominators before cleanup.

## Assessment

This is **not proven to be a single-file memory leak yet**. The measured evidence points first to a route-surface and server-entry problem: the root LMS build alone has 2,096 route entry/support files, including 880 API routes and 956 pages. The standalone admin build adds another 844 route files and must remain separated from the LMS build.

Most likely contributors to peak memory:

1. Route explosion in `app/api` during root LMS build.
2. Large public route families under `app/programs`, `app/lms`, `app/store`, and `app/partners`.
3. Separate admin route explosion in `apps/admin/app/api` and `apps/admin/app/admin` during admin builds.
4. High-density Dev Studio route handlers and clients inside the admin app.
5. Large route-adjacent data modules and JSON loads that amplify parse/trace cost.

## Smallest production-stabilization recommendation

Do not begin broad refactors. The smallest evidence-based path to a successful production build is:

1. **Operational unblock:** run the existing split build commands on the Northflank production builder first: `pnpm run build:lms:phased` and `pnpm run build:admin`. Use at least an 8 GB Node heap and enough host memory to survive heap-snapshot overhead. This proves whether the current issue is Northflank build-capacity vs. a hard leak.
2. **If LMS still OOMs:** reduce the root LMS build surface before touching learner/payment/enrollment code. The first measured target is `app/api` because it contributes 873 API route handlers to the LMS build. Archive or relocate only dead/non-production API routes in focused PRs; do not alter critical enrollment, payment, testing-center, LMS, or auth endpoints during this phase.
3. **Keep admin isolated:** do not import `apps/admin/app` surfaces into the root LMS app. Admin and Dev Studio should remain in the admin build because their measured route density would worsen the LMS OOM if merged back into the root build.
4. **Defer sitemap optimization:** do not optimize `config/site-map.auto.ts` first. It is a correctness/cleanup concern, but the measured size is too small to be the leading cause of 13 GB RSS.

Until a split build passes on the Northflank builder, build stability remains **FAIL / INVESTIGATING**. Enrollment, payment, testing-center, and Dev Studio operational evidence should continue in parallel, but no workflow should be marked PASS without runtime proof.

## 2026-06-04 update — AWS no longer current deployment target

The earlier recommendations referenced AWS/ECS/CodeBuild because those files still exist in the repository. The current operational direction is **Northflank**. Treat `aws/` buildspecs, ECS task definitions, SSM notes, and CodeBuild commands as legacy migration artifacts unless AWS is explicitly re-enabled. The build failure analysis remains valid because it is based on Next.js route-surface and heap behavior, not on AWS itself. The next build proof must run on the Northflank builder with separate LMS and Admin commands.
