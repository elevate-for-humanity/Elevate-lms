# Elevate LMS — Workforce Operating System Architecture Report

## PHASE 1: System Map

**Generated**: 2026-02-11
**Codebase**: Next.js 16 on Netlify, Supabase, Stripe

---

### 1. Scale Summary

| Metric | Count |
|---|---|
| TypeScript/TSX files | 4,696 |
| API routes (`app/api/**/route.ts`) | 926 |
| Pages (`app/**/page.tsx`) | 1,574 |
| Components (`components/*.tsx`) | 795 |
| Supabase migrations | 71 (was 86 — some archived) |
| Unique Supabase tables referenced | 753 `.from()` calls to unique table names |
| Unique `process.env.*` variables | 340 |
| `lib/` subdirectories | 98 |
| Cron jobs (`app/api/cron/`) | 17 |
| Static HTML pages (`public/*.html`) | 74 |
| `package.json` dependencies | ~307 entries |
| `netlify.toml` redirect rules | ~82 |
| `next.config.mjs` | 589 lines |
| `proxy.ts` (middleware) | 497 lines |

---

### 2. Domain Architecture

Three domains route through `proxy.ts`:

| Domain | Routes To | Purpose |
|---|---|---|
| `www.elevateforhumanity.org` | `/` (default) | Main site, store, admin |
| `elevateforhumanityeducation.com` | `/student-portal/*` | LMS learner experience |
| `supersonicfastermoney.com` | `/supersonic-fast-cash/*` | Tax prep / fast cash product |
| `platform.elevateforhumanity.org` | `/platform/licensing/*` | B2B licensing portal |

---

### 3. Subsystem Inventory

#### 3.1 Core Platform

| Subsystem | API Routes | Pages | Lib Files | Key Tables |
|---|---|---|---|---|
| **Admin** | 100 | 281 | `lib/admin/` (2) | `profiles`, `audit_logs`, `audit_log` |
| **Auth** | 14 | 7 | `lib/auth/` (10) | `profiles`, `user_profiles` |
| **Enrollment** | 9+8+8 = 25 | 6+4+4 = 14 | `lib/enrollment/` (8), `lib/enrollments/` (1) | `enrollments` (408 refs), `student_enrollments` (33), `program_enrollments` (24) |
| **Programs** | 8 | 91 | `lib/programs/` (5) | `programs` (152 refs) |
| **Courses / LMS** | 22+6 = 28 | 25+79 = 104 | `lib/lms/` (4), `lib/courses/` (1) | `courses` (130), `lessons` (38), `lesson_progress` (26), `modules` (10) |
| **Licensing** | 4+4 = 8 | 6+4 = 10 | `lib/licensing/` (11), `lib/license/` (8) | `licenses` (77), `license_events` (10), `license_purchases` (12) |
| **Store / Checkout** | 19+9 = 28 | 63+5 = 68 | `lib/store/` (18), `lib/checkout/` (1) | `products` (15), `cart_items` (14) |
| **Stripe / Billing** | 7+8 = 15 | — | `lib/stripe/` (9), `lib/billing/` (7), `lib/payments/` (1) | `payments` (20), `payment_logs` (11), `stripe_webhook_events` (10) |
| **Trial** | 2 | — | `lib/trial/` (1) | `licenses` (trial state) |
| **Analytics** | 20 | 1 | `lib/analytics/` (2) | `page_views` (11) |

#### 3.2 Workforce / Compliance

| Subsystem | API Routes | Pages | Lib Files | Key Tables |
|---|---|---|---|---|
| **WIOA** | 9 | 4 | `lib/workforce/` (1) | compliance flags on `tenants` |
| **RAPIDS / Apprenticeship** | 2+6+4 = 12 | 14+2 = 16 | `lib/apprenticeship/` (2) | `apprentices` (26), `apprentice_hours_log` (11), `transfer_hours` (14) |
| **Compliance** | 3 | 2 | `lib/compliance/` (15) | `documents` (72), `student_requirements` (10) |
| **Drug Testing** | — | 8 | `lib/drug-testing/` (2) | — |
| **Certificates** | 9+5 = 14 | 4+1 = 5 | `lib/certificates/` (3) | `certificates` (60) |
| **Attendance / Timeclock** | 3+3 = 6 | — | `lib/timeclock/` (2) | — |

#### 3.3 Partner / Franchise / B2B

| Subsystem | API Routes | Pages | Lib Files | Key Tables |
|---|---|---|---|---|
| **Partners** | 10+8 = 18 | 21+17 = 38 | `lib/partners/` (14), `lib/partner/` (2) | `partners` (24), `partner_users` (26), `partner_lms_enrollments` (50), `partner_lms_providers` (14) |
| **Franchise** | 13 | 28 | `lib/franchise/` (9) | `franchise_offices` (43), `franchise_preparers` (45), `franchise_clients` (13), `franchise_fee_schedules` (14), `franchise_preparer_payouts` (12), `franchise_return_submissions` (27) |
| **Program Holders** | 19 | 39 | `lib/program-holder/` (2) | `program_holders` (48), `program_holder_documents` (11) |
| **Employer** | 4 | 23 | — | `employers` (11), `employees` (11), `employment_outcomes` (12) |

#### 3.4 Revenue Products

| Subsystem | API Routes | Pages | Lib Files | Key Tables |
|---|---|---|---|---|
| **Supersonic Fast Cash** | 21 | 56 | — | Tax prep / refund advance product |
| **Tax Software** | 10 | 18 | `lib/tax-software/` (20) | `mef_submissions` (12), `franchise_return_submissions` (27) |
| **Sezzle (BNPL)** | 4 | — | `lib/sezzle/` (1) | — |
| **Affirm (BNPL)** | 3 | — | `lib/affirm/` (1) | — |
| **Marketplace** | 4 | 8 | — | `marketplace_creators` (12) |
| **Shop** | 5 | 15 | `lib/shops/` (2) | `shops` (17), `shop_staff` (16) |

#### 3.5 Engagement / Communication

