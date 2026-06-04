# Elevate for Humanity — Workforce Operating System

> **Repository Notice**
> This repository is published for transparency, security review, and platform documentation.
> It does not contain the complete production system. External contributions are not accepted.
> Access to the live platform requires a formal managed access or enterprise source-use agreement.

---

**Production:** [elevateforhumanity.org](https://www.elevateforhumanity.org)
**Status:** Live — Indianapolis, Indiana
**Branch:** `main`

---

## What This Is

Elevate for Humanity operates a vertically integrated **Workforce Operating System** — not a course catalog, not a generic LMS. The platform handles the full operational stack for workforce credential delivery:

- **Training delivery** — cohort scheduling, video lessons, quizzes, attendance, progress tracking
- **Enrollment and funding** — WIOA, Workforce Ready Grant, JRI, FSSA IMPACT, and employer-sponsored intake workflows
- **Compliance and reporting** — DOL apprenticeship (RAPIDS), WIOA performance metrics, RTI hour logs, audit trails
- **Credentialing** — EPA 608, OSHA 10/30, CompTIA A+/Security+, PTCB CPhT, NHA, Microsoft Office Specialist, WorkKeys NCRC, Certiport, Indiana ISDH, Indiana BMV
- **Stakeholder portals** — learner, admin, instructor, employer, program holder, partner, mentor, staff, parent/guardian, workforce board
- **Employer pipeline** — job postings, OJT agreements, placement tracking, 6- and 12-month outcome reporting
- **Tax software** — MeF e-filing stack and tax operations

Programs run 4–18 weeks. Most are fully funded at no cost to eligible participants through federal and Indiana state workforce programs.

---

## Who It Serves

| Stakeholder             | Role                                                                           |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Adult learners**      | Career changers, dislocated workers, justice-involved individuals, youth 16–24 |
| **Workforce agencies**  | WorkOne, Indiana DWD, EmployIndy — referring and funding participants          |
| **Employers**           | Hiring partners, OJT sponsors, apprenticeship co-sponsors                      |
| **Program holders**     | Community organizations delivering training under Elevate's infrastructure     |
| **Booth renters**       | Licensed cosmetology professionals renting space at partner salons             |
| **Workforce boards**    | WIOA Title I administrators, EmployIndy, state DWD                             |
| **Government**          | DOL Office of Apprenticeship, WIOA Title I, FSSA, Indiana BMV                  |
| **Parents / Guardians** | Monitoring progress of enrolled youth participants                             |

---

## Training Programs

### Healthcare

| Program                           | Credential         | Funding             |
| --------------------------------- | ------------------ | ------------------- |
| Certified Nursing Assistant       | Indiana ISDH CNA   | WIOA · WRG          |
| Qualified Medication Aide (QMA)   | Indiana QMA        | WIOA · WRG          |
| Medical Assistant                 | NHA CCMA           | WIOA · WRG          |
| Phlebotomy                        | NHA CPT            | WIOA · WRG          |
| Pharmacy Technician               | PTCB CPhT          | WIOA · WRG          |
| Home Health Aide                  | Indiana HHA        | WIOA                |
| Peer Recovery Specialist          | CPRC Pathway       | WIOA · JRI          |
| Direct Support Professional       | DSP Credential     | WIOA                |
| Drug & Alcohol Specimen Collector | DOT Collector Cert | Self-Pay · Employer |

### Skilled Trades

| Program                           | Credential                  | Funding           |
| --------------------------------- | --------------------------- | ----------------- |
| HVAC Technician                   | EPA Section 608 Universal   | WIOA · WRG        |
| CDL Training (Class A / B)        | Commercial Driver's License | WIOA · EmployIndy |
| Welding                           | AWS / Industry Cert         | WIOA · WRG        |
| Electrical                        | OSHA + Industry Cert        | WIOA              |
| Plumbing                          | Industry Cert               | WIOA              |
| Construction Trades Certification | NCCER / OSHA                | WIOA · WRG        |
| Building Services Technician      | Industry Cert               | WIOA              |
| Diesel Mechanic                   | ASE Pathway                 | WIOA              |
| Forklift Operator                 | OSHA Forklift Cert          | WIOA · Employer   |

### Technology & Business

| Program                      | Credential         | Funding             |
| ---------------------------- | ------------------ | ------------------- |
| IT Help Desk                 | CompTIA A+         | WIOA · WRG          |
| Cybersecurity Analyst        | CompTIA Security+  | WIOA · WRG          |
| Network Administration       | CompTIA Network+   | WIOA · WRG          |
| Network Support Technician   | Industry Cert      | WIOA                |
| Web Development              | Portfolio + Cert   | WIOA                |
| Software Development         | Portfolio + Cert   | WIOA                |
| Graphic Design               | Adobe / Portfolio  | WIOA                |
| CAD / Drafting               | AutoCAD Cert       | WIOA                |
| Business Administration      | Industry Cert      | WIOA                |
| Office Administration        | MOS Certification  | WIOA · WRG          |
| Bookkeeping                  | QuickBooks / NACPB | WIOA                |
| Finance & Accounting Pathway | NACPB / Industry   | WIOA                |
| Tax Preparation              | IRS AFSP / PTIN    | Self-Pay · Employer |
| Entrepreneurship             | Certificate        | WIOA                |
| Project Management           | CAPM Pathway       | WIOA                |

### Apprenticeships (DOL Registered)

| Program                        | License                     | Funding            |
| ------------------------------ | --------------------------- | ------------------ |
| Barber Apprenticeship          | Indiana Barber License      | DOL Apprenticeship |
| Cosmetology Apprenticeship     | Indiana Cosmetology License | DOL Apprenticeship |
| Esthetics Apprenticeship       | Indiana Esthetician License | DOL Apprenticeship |
| Nail Technology Apprenticeship | Indiana Nail Tech License   | DOL Apprenticeship |
| Beauty Career Educator         | Educator Credential         | DOL Apprenticeship |
| Culinary Arts Apprenticeship   | Industry Cert               | DOL Apprenticeship |
| Hospitality                    | Industry Cert               | DOL Apprenticeship |

### Short-Duration Certifications

| Program                          | Credential    | Funding             |
| -------------------------------- | ------------- | ------------------- |
| CPR / First Aid                  | AHA / HSI BLS | Self-Pay · Employer |
| OSHA / Emergency Health & Safety | OSHA 10/30    | WIOA · Employer     |
| Sanitation & Infection Control   | Industry Cert | Self-Pay            |

---

## Stakeholder Portals

| Portal          | Path                  | Audience                        |
| --------------- | --------------------- | ------------------------------- |
| Learner LMS     | `/lms`                | Enrolled students               |
| Student Portal  | `/student-portal`     | Student self-service            |
| Admin           | `/admin`              | Staff, super admins             |
| Instructor      | `/instructor`         | Course instructors              |
| Employer Portal | `/employer-portal`    | Hiring partners                 |
| Program Holder  | `/program-holder`     | Community org partners          |
| Partner Portal  | `/partners/dashboard` | Apprenticeship host shops       |
| Staff Portal    | `/staff-portal`       | Internal staff                  |
| Workforce Board | `/workforce-board`    | WIOA/DWD administrators         |
| Parent Portal   | `/parent-portal`      | Guardians of youth participants |
| Apprentice      | `/apprentice`         | Registered apprentices          |
| Case Manager    | `/cm`                 | WIOA case managers              |

---

## Tech Stack

| Layer           | Technology                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Turbopack)                                                                                          |
| Database        | Supabase (PostgreSQL) — project `cuxzzpsyufcewtmicszk`                                                                      |
| Hosting         | **Northflank** — AWS/ECS references are legacy migration artifacts unless AWS is explicitly re-enabled                      |
| CI/CD           | GitHub → Northflank deploys — run LMS and Admin builds separately (`pnpm run build:lms:phased`, `pnpm run build:admin`)     |
| Package manager | pnpm                                                                                                                        |
| Auth            | Supabase Auth + custom role system                                                                                          |
| Payments        | Stripe + Affirm + Sezzle                                                                                                    |
| Email           | SendGrid + Resend                                                                                                           |
| Rate limiting   | Upstash Redis                                                                                                               |
| Storage         | Cloudflare R2 plus any active provider object storage; AWS S3 references are legacy unless explicitly re-enabled            |
| Analytics       | Google Analytics                                                                                                            |
| Tax e-filing    | IRS MeF stack (EFIN 358459)                                                                                                 |
| Secrets         | Current provider environment/secrets plus admin `platform_secrets` table; AWS SSM references are legacy migration artifacts |

