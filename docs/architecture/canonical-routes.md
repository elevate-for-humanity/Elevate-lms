# Canonical Route Ownership

Every top-level route has exactly one owner. Duplicates redirect to the canonical.
Do not create a second implementation of any surface listed here.

## Route Registry

| Route prefix | Owner | Shell | Status |
|---|---|---|---|
| `/` | Marketing site | `PublicLayout` + marketing chrome | ✅ Canonical |
| `/lms` | Learner LMS | `LmsAppShell` | ✅ Canonical |
| `/admin` | Admin control plane | `apps/admin` (separate Next.js app) | ✅ Canonical |
| `/employer` | Employer portal | `app/employer/layout.tsx` | ✅ Canonical |
| `/employer-portal` | **Legacy** — migration in progress | Own `EmployerNav` | ⚠️ Migrate to `/employer` when feature parity reached (unique pages: wotc, hiring-guide, interviews, messages) |
| `/case-manager` | Workforce case management | `app/case-manager/layout.tsx` | ✅ Canonical |
| `/workforce-board` | Workforce oversight | `WorkforceBoardShell` | ✅ Canonical |
| `/partner` | Partner portal | `app/partner/layout.tsx` | ✅ Canonical |
| `/staff-portal` | Staff operations | `app/staff-portal/layout.tsx` | ✅ Canonical |
| `/mentor` | Mentor portal | `app/mentor/layout.tsx` | ✅ Canonical |
| `/program-holder` | Program holder portal | `app/program-holder/layout.tsx` | ✅ Canonical |
| `/provider` | Provider portal | `app/provider/layout.tsx` | ✅ Canonical |
| `/proctor` | Proctor portal | `app/proctor/layout.tsx` | ✅ Canonical |
| `/instructor` | Instructor workspace | `app/instructor/[[...slug]]` | ✅ Canonical |
| `/login` | Auth | No shell | ✅ Canonical |
| `/signup` | Auth | No shell | ✅ Canonical |
| `/admin-login` | Admin auth | No shell | ✅ Canonical |
| `/verify` | Certificate verification | No shell | ✅ Canonical |

## Rules

1. **One implementation per surface.** If you need a variant (e.g. a different funding track), add it as a sub-route or query param — not a new top-level route.
2. **Marketing chrome is suppressed** for all app routes via `MarketingChromeGuard` and the inline script in `app/layout.tsx`. The suppression list in both places must stay in sync. See `docs/architecture/shell-hierarchy.md`.
3. **Legacy routes** must have a comment at the top of their `layout.tsx` explaining migration status and target canonical route.
4. **No new portals** without updating this file and `components/layout/MarketingChromeGuard.tsx`.

## Programs vs Courses terminology

- **Program** = top-level student offering (public-facing, `/lms/programs`)
- **Course** = internal DB object (`training_courses` table, `/lms/courses` authenticated app)
- Use "Program" in all new public-facing UI. "Course" only where it refers to the `training_courses` table object.
- This split is tracked debt — see `AGENTS.md` for migration plan.