| Subsystem | API Routes | Pages | Lib Files | Key Tables |
|---|---|---|---|---|
| **Email** | 9+3+2 = 14 | 1 | `lib/email/` (18), `lib/email-templates/` (3) | `email_logs` (12), `email_campaigns` (14) |
| **Notifications** | 5 | 1 | `lib/notifications/` (13) | `notifications` (46), `notification_outbox` (10), `push_subscriptions` (11) |
| **Forums** | 5 | 1 | — | `forum_threads` (19), `forum_posts` (13) |
| **Chat / Messages** | 2+2+2 = 6 | 1+4 = 5 | `lib/chat/` (1), `lib/chatbot/` (1) | `messages` (27), `conversations` (11) |
| **Gamification** | 3 | 1 | `lib/gamification/` (1) | — |
| **Social Media** | 4 | 1 | `lib/social/` (1) | — |

#### 3.6 AI / Content

| Subsystem | API Routes | Pages | Lib Files | Key Tables |
|---|---|---|---|---|
| **AI** | 13+4+2+2 = 21 | 5+1+1 = 7 | `lib/ai/` (2), `lib/ai-instructor/` (1) | — |
| **Studio** | 19 | 2 | `lib/devstudio/` (3) | — |
| **Content** | 2 | 1 | `lib/content/` (2) | — |
| **SCORM / xAPI** | 4+2 = 6 | — | `lib/scorm/` (3), `lib/xapi/` (2) | — |
| **Video** | 3+1 = 4 | 2 | `lib/video/` (4) | — |

#### 3.7 Infrastructure

| Subsystem | Files | Purpose |
|---|---|---|
| **Proxy** (`proxy.ts`) | 497 lines | Domain routing, auth, role checks, onboarding gates, enrollment gates |
| **Supabase client** | `lib/supabase/` (6) | Server/client/admin clients |
| **Rate limiting** | `lib/rate-limit.ts` | Upstash Redis with in-memory fallback |
| **Monitoring** | `lib/monitoring/` (4), `lib/observability/` (3) | — |
| **Logging** | `lib/logging/` (4) | — |
| **Security** | `lib/security/` (4) | — |
| **PWA** | 32 pages, `lib/pwa/` (2), `lib/offline/` (5) | Progressive web app shell |
| **Autopilot** | `lib/autopilot/` (16) | Automated workflows |
| **Jobs** | `lib/jobs/` (6) | Background job processing |

---

### 4. Cron Jobs (17)

| Cron | Purpose |
|---|---|
| `enrollment-automation` | Auto-advance enrollment states |
| `missed-checkins` | Flag students who missed check-ins |
| `career-course-emails` | Drip emails for career courses |
| `weekly-verdicts` | Weekly compliance verdicts |
| `inactivity-reminders` | Nudge inactive students |
| `payment-monitoring` | Flag failed/overdue payments |
| `morning-reminders` | Daily class reminders |
| `check-licenses` | Validate license states |
| `weekly-reminders` | Weekly engagement emails |
| `trial-lifecycle` | Expire trials, flag abandoned, send warnings |
| `process-notifications` | Drain notification outbox |
| `check-expiring-documents` | Flag documents nearing expiry |
| `daily-attendance-alerts` | Attendance anomaly alerts |
| `process-provisioning-jobs` | Tenant provisioning queue |
| `end-of-day-summary` | Daily admin digest |
| `check-stuck-approvals` | Flag approvals stuck >N days |
| `expire-licenses` | Hard-expire overdue licenses |

---

### 5. Webhook Handlers

| Path | Lines | Events Handled |
|---|---|---|
| `/api/webhooks/stripe` (canonical) | 1,889 | `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`, `charge.refunded` |
| `/api/stripe/webhook` (deprecated) | 552 | Forwards to canonical |
| `/api/license/webhook` | — | License lifecycle events |

---

### 6. Auth & Role Model

**Roles** (from `proxy.ts` and `lib/auth/`):
- `super_admin` — Platform owner (`elizabethpowell6262@gmail.com`)
- `admin` — Full admin access
- `staff` — Staff portal access
- `instructor` — Instructor views
- `student` / `user` — Default learner role
- `partner` — Partner portal access
- `program_holder` — Program holder dashboard
- `employer` — Employer portal

**Auth flow**: Supabase Auth → `proxy.ts` checks session → queries `profiles.role` → enforces route-level access.

**Gates in proxy.ts**:
1. Webhook bypass (Stripe signature verification)
2. Domain-based routing (3 domains)
3. Role-based route protection
4. Admin email allowlist
5. Partner status check
6. Onboarding completion gate
7. Enrollment state gate

---

### 7. External Integrations (by env var clusters)

| Category | Services |
|---|---|
| **Payments** | Stripe (core), Sezzle, Affirm |
| **Auth** | Supabase Auth, Google OAuth, Facebook OAuth, GitHub OAuth, Azure AD, SAML, LDAP |
| **Email** | Resend (primary), SendGrid, Mailchimp, SMTP |
| **AI** | OpenAI, ElevenLabs, HeyGen, Synthesia, Suno, Runway, D-ID |
| **Tax/IRS** | Drake Software, IRS MeF (SOAP), CareerSafe, Certiport |
| **Government** | SAM.gov, Grants.gov, RAPIDS, WOTC |
| **CRM** | HubSpot, Salesforce |
| **Communication** | Twilio (SMS), Zoom, Jitsi, Tawk, Tidio, Zendesk, Intercom |
| **Media** | YouTube, Vimeo, Pexels, Pixabay, Unsplash |
| **Social** | Facebook, Instagram, LinkedIn, Twitter/X |
| **Infrastructure** | Netlify, Cloudflare R2, AWS S3, Sentry, Upstash Redis, BigQuery |
| **LMS Standards** | SCORM, xAPI, LTI |
| **Identity** | Stripe Identity, Turnstile, hCaptcha |

---

### 8. CI / Integrity Gates

| Script | Purpose |
|---|---|
| `check-redirect-conflicts.mjs` | Blocks build on conflicting redirects |
| `check-analytics-integrity.mjs` | Single GA4 injector, no hardcoded IDs |
| `check-self-service-policy.mjs` | Warns on phone-first CTAs in funnel |
| `ci-token-gate.ts` | Validates required env vars before build |
| `integrity-gate.yml` | GitHub Actions workflow running all checks |