---

## Admin Automation Center

The admin platform now includes an operations-first automation center for curriculum, documents, and compliance workflows.

- **Course Builder Control Center** (`/admin/course-builder/generate`):
  - one-click course generation (blueprint + seed + queued videos)
  - one-click staging and production deployment orchestration
  - migration readiness checks and live platform feed
  - **SCORM package linking** to canonical courses via the existing SCORM package system

- **Documents Automation** (`/admin/documents`):
  - **SAM.gov grant auto-lookup** and opportunity search
  - one-click grant prefill package generation (DOCX + PDF)
  - optional email distribution through SendGrid
  - event timeline for generated grant packages
  - **Minority certification one-click autofill** (DOCX + PDF + timeline + optional SendGrid email)

- **File handling support** in document operations includes image uploads, PDF parsing, DOCX generation, and ZIP processing paths where applicable.

---

## Repository Scale

| Metric               | Count |
| -------------------- | ----- |
| `page.tsx` files     | 1,293 |
| `route.ts` API files | 1,186 |
| Supabase migrations  | 687   |
| Canonical programs   | 37    |
| Nav hrefs            | 111   |

---

## Common Commands

```bash
pnpm next dev --turbopack        # LMS dev server (port 3000)
cd apps/admin && pnpm dev        # Admin dev server (port 3001)
pnpm next build                  # Production build — must complete with zero errors
pnpm lint                        # Run ESLint
bash scripts/audit-schema-refs.sh   # DB table gap report
bash scripts/audit-auth-gaps.sh     # Auth gap report
bash scripts/audit-env-vars.sh      # Env var gap report

# Migration tooling
pnpm tsx --env-file=.env.local scripts/check-pending-migrations.ts   # Check which recent migrations are pending
pnpm tsx --env-file=.env.local scripts/verify-migrations.ts          # Verify key DB objects exist
```