---

### 9. Known Structural Issues (Phase 1 Observations)

1. **926 API routes** — many are test/debug endpoints (`test-*`, `debug`, `simulate-*`, `quick-test`, `run-all-tests`). ~30+ should be removed before production sale.

2. **Three enrollment tables** — `enrollments` (408 refs), `student_enrollments` (33 refs), `program_enrollments` (24 refs). Unclear which is canonical.

3. **Duplicate license guard files** — `lib/license-guard.ts` and `lib/licenseGuard.ts` alongside `lib/license/` directory (8 files).

4. **Stripe spread** — Stripe client code in 9+ locations across `lib/store/`, `lib/billing/`, `lib/new-ecosystem-services/`, `lib/stripe/`, `lib/payments/`, `lib/integrations/`.

5. **Two audit log tables** — `audit_logs` (57 refs) and `audit_log` (16 refs).

6. **753 unique table references** — likely includes tables that don't exist in migrations (aspirational code).

7. **340 env vars** — many are for integrations that may not be active. No runtime validation of which are actually required.

8. **1,574 pages** — significant portion may be placeholder/scaffold pages from autopilot generation scripts.

9. **Deprecated webhook handler** still active at `/api/stripe/webhook` (552 lines).

10. **`profiles` (830 refs) vs `user_profiles` (39 refs)** — two user tables, unclear relationship.

---

---

## PHASE 2: Data Model Analysis

### 1. Schema Sources

The database has **no single source of truth** for its schema:

| Source | Tables Defined | Notes |
|---|---|---|
| `supabase/schema.sql` (716 lines) | ~45 tables | Aspirational "complete" schema, but predates many migrations |
| 71 migration files | ~60+ CREATE TABLE statements | Incremental, many use `IF NOT EXISTS` |
| Baseline migration | 0 (no-op) | States "428 tables already exist with RLS" — created via dashboard |
| Application code | 753 unique `.from()` table names | Many reference tables not in any migration |

**Implication**: The live Supabase database is the only authoritative schema. The migration files and `schema.sql` are incomplete snapshots.

---

### 2. The Three Enrollment Tables

This is the most significant data model problem. Three tables serve overlapping purposes:

#### `enrollments` (408 code references — most used)
- **PK**: Composite `(user_id, course_id)` — no UUID
- **Scope**: Course-level enrollment
- **Key columns**: `user_id`, `course_id`, `status`, `progress_percent`, `enrollment_method`, `payment_id`, `funding_source`, `funding_program_id`, `partner_id`, `case_manager_name`, `case_manager_email`, `workone_region`
- **Used by**: Most of the platform — admin, analytics, webhooks, enrollment flows, reports, LMS progress
- **Defined in**: `schema.sql` section 3

#### `student_enrollments` (33 code references)
- **PK**: UUID `id`
- **Scope**: Program-level enrollment (apprenticeships, barber programs)
- **Key columns**: `student_id`, `program_id`, `program_slug`, `stripe_checkout_session_id`, `funding_source`, `amount_paid`, `region_id`, `transfer_hours`, `required_hours`, `has_host_shop`, `host_shop_name`, `case_id`
- **Used by**: Apprentice hours, unified enrollment, webhooks, case files, workforce board
- **Defined in**: `20260201_student_enrollments_canonical.sql`

#### `program_enrollments` (24 code references)
- **PK**: UUID `id`
- **Scope**: Training program enrollment with Stripe payment tracking
- **Key columns**: `user_id`, `program_id`, `email`, `full_name`, `phone`, `amount_paid_cents`, `stripe_payment_intent_id`, `stripe_session_id`, `certificate_url`, `notes`
- **Used by**: Enrollment API, unified enrollment, webhooks, tuition checkout
- **Defined in**: `20260201_training_programs_stripe.sql`

#### Overlap Analysis

| Concern | `enrollments` | `student_enrollments` | `program_enrollments` |
|---|---|---|---|
| User reference | `user_id` | `student_id` | `user_id` |
| What they enroll in | Course | Program | Training program |
| Payment tracking | `payment_id` (Stripe PI) | `stripe_checkout_session_id` | `stripe_payment_intent_id` + `stripe_session_id` |
| Funding source | ✅ | ✅ | ✅ |
| Status | ✅ | ✅ | ✅ |
| Hours tracking | ❌ | `transfer_hours`, `required_hours` | ❌ |
| Progress | `progress_percent` | ❌ | ❌ |

**Verdict**: `enrollments` is the LMS enrollment (course-level). `student_enrollments` is the workforce/apprenticeship enrollment (program-level, hours-based). `program_enrollments` is a third variant for paid training programs. All three are actively written to by the Stripe webhook handler. A buyer will need to understand which table to query for "is this person enrolled?"

---

### 3. The Two User Tables

#### `profiles` (830 code references)
- **Not defined in any migration** — created via Supabase dashboard
- Columns added by migrations: `role`, `is_active`, `phone`, `address`, `city`, `state`, `zip_code`, `tenant_id`, `onboarding_completed`, `onboarding_completed_at`
- Used by `proxy.ts` for: `role`, `tenant_id`, `onboarding_completed`
- Used everywhere for role checks, name lookups, email lookups
- Referenced as FK target by: `applications`, `documents`, `audit_logs`, `hour_logs`

#### `user_profiles` (39 code references)
- **Defined in `schema.sql`** with columns: `user_id` (PK, FK to `auth.users`), `role` (enum), `first_name`, `last_name`, `phone`, `address`, `city`, `state`, `zip_code`, `bio`, `avatar_url`, `organization_id`, `program_holder_id`
- Used by: certificate issuance, case manager views, funding admin, program holder admin

**Verdict**: `profiles` is the live table. `user_profiles` was the schema.sql design but `profiles` was created first in the dashboard. Both exist in production. Code uses both. The `role` column exists on both but with different types (`TEXT` on profiles, `user_role` enum on user_profiles).

---

### 4. The Two Audit Log Tables

| Table | References | Defined In |
|---|---|---|
| `audit_logs` | 57 | `001_barber_hvac_reference.sql` and `20260118_audit_logs.sql` (defined twice) |
| `audit_log` | 16 | Not in migrations — likely created via dashboard |

Plus domain-specific audit tables: `franchise_audit_log`, `partner_audit_log`, `tax_audit_log`.

---

### 5. Key Table Schemas

#### `licenses` (77 refs)
```
id, license_key, domain, customer_email, tier (starter|business|enterprise),
status (active|expired|suspended|cancelled), features (JSONB), max_deployments,
max_users, issued_at, expires_at, last_validated_at, validation_count, metadata,
tenant_id (added later)
```
- Central to the B2B licensing model
- `license_events` tracks state changes
- `license_validations` logs each validation check

#### `apprentices` (26 refs)
```
id, user_id, application_id, program_id, program_name,
status (pending|active|suspended|completed|withdrawn),
total_hours_required (default 2000), hours_completed, transfer_hours_credited,
enrollment_date, expected_completion_date, actual_completion_date, current_shop_id
```
- Separate from `student_enrollments` despite similar purpose
- Has its own `total_hours_required` (default 2000) vs `student_enrollments.required_hours` (default 1500)

#### `training_programs` (referenced as `programs` in code — 152 refs)
```
id, slug, name, category, description, duration_weeks, duration_formatted,
tuition_cents, tuition_dollars, exam_fees_cents, exam_fees_dollars,
materials_cents, materials_dollars, total_cost_cents, total_cost_dollars,
stripe_product_id, stripe_price_id, funding_types[], wioa_eligible,
wrg_eligible, apprenticeship_registered, certification_name, certifying_body
```
- Dual cents/dollars columns (redundant but harmless)

#### `tenants` (34 refs)
- Not defined in any migration file scanned
- Referenced by `profiles.tenant_id`, license system, compliance system
- Multi-tenant isolation boundary

---

### 6. `required_hours` / `hours_needed` Analysis

| Location | Column | Default | References |
|---|---|---|---|
| `student_enrollments` | `required_hours` | 1500 | 15 code refs |
| `apprentices` | `total_hours_required` | 2000 | Via RAPIDS export |
| Code fallbacks | — | 2000 | `app/apprentice/state-board/page.tsx`, `app/api/learner/dashboard/route.ts` |

`hours_needed` has **zero code references** — it was discussed as a potential canonical name but never implemented. The actual duplication is between `student_enrollments.required_hours` (1500 default) and `apprentices.total_hours_required` (2000 default).

---

### 7. Missing Constraints

Based on migration analysis:

1. **No FK from `student_enrollments.student_id`** to `auth.users` or `profiles`
2. **No FK from `student_enrollments.program_id`** to any programs table
3. **`enrollments` has FK to `funding_programs`** but that table may not exist (defined in schema.sql, not in migrations)
4. **`status` columns are unconstrained TEXT** on `enrollments` and `student_enrollments` (no CHECK constraint). `apprentices` has a CHECK constraint.
5. **No unique constraint** on `(student_id, program_id)` in `student_enrollments` — allows duplicate enrollments
6. **`profiles` has no defined schema** — all columns added via ALTER TABLE, no constraints visible

---

### 8. Index Coverage

Indexes found in migrations:

| Table | Indexed Columns |
|---|---|
| `enrollments` | `user_id`, `course_id` |
| `program_enrollments` | `user_id`, `program_id`, `status`, `stripe_payment_intent_id` |
| `student_enrollments` | None defined in migration |
| `licenses` | `domain`, `license_key`, `status`, `expires_at` |
| `license_events` | `license_id`, `event_type`, `created_at DESC` |
| `certificates` | `serial` (unique) |
| `lesson_progress` | `user_id` |
| `quiz_attempts` | `user_id` |
| `login_events` | `(user_id, at DESC)` |

**Missing**: `student_enrollments` has no indexes at all. `profiles` index state is unknown (dashboard-created).

---

---

## PHASE 3: End-to-End Flow Traces

### Flow 1: Trial Start (Self-Service)

```
User clicks "Start Free Trial" on /store/trial
  → POST /api/trial/start-managed
    → Rate limit check (Upstash Redis → in-memory fallback)
    → Validate email
    → Generate correlation ID
    → Supabase admin: create org in `tenants`
    → Supabase admin: create license in `licenses` (tier='trial', 14-day expiry)
    → Supabase admin: log to `license_events`
    → Resend: send welcome email with X-Correlation-ID header
    → Return { success, dashboardUrl, correlationId }
```

**Files**: `app/api/trial/start-managed/route.ts`, `lib/rate-limit.ts`, `lib/licensing/billing-authority.ts`
**Tables written**: `tenants`, `licenses`, `license_events`
**External calls**: Upstash Redis, Resend

---

### Flow 2: Program Enrollment (Self-Pay)

```
User visits /programs → selects program
  → /enroll/[programId] (client component)
    → Supabase: fetch program from `programs`
    → User fills form, clicks "Enroll"
    → POST /api/enroll/complete
      → Supabase: lookup program by slug in `programs`
      → Supabase: find or create user in `profiles`
      → Supabase: create enrollment in `student_enrollments`
      → Return success
  → OR if paid: redirect to Stripe Checkout
    → Stripe webhook fires checkout.session.completed
      → /api/webhooks/stripe handles kind='program_enrollment'
      → Upsert `student_enrollments` with stripe_checkout_session_id
      → Audit log to `audit_logs`
```

**Files**: `app/enroll/[programId]/page.tsx`, `app/api/enroll/complete/route.ts`, `app/api/webhooks/stripe/route.ts` (lines 135-220), `lib/enrollment/unified-enrollment.ts`
**Tables written**: `student_enrollments`, `program_enrollments` (via unified enrollment), `profiles`, `audit_logs`
**External calls**: Stripe Checkout

---

### Flow 3: License Purchase (B2B)