---

## Key Directories

```
app/                        Next.js App Router pages (LMS)
apps/admin/                 Admin app — separate Next.js app on port 3001
components/                 Reusable UI components
components/dev-studio/      Dev Studio panels (Secrets, Container, Files, etc.)
lib/                        Shared utilities, Supabase clients, navigation
lib/secrets.ts              Runtime secret loader — reads app_secrets + platform_secrets
lib/navigation.ts           Single source of truth for header nav (111 hrefs)
lib/curriculum/             Blueprint system and course generator
lib/tax-software/           MeF tax stack
data/programs/              Program data objects (metadata, content, CTAs)
supabase/migrations/        SQL migration files (applied manually in Dashboard)
aws/                        ECS task definitions, buildspecs, WAF rules
public/images/              All site images
scripts/                    Build guards, audit scripts, seeders
```

---

## Navigation Structure

The public header nav (`lib/navigation.ts`) covers 8 top-level sections:

1. **Programs** — 37 canonical programs across Healthcare, Skilled Trades, Technology & Business, and Hubs
2. **Apprenticeships** — DOL-registered programs, booth rental, host shop partners
3. **Certifications** — Short-duration credentials + testing/verification
4. **Funding** — WIOA, WRG, FSSA, JRI, grant programs, payment options
5. **Partners** — Employers, workforce agencies, training providers, program holders
6. **About** — Mission, team, impact, blog, FAQ, contact, advising
7. **Apply** — Single funnel entry point
8. **Donate**