```
Buyer visits /store/licenses → selects tier
  → /store/licenses/checkout/[slug]
    → Client: load product from app/data/store-products
    → Client: collect customer info (email, org name)
    → POST /api/checkout/create-session (Stripe Checkout Session)
    → Redirect to Stripe
    → Stripe webhook: checkout.session.completed
      → /api/webhooks/stripe handles kind='license_purchase'
      → Create license in `licenses`
      → Create tenant in `tenants`
      → Log to `license_events`
      → Send welcome email via Resend
```

**Files**: `app/store/licenses/checkout/[slug]/page.tsx`, `app/api/checkout/create-session/route.ts`, `app/api/webhooks/stripe/route.ts`
**Tables written**: `licenses`, `tenants`, `license_events`
**External calls**: Stripe, Resend

---

### Flow 4: Login → Role-Based Routing

```
User visits /login
  → Client: Supabase signInWithPassword
  → Client: fetch profiles.role
  → Redirect based on role:
    - admin/super_admin → /admin/dashboard
    - staff → /staff-portal
    - student → /hub or /lms
    - partner → /partner/dashboard
  → proxy.ts intercepts every subsequent request:
    1. Webhook bypass check
    2. Domain-based rewrite (LMS, Supersonic, Platform)
    3. Role-based route protection (PROTECTED_ROUTES map)
    4. Admin email allowlist check
    5. Partner status check
    6. Onboarding completion gate
    7. Enrollment state gate
    8. Set x-user-role header
```

**Files**: `app/login/page.tsx`, `proxy.ts` (497 lines), `lib/auth/validate-redirect.ts`
**Tables read**: `profiles` (role, tenant_id, onboarding_completed)
**External calls**: Supabase Auth

---

### Flow 5: Stripe Webhook Processing

```
Stripe sends POST /api/webhooks/stripe
  → proxy.ts: bypass auth (WEBHOOK_PATHS)
  → Verify Stripe signature
  → Switch on event.type:
    - checkout.session.completed (9 sub-handlers):
      → program_enrollment → upsert student_enrollments
      → donation → insert donations
      → apprenticeship_enrollment → update applications, create student_enrollments
      → license_purchase → create licenses, tenants
      → store_purchase → create orders
      → course_purchase → create enrollments
    - payment_intent.succeeded → log to payment_logs
    - payment_intent.payment_failed → log failure
    - customer.subscription.created/updated → update licenses
    - customer.subscription.deleted → suspend/cancel license
    - invoice.payment_succeeded → extend license period
    - invoice.payment_failed → flag license
    - charge.refunded → process refund
```

**Files**: `app/api/webhooks/stripe/route.ts` (1,889 lines)
**Tables written**: `student_enrollments`, `program_enrollments`, `enrollments`, `licenses`, `license_events`, `donations`, `payments`, `payment_logs`, `audit_logs`, `tenants`
**Risk**: Single 1,889-line file handling all payment events. No dead-letter queue for failed processing.

---

### Flow 6: Unified Enrollment Routing

```
lib/enrollment/unified-enrollment.ts
  → Receives: userId, courseId?, programId?, fundingSource?, programHolderId?
  → Determines enrollment type:
    - courseId only → 'course' → writes to `enrollments`
    - programHolderId or WIOA/WRG funding → 'workforce' → writes to `program_enrollments`
    - default → 'program' → writes to `student_enrollments`
  → Returns: { success, enrollmentId, enrollmentType, table }
```

**Files**: `lib/enrollment/unified-enrollment.ts`
**Tables written**: `enrollments` OR `student_enrollments` OR `program_enrollments` (one of three)
**Issue**: The webhook handler (Flow 5) writes directly to tables, bypassing this unified service. Two enrollment paths exist.

---

### Flow 7: License Access Check (Billing Authority)

```
Any protected action → lib/licensing/billing-authority.ts
  → Read license from `licenses`
  → Determine billing authority:
    - Subscription tiers → Stripe-authoritative (check current_period_end)
    - Trial/pilot/grant/demo → DB-authoritative (check expires_at)
    - Lifetime/one_time/basic → DB-authoritative (perpetual allowed)
  → Check: canceled_at or suspended_at → DENY
  → Check: tier in ALL_KNOWN_TIERS → unknown tier → DENY (fail closed)
  → Return: { allowed, reason, tier, expiresAt }
```

**Files**: `lib/licensing/billing-authority.ts`, `lib/license/enforcement.ts`, `lib/license/access-control.ts`
**Tables read**: `licenses`
**Design**: Fail-closed. Unknown tiers denied. Two billing authorities (Stripe vs DB) with clear rules.

---

### Flow 8: Certificate Issuance

```
Admin triggers POST /api/cert/issue
  → Validate: studentId, programId, studentName, programName
  → Generate certificate number (serial)
  → Generate PDF via lib/certificates/generator
  → Upload PDF to Supabase Storage (certificates bucket)
  → Get public URL
  → Insert into `certificates` table
  → Return { certificateNumber, pdfUrl }
```

**Files**: `app/api/cert/issue/route.ts`, `lib/certificates/generator.ts`
**Tables written**: `certificates`
**Storage**: Supabase Storage (certificates bucket)
**Issue**: No auth check visible in the route handler — uses service role key directly.

---

### Flow 9: Apprentice Hours Summary

```
Student visits hours dashboard
  → GET /api/apprentice/hours-summary
    → Auth: supabase.auth.getUser()
    → Query `student_enrollments` for student's enrollment
      → Join with `programs` for name, slug, total_hours
    → Determine required_hours: enrollment.required_hours → program.total_hours → 2000
    → Query `apprentice_hours_log` for logged hours
    → Calculate: completed, remaining, transfer credits
    → Return { requiredHours, completedHours, transferHours, logs[] }
```

**Files**: `app/api/apprentice/hours-summary/route.ts`
**Tables read**: `student_enrollments`, `programs`, `apprentice_hours_log`
**Issue**: Hours fallback chain (enrollment → program → hardcoded 2000) means different sources can disagree.

---

### Flow 10: Cron — Trial Lifecycle

```
Daily: GET /api/cron/trial-lifecycle (CRON_SECRET auth)
  → Query `licenses` WHERE tier='trial'
  → For each trial:
    - Expiring in 3 days → send warning email, log to license_events
    - Expiring in 1 day → send urgent email, log to license_events
    - Expired (past expires_at) → update status='expired', log to license_events
    - Abandoned (created >7 days ago, never engaged) → log for review
  → Return { processed, warnings, expired, abandoned }
```

**Files**: `app/api/cron/trial-lifecycle/route.ts`
**Tables read/written**: `licenses`, `license_events`
**External calls**: Resend (warning emails)
**Auth**: `CRON_SECRET` header check

---

### Flow Interaction Map

```
                    ┌─────────────┐
                    │   proxy.ts  │ ← Every request
                    │  (497 lines)│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐
        │  LMS Domain│ │ Main  │ │ Supersonic│
        │  /student- │ │ Site  │ │ /supersonic│
        │  portal    │ │       │ │ -fast-cash │
        └────────────┘ └───┬───┘ └───────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
    │ Enroll  │      │  Store  │      │  Trial  │
    │ Flow    │      │ License │      │  Start  │
    └────┬────┘      └────┬────┘      └────┬────┘
         │                │                │
         │           ┌────▼────┐           │
         │           │ Stripe  │           │
         │           │Checkout │           │
         │           └────┬────┘           │
         │                │                │
    ┌────▼────────────────▼────────────────▼────┐
    │         Stripe Webhook Handler            │
    │         (1,889 lines, 9 event types)      │
    └────┬──────────┬──────────┬───────────┬────┘
         │          │          │           │
    ┌────▼───┐ ┌───▼────┐ ┌──▼───┐ ┌────▼─────┐
    │student_│ │program_│ │enroll│ │ licenses │
    │enroll- │ │enroll- │ │ments │ │          │
    │ments   │ │ments   │ │      │ │          │
    └────────┘ └────────┘ └──────┘ └──────────┘
```

---

---

## PHASE 4: Enterprise Hardening Score

Scoring: 1 (absent) → 5 (production-grade). Each dimension assessed against what a $75K buyer or government procurement reviewer would expect.

---

### Dimension 1: Authentication & Authorization — Score: 3/5

**Strengths**:
- Supabase Auth with email/password, Google, Facebook, GitHub OAuth
- `proxy.ts` enforces role-based routing at the edge (497 lines)
- 6 roles: `super_admin`, `admin`, `staff`, `instructor`, `student`, `partner`
- Admin email allowlist for sensitive routes
- Open redirect protection via `validateRedirect()` (9 references)
- SSO support scaffolded (SAML, LDAP, Azure AD env vars present)

**Weaknesses**:
- **18+ unguarded API routes** including `account/delete`, `account/export`, `security/log`, `exams/submit`, `progress`, `dev/seed-courses`
- CSRF protection: 1 reference in entire codebase
- `profiles` table has no defined schema — role column is unconstrained TEXT
- Super admin hardcoded to single email in `proxy.ts`
- Two-factor auth file exists (`lib/auth/two-factor.ts`) but unclear if enforced

---

### Dimension 2: Data Integrity & Schema — Score: 2/5

**Strengths**:
- `licenses` table has CHECK constraints on `tier` and `status`
- `apprentices` table has CHECK constraint on `status`
- Billing authority fails closed on unknown tiers
- 546 RLS policy statements across migrations

**Weaknesses**:
- **Three enrollment tables** with overlapping purpose, no clear canonical
- **Two user tables** (`profiles` vs `user_profiles`) both actively used
- **Two audit log tables** (`audit_logs` vs `audit_log`)
- `student_enrollments` has no FK constraints, no indexes, no unique constraint on `(student_id, program_id)`
- `enrollments` status is unconstrained TEXT (no CHECK)
- `profiles` table created via dashboard — no migration defines its schema
- 753 unique table references in code vs ~45 tables in schema.sql — massive gap
- Baseline migration is a no-op ("428 tables already exist")
- No schema validation or drift detection

---

### Dimension 3: Input Validation — Score: 2/5

**Strengths**:
- 279 Zod validation references across API routes
- `lib/api/validation-schemas.ts` exists
- Email validation in trial flow
- Stripe webhook signature verification

**Weaknesses**:
- 926 API routes, only 279 validation references — ~70% of routes may lack input validation
- No centralized validation middleware
- Many routes accept `req.json()` without schema validation
- `as any` used 255 times — type safety bypassed frequently

---

### Dimension 4: Security Headers & Transport — Score: 4/5

**Strengths**:
- HSTS with preload (max-age=63072000)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy defined (default-src 'self')
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Referrer-Policy: origin-when-cross-origin
- Preview environments get noindex/nofollow

**Weaknesses**:
- CSP includes `'unsafe-eval'` and `'unsafe-inline'` for scripts — weakens CSP significantly
- `img-src *` allows loading images from any origin
- `media-src *` allows loading media from any origin
- No report-uri for CSP violations

---

### Dimension 5: Testing — Score: 1/5

**Strengths**:
- 57 test files exist
- Playwright configured for E2E
- Vitest configured for unit tests
- Indiana compliance test exists

**Weaknesses**:
- 57 tests for 4,696 source files = ~1.2% coverage
- No evidence tests are run in CI (CI workflow exists but test step unclear)
- 926 API routes with no API-level test suite
- Stripe webhook handler (1,889 lines) has 1 spec file
- No integration tests for enrollment flows
- No load testing

---

### Dimension 6: Observability — Score: 3/5

**Strengths**:
- Structured logger (`lib/logger.ts`) with dev/prod formatting
- 1,553 log statements across API routes
- Sentry integration (86 references)
- GA4 analytics with correlation IDs
- `license_events` table for audit trail
- `audit_logs` table for action tracking
- Admin monitoring endpoints exist

**Weaknesses**:
- No centralized error tracking dashboard beyond Sentry
- No distributed tracing (correlation IDs exist but no trace propagation between services)
- No alerting on error rate spikes
- No SLO/SLA monitoring
- Console.log still used alongside structured logger

---

### Dimension 7: Compliance (FERPA/WIOA/RAPIDS) — Score: 3/5