---

## Automation Control Center

The Admin Course Builder Generator now acts as a central processing center for platform operations:

- One-click premium course generation and seeding
- Live course spin-up feed (modules, lessons, video queue visibility)
- Deployment orchestration (staging and production one-click flows)
- Migration health checks and smoke-test controls
- SCORM package linking directly from Generator to canonical courses

Path: `/admin/course-builder/generate`

---

## SCORM Integration

SCORM packages are supported through upload/import + course linking:

- Upload and inspect packages: `/admin/course-import`
- Link SCORM packages to canonical courses from the Generator control center
- API: `/api/admin/course-builder/scorm-link`

This enables SCORM content to be operationally tied to live course records without leaving the builder workflow.

---

## Grants and Certification Auto-Fill

### SAM.gov Grant Feed Auto-Lookup

- Auto-lookup SAM grant opportunities in Admin Documents
- One-click prefill package generation (DOCX + PDF)
- Optional SendGrid email dispatch of generated package links
- Timeline events captured in audit logs

APIs:

- `/api/admin/grants/sam/search`
- `/api/admin/grants/sam/prefill`
- `/api/admin/grants/sam/timeline`

UI:

- `/admin/documents` -> SAM.gov Grant Auto-Fill panel

### Minority Certification Application Auto-Fill

- One-click minority certification draft generation (DOCX + PDF)
- Optional SendGrid email dispatch
- Timeline events tracked in audit logs

API:

- `/api/admin/certifications/minority/prefill`

UI:

- `/admin/documents` -> Minority Certification Auto-Fill panel

---

## Dev Studio

The admin app includes a built-in Dev Studio at `/admin/dev-studio` — a super-admin-only operations panel with the following tabs:

| Tab           | Purpose                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**     | Browse and edit source files via GitHub API                                                                                                                      |
| **Terminal**  | WebSocket shell into the active Northflank runtime/container                                                                                                     |
| **Website**   | Embedded preview of the live site                                                                                                                                |
| **Chat**      | AI assistant (Groq / Gemini / OpenAI) with platform context and tool calling                                                                                     |
| **Container** | Edit `devcontainer.json`, manage env vars, and upload documents; AWS SSM/ECS push flows are legacy and Northflank env/secrets are the production source of truth |
| **Secrets**   | CRUD for `platform_secrets` — encrypted key/value store loaded at runtime by `lib/secrets.ts`                                                                    |
| **Docs**      | Uploaded documents and files                                                                                                                                     |

### Secret management flow

```
Admin Secrets tab → platform_secrets (Supabase)
                 ↓
         lib/secrets.ts (hydrateProcessEnv)
                 ↓
         process.env at runtime — all routes pick up keys automatically
```

### Runtime environment variables

Use Northflank environment/secrets as the source of truth for production runtime variables. The old AWS SSM/ECS push flow is legacy and should not be used for current deployments unless AWS is intentionally re-enabled.

The Admin Secrets tab still stores application-level values in `platform_secrets`; provider-level runtime variables must be mirrored into Northflank before redeploy.

---

## Migrations

Files go in `supabase/migrations/`. Naming: `YYYYMMDD000NNN_description.sql`.

**Migrations are NOT auto-applied by default.** After writing a migration file, apply it one of two ways:

**Option A — Supabase Dashboard (manual):**

1. Open Supabase Dashboard → SQL Editor
2. Paste and run the migration
3. Verify the schema change before marking work complete

**Option B — Management API (scripted, requires PAT):**

```bash
PAT="sbp_..."   # Supabase personal access token
PROJECT="cuxzzpsyufcewtmicszk"
SQL=$(cat supabase/migrations/YYYYMMDD_name.sql)
curl -s -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT}/database/query" \
  -H "Authorization: Bearer ${PAT}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}"
```

**Check pending migrations:**

```bash
pnpm tsx --env-file=.env.local scripts/check-pending-migrations.ts
```

### Migration Status (as of 2026-07-02)