**Strengths**:
- 12 FERPA pages, 25 compliance pages
- WIOA eligibility tracking (9 API routes)
- RAPIDS apprentice data migration exists
- Drug testing module
- SSN encryption (`lib/security/ssn-helper.ts`)
- GDPR support (26 references)
- Attendance tracking for compliance
- Certificate revocation support with audit view

**Weaknesses**:
- SSN encryption key falls back to `crypto.randomBytes(32)` if env var missing — different key per cold start = data loss
- No FERPA access logging (who viewed what student data, when)
- Compliance test coverage: 1 test file
- No automated compliance reporting
- WIOA/RAPIDS integration appears scaffolded but not verified against live systems

---

### Dimension 8: Operational Readiness — Score: 2/5

**Strengths**:
- 17 cron jobs for lifecycle management
- Netlify deployment with auto-deploy from GitHub
- `netlify.toml` with build configuration
- CI integrity gates (redirects, analytics, self-service policy)
- 10 GitHub Actions workflows

**Weaknesses**:
- **18+ test/debug/seed endpoints deployed to production** — `dev/seed-courses`, `debug/supabase`, `run-all-tests`, `simulate-user-journey`, `test-webhook`, etc.
- No database backup workflow active (`.github/workflows-disabled-all/db-backup.yml`)
- No disaster recovery plan
- No runbook for incident response
- No staging environment documented
- 340 env vars with no runtime validation of which are required vs optional
- `workers/` directory is empty — autopilot workers referenced but not present

---

### Dimension 9: Code Quality & Maintainability — Score: 2/5

**Strengths**:
- TypeScript throughout
- ESLint configured with custom rules (`no-toplevel-api-clients`, `no-unguarded-search-params`)
- Prettier configured
- Unified enrollment service attempts to abstract table complexity
- Billing authority is well-designed (fail-closed, documented tiers)

**Weaknesses**:
- 255 `as any` type bypasses
- Stripe code spread across 9+ locations
- Enrollment logic in both webhook handler AND unified service (two paths)
- 1,889-line webhook handler — single file, no decomposition
- `lib/` has 98 subdirectories — many with 1-2 files, no clear module boundaries
- Duplicate files: `lib/license-guard.ts` + `lib/licenseGuard.ts` + `lib/license/` directory
- 307 dependencies in package.json
- Many autopilot-generated pages likely contain placeholder content

---

### Summary Scorecard

| # | Dimension | Score | Risk Level |
|---|---|---|---|
| 1 | Authentication & Authorization | 3/5 | Medium |
| 2 | Data Integrity & Schema | 2/5 | **High** |
| 3 | Input Validation | 2/5 | **High** |
| 4 | Security Headers & Transport | 4/5 | Low |
| 5 | Testing | 1/5 | **Critical** |
| 6 | Observability | 3/5 | Medium |
| 7 | Compliance (FERPA/WIOA/RAPIDS) | 3/5 | Medium |
| 8 | Operational Readiness | 2/5 | **High** |
| 9 | Code Quality & Maintainability | 2/5 | **High** |
| | **Overall** | **22/45 (49%)** | |

**Enterprise readiness verdict**: Not ready for government/enterprise procurement without remediation. The platform has strong architectural intent (billing authority, unified enrollment, correlation IDs, structured logging) but execution gaps in schema integrity, testing, and operational hygiene.

---

---

## PHASE 5: Required Corrections

Prioritized by risk. Each item includes the specific files to change and the nature of the fix.

---

### P0 — Must Fix Before Sale (Blocks Procurement)

#### 5.1 Remove Test/Debug/Seed Endpoints from Production

**Risk**: 32 test endpoints deployed to production. Several can seed data, run tests, or expose internal state.

**Files to delete** (or gate behind `NODE_ENV !== 'production'`):
```
app/api/test-get-students/route.ts
app/api/test-supersonic-fast-cash/route.ts
app/api/test-webhook/route.ts
app/api/test-dashboards/route.ts
app/api/test-license-enforcement/route.ts
app/api/test-user-flows/route.ts
app/api/test-admin-board/route.ts
app/api/test-partner-integrations/route.ts
app/api/test-production-ready/route.ts
app/api/test-compliance/route.ts
app/api/test-insert/route.ts
app/api/test-multi-tenant/route.ts
app/api/test-supabase/route.ts
app/api/test-everything/route.ts
app/api/quick-test/route.ts
app/api/run-all-tests/route.ts
app/api/sentry-test/route.ts
app/api/debug/supabase/route.ts
app/api/dev/seed-courses/route.ts
app/api/simulate-user-journey/route.ts
app/api/autopilot-test-users/route.ts
app/api/autopilots/run-tests/route.ts
app/api/demo/seed/route.ts
app/api/workone/seed/route.ts
app/api/admin/seed/route.ts
```

**Fix**: Delete these files or add a production guard:
```typescript
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not available' }, { status: 404 });
}
```

---

#### 5.2 Fix SSN Encryption Key Fallback

**Risk**: `lib/security/ssn-helper.ts` line 9 generates a random key if `SSN_ENCRYPTION_KEY` is missing. On serverless (Netlify), each cold start gets a different key. Any SSN encrypted without the env var is permanently unrecoverable.

**File**: `lib/security/ssn-helper.ts`

**Fix**: Replace fallback with hard failure:
```typescript
const ENCRYPTION_KEY = process.env.SSN_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error('SSN_ENCRYPTION_KEY is required — SSN operations disabled');
}
```

---

#### 5.3 Add Indexes to `student_enrollments`

**Risk**: 33 code references query this table with no indexes. Performance degrades with scale.

**Migration**:
```sql
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student 
  ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_program 
  ON student_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_status 
  ON student_enrollments(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_enrollments_stripe_session 
  ON student_enrollments(stripe_checkout_session_id) 
  WHERE stripe_checkout_session_id IS NOT NULL;
```

---

#### 5.4 Add FK Constraints to `student_enrollments`

**Risk**: No referential integrity. Orphaned rows possible.

**Migration**:
```sql
ALTER TABLE student_enrollments 
  ADD CONSTRAINT fk_student_enrollments_student 
  FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

Note: `program_id` FK depends on whether it references `programs` or `training_programs` — verify in production first.

---

### P1 — Should Fix Before Sale (Buyer Will Ask)

#### 5.5 Document the Three Enrollment Tables

**Risk**: A buyer's technical reviewer will ask "which table is the enrollment table?" and find three answers.

**Fix**: Add a `docs/DATA-MODEL.md` or a comment block in `lib/enrollment/unified-enrollment.ts` that explicitly states:
- `enrollments` = course-level access (LMS)
- `student_enrollments` = program-level with hours tracking (workforce/apprenticeship)
- `program_enrollments` = paid training program enrollment (Stripe-linked)
- The webhook handler writes to all three depending on `metadata.kind`
- `unified-enrollment.ts` is the intended abstraction layer but is not used by webhooks

---

#### 5.6 Add Status CHECK Constraints

**Migration**:
```sql
-- enrollments
ALTER TABLE enrollments 
  ADD CONSTRAINT chk_enrollments_status 
  CHECK (status IN ('active','completed','expired','refunded','suspended','pending','dropped'));

-- student_enrollments
ALTER TABLE student_enrollments 
  ADD CONSTRAINT chk_student_enrollments_status 
  CHECK (status IN ('active','completed','expired','suspended','pending','withdrawn'));
```

---

#### 5.7 Consolidate Stripe Client Code

**Risk**: Stripe initialization code in 9+ locations. Different error handling, different client configurations.

**Files to audit**:
```
lib/store/stripe.ts
lib/store/stripe-products.ts
lib/billing/stripe.ts
lib/new-ecosystem-services/stripe.ts
lib/stripe-config.ts
lib/env/stripe-validation.ts
lib/payments/stripe.ts
lib/integrations/stripe.ts
lib/stripe/stripe-client.ts
```

**Fix**: Designate `lib/stripe/stripe-client.ts` as canonical. All others should import from it. Add CI gate similar to analytics integrity check.

---

#### 5.8 Decompose Webhook Handler

**Risk**: 1,889-line single file. Untestable, hard to review, single point of failure.

**File**: `app/api/webhooks/stripe/route.ts`

**Fix**: Extract each `case` block into a handler module:
```
lib/webhooks/handle-program-enrollment.ts
lib/webhooks/handle-donation.ts
lib/webhooks/handle-apprenticeship-enrollment.ts
lib/webhooks/handle-license-purchase.ts
lib/webhooks/handle-subscription-change.ts
lib/webhooks/handle-invoice.ts
lib/webhooks/handle-refund.ts
```

Route handler becomes a dispatcher (~100 lines).

---

#### 5.9 Remove Deprecated Webhook Handler

**File**: `app/api/stripe/webhook/route.ts` (552 lines)

**Fix**: Delete after confirming no Stripe webhook endpoints point to `/api/stripe/webhook`. The canonical path is `/api/webhooks/stripe`.

---

### P2 — Should Fix Post-Sale (Technical Debt)

#### 5.10 Resolve `profiles` vs `user_profiles`

**Scope**: 830 + 39 = 869 code references across two tables.

**Recommendation**: `profiles` is the live table (830 refs). Migrate the 39 `user_profiles` references to use `profiles`. Then drop `user_profiles` or make it a view.

---

#### 5.11 Resolve `audit_logs` vs `audit_log`

**Scope**: 57 + 16 = 73 references.

**Recommendation**: Consolidate to `audit_logs` (57 refs). Update 16 `audit_log` references. Keep domain-specific audit tables (`franchise_audit_log`, etc.) as-is.

---

#### 5.12 Add Unique Constraint to `student_enrollments`

**Migration**:
```sql
-- Prevent duplicate enrollments for same student+program
ALTER TABLE student_enrollments 
  ADD CONSTRAINT uq_student_enrollments_student_program 
  UNIQUE (student_id, program_id);
```

**Prerequisite**: Check for existing duplicates first:
```sql
SELECT student_id, program_id, COUNT(*) 
FROM student_enrollments 
GROUP BY student_id, program_id 
HAVING COUNT(*) > 1;
```

---

#### 5.13 Reduce `as any` Usage

**Scope**: 255 instances across `app/`, `lib/`, `components/`.

**Fix**: Prioritize files with the most instances. Generate proper types from Supabase schema:
```bash
npx supabase gen types typescript --project-id <project-id> > lib/database.types.ts
```

---

#### 5.14 Add CI Gate for Test Endpoints

**Fix**: Add to `scripts/check-no-test-endpoints.mjs`:
```javascript
const testPatterns = ['/api/test-', '/api/debug/', '/api/dev/', '/api/seed', '/api/simulate-', '/api/quick-test', '/api/run-all-tests'];
// Scan app/api for matching directories, fail CI if found
```

Add to `integrity-gate.yml`.

---

#### 5.15 Enable Database Backups

**File**: `.github/workflows-disabled-all/db-backup.yml`

**Fix**: Move to `.github/workflows/db-backup.yml` and configure Supabase project backup schedule. Verify Supabase plan includes point-in-time recovery.

---

### Correction Priority Matrix

| Priority | Items | Effort | Impact |
|---|---|---|---|
| **P0** | 5.1–5.4 | 2-4 hours | Blocks sale if discovered |
| **P1** | 5.5–5.9 | 1-2 days | Buyer will negotiate price down |
| **P2** | 5.10–5.15 | 1-2 weeks | Technical debt, post-sale cleanup |

---

## Report Complete

### Key Findings

1. **Scale**: 4,696 files, 926 API routes, 1,574 pages, 753 table references, 340 env vars. This is a large system.

2. **Architecture**: Well-intentioned design with billing authority, unified enrollment, correlation IDs, structured logging, and CI integrity gates. The architectural patterns are sound.

3. **Execution gaps**: Three enrollment tables, two user tables, 32 test endpoints in production, no database backup, 1% test coverage, SSN encryption key fallback.

4. **Enterprise score**: 22/45 (49%). Security headers and observability are decent. Schema integrity, testing, and operational readiness need work.

5. **Remediation path**: P0 items (4 fixes) can be done in a day. P1 items (5 fixes) in a week. This brings the system to a defensible state for procurement review.