All 690 migrations are applied to production. Last applied:

| Migration                                                   | Description                                                                                                                            | Status     |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `20260701000006_curriculum_uploads.sql`                     | `curriculum_uploads` table + storage bucket                                                                                            | ✅ Applied |
| `20260701000009_fix_program_holders_user_id_constraint.sql` | Drop duplicate unique constraint on `program_holders.user_id`                                                                          | ✅ Applied |
| `20260701000010_platform_secrets.sql`                       | `platform_secrets` + `platform_settings` tables                                                                                        | ✅ Applied |
| `20260701000011_bootstrap_missing_profiles.sql`             | Upsert missing profile rows, promote admin emails                                                                                      | ✅ Applied |
| `20260702000001_rls_and_security_hardening.sql`             | Enable RLS on 4 tables, fix 9 storage policies using `{public}` role, clean up duplicate profile policies, add bucket mime/size limits | ✅ Applied |
| `20260702000002_store_products_product_id.sql`              | Add `product_id` FK to `store_products` — required for cart LMS access grant lookup                                                    | ✅ Applied |
| `20260702000003_store_products_stripe_id.sql`               | Add `stripe_product_id` to `store_products` — required for Stripe webhook refund → LMS revocation                                      | ✅ Applied |

---

## Auth & API Patterns

```ts
// Authenticated user
import { apiAuthGuard } from '@/lib/admin/guards';
const auth = await apiAuthGuard(request);
if (auth.error) return auth.error;

// Admin routes
import { apiRequireAdmin } from '@/lib/admin/guards';
const auth = await apiRequireAdmin(request);
if (auth.error) return auth.error;
```

All API error responses use `lib/api/safe-error.ts`:

```ts
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
return safeError('Not found', 404);
```

### Security Audit — 2026-07-02

**RLS gaps found and fixed:**

- `ai_plan_executions`, `platform_events`, `platform_snapshots`, `program_holder_call_log` — had RLS disabled. Now enabled with admin-only policies.
- 9 storage policies were using `{public}` role (unauthenticated) on private buckets — changed to `{authenticated}`.
- `demo-audio` bucket had no file size limit or mime-type restriction — now capped at 50 MB, audio only.
- `curriculum` bucket now restricted to PDF, video, image, and document mime types.

**All tables now have RLS enabled.** Run this to verify:

```sql
SELECT relname FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = false;
-- Should return 0 rows
```

**Storage policies:** All private bucket policies now require `authenticated` role. Public buckets (`avatars`, `public-assets`) remain intentionally public.

---

### Admin Portal Access

The admin portal at `admin.elevateforhumanity.org` requires a `profiles` row with `role` in `['admin', 'super_admin', 'staff']`.

**If you see "No profile found for your account":**

1. Confirm your user exists in Supabase Auth → Users
2. Run this in Supabase Dashboard → SQL Editor:

```sql
-- Replace with your email
UPDATE public.profiles SET role = 'super_admin' WHERE email = 'your@email.com';

-- If no row exists yet:
INSERT INTO public.profiles (id, email, role, tenant_id, created_at, updated_at)
SELECT id, email, 'super_admin', '00000000-0000-0000-0000-000000000001', NOW(), NOW()
FROM auth.users WHERE email = 'your@email.com'
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
```

3. Sign in again at `admin.elevateforhumanity.org/login`

**RLS note:** The `profiles` table has `relforcerowsecurity = true`. Authenticated users can read their own row via the `profiles_own_read` policy (`id = auth.uid()`). The admin login endpoint (`/api/auth/admin-login`) uses the service role key to bypass RLS for the role check, so login works even if RLS policies change.

---

## Funding

Elevate for Humanity is a 501(c)(3) nonprofit. Donations fund free career training, credentialing fees, and learner support services.

**[Donate via PayPal →](https://www.paypal.com/donate/?business=Marcusgreene0103%40gmail.com&currency_code=USD)**

---

**License:** Proprietary — All rights reserved by 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Training Institute.
