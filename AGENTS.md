# OpenHands Agent Memory - Elevate LMS

## ACTIVE HANDOFF — WEBSITE DESIGN PAGES (Priority Task, 2026-08-23)

The AI inference architecture is DONE (see below). The next agent's job is the
**public website design layer** — this was explicitly deferred and is now the
top priority.

### What is already finished (do NOT rebuild)
- Cloudflare Workers AI verified live (token has Workers AI permission; account ff0d5ca582b5911a626ba012935cf3ec)
- Cloudflare + Groq credentials stored in BOTH Supabase `platform_secrets` (scope=runtime) and GitHub Actions secrets
- Self-hosted vLLM worker + `ElevateProvider` + Northflank provisioner on main (commit 456d9e620a)
- Provider order configurable via `AI_PROVIDER_ORDER`; default: elevate → cloudflare → groq → gemini → google → anthropic → azure → openai
- Deterministic Course Builder checkpointing; `generation_status` uses canonical `queued` value
- OpenAI is optional everywhere

### THE TASK: Restore the premium website experience
Per the MASTER PROJECT PROMPT below, audit and enhance EVERY public page:
1. **Homepage** — hero → proof → career pathways → how it works → funding → success stories → employers → apply
2. **Program pages** — each must be a complete sales/enrollment page: hero image, outcomes, pay, duration, credential, funding, price, BNPL calculator, apply CTA
3. **Header/footer pages** — no stubs, no dead links
4. **Testing/funding/about/landing pages** — no "coming soon", no placeholders

### Rules for this task
- Do NOT replace the site with a template — enhance existing structure
- Every page: premium hero, real photography (see `config/efhImageMap.ts` + Supabase image bucket), clear CTA, SEO metadata, mobile-optimized
- No fake data, no lorem ipsum, no generic icon-only sections
- Follow the ROUTING ARCHITECTURE rules below (canonical routes, portal subdomains)
- Verify with `pnpm typecheck`, `pnpm lint`, `pnpm build` before committing

---

## MASTER PROJECT PROMPT: ELEVATE FOR HUMANITY OPERATING SYSTEM — FINAL PRODUCTION COMPLETION

### ROLE
Act as:
- Senior Full Stack Engineer
- Senior UI/UX Website Designer
- DevOps Engineer
- QA Engineer
- Database Architect
- Workforce Technology Architect

### MAIN OBJECTIVE
**Restore the original Elevate premium website experience while keeping the new engineering improvements.**

The issue:
- Too many pages
- Too text heavy
- Too generic LMS template
- Missing visual storytelling
- Missing pictures
- Missing emotional connection

The goal: Combine the BEST of original Elevate design + New engineering improvements

Create:
- Premium workforce institution feel
- Modern university feel
- Fortune 500 learning platform feel

**NOT a generic course catalog.**

---

## CRITICAL WEBSITE DESIGN RULE

Do NOT replace the website with a template. Keep original structure. Enhance it.

Every public page must answer:
1. What is this?
2. Why should I care?
3. Why trust Elevate?
4. What do I do next?

Every page requires:
- ✓ Premium hero banner
- ✓ Real photography
- ✓ Visual storytelling
- ✓ Clear CTA buttons
- ✓ Pricing where applicable
- ✓ BNPL/payment calculator where applicable
- ✓ Application buttons
- ✓ Enrollment flow
- ✓ Mobile optimization
- ✓ SEO metadata
- ✓ No placeholder text
- ✓ No generic icon-only sections

---

## VISUAL EXPERIENCE REQUIREMENTS

Replace text-heavy layouts. Use:
- Large career pathway cards
- Real student/training images
- Program photos
- Certification graphics
- Process timelines
- Before/after outcomes
- Success stories
- Employer proof
- Funding badges

Create Netflix-style scrolling: Each section visually different. Users should naturally continue scrolling.

---

## HOMEPAGE FLOW
Hero → Proof → Career Pathways → How It Works → Funding → Success Stories → Employers → Apply

Preserve original homepage identity. Do NOT remove:
- Hero experience
- Animations
- Brand personality
- Career pathways
- Funding sections
- Employer trust
- Student journey

Enhance: Images, Motion, Cards, Spacing, Conversion flow

---

## PROGRAM PAGES (Must be complete sales/enrollment pages)

Each program needs:
- Hero image
- Program overview
- Career outcome
- Average pay
- Duration
- Credential earned
- Funding options
- Price
- Deposit
- Weekly payment calculator
- BNPL option
- Apply button
- Book appointment
- Student dashboard connection
- LMS connection

**Programs include:**
- Healthcare: Medical Assistant, Phlebotomy, EKG, Pharmacy Tech, Billing Coding, Patient Care Tech, Medical Admin, EHR
- Trades: HVAC, EPA 608, Building Technician, CDL partners, Welding if active
- Beauty Apprenticeship: Barber, Cosmetology, Esthetics, Manicurist
- Testing: ACT WorkKeys, Certiport, CareerSafe, CPR, EPA

---

## STRIPE PAYMENT SYSTEM AUDIT

Every program, testing product, course, bundle, store product must have:
- Database product
- Stripe product
- Payment link/checkout
- Dashboard connection

Verify endpoints:
- /api/stripe/create-checkout-session
- /api/stripe/create-payment-link
- /api/stripe/webhook
- /api/payments/status

Webhook handles: payment success, payment failure, checkout complete

After payment: Update dashboard, enrollment, binder, CRM

---

## NO AUTOMATIC STUDENT PAYMENTS

Use:
- Stripe payment links
- Invoices
- Manual payment schedules

Dashboard highlights:
- PAY NOW
- NEXT PAYMENT
- PAST DUE
- PAID

---

## BNPL CALCULATOR

Every self-pay program needs:
- Full price
- Deposit
- Remaining balance
- Weekly estimate
- Payment button
- Funding option

---

## APPLICATION FLOW

Website visitor → Paris AI Interview → Application → Account created → Digital binder created → Documents uploaded → Handbook signed → Payment/funding verified → LMS unlocked → Training starts → Credential earned → Career placement

**Paris AI must:**
- Interview applicants
- Determine needs
- Recommend program
- Collect information
- Create application
- Create binder checklist
- Schedule appointments
- Send follow-ups

Connect: Calendar, CRM, Email, SMS, Dashboard

---

## ADMIN DASHBOARD

Must manage:
- Students
- Applications
- Courses
- Programs
- Payments
- Testing
- Employees
- CRM
- SOPs
- Apprenticeships
- Host Shops
- Employers
- Reports
- Store
- Trials

**No fake data. Database connected only.**

---

## DEV STUDIO

Must include:
- Website builder
- Course builder
- Program builder
- Store builder
- SOP builder
- Workflow builder
- AI tools
- Preview mode
- Build logs
- Deployment health
- Environment checks

Support: Draft, Preview, Publish

---

## TESTING CENTER

Manages:
- Registration
- Payments
- Scheduling
- Rooms
- Computers
- Proctors
- Scores
- Credentials

Testing products: ACT WorkKeys, EPA, CPR, Certiport, CareerSafe, NHA where approved

---

## HOST SHOP PORTAL

Apprenticeship system connects host shops:
- Login
- See apprentices
- View syllabus
- Monitor RTI
- Track OJL
- Approve hours
- Sign competencies

Geofence: Student clocks in → Host approves → Admin sees

---

## STORE SYSTEM

Must show:
- Enterprise
- Small Business
- Single Use

Each product: Demo, Video, 14 day trial, Checkout, Dashboard access

---

## ADZUNA CAREER ENGINE

Integrate Adzuna as workforce placement (secure backend only).

Environment:
- ADZUNA_APP_ID
- ADZUNA_APP_KEY
- ADZUNA_COUNTRY=us

Endpoint: https://api.adzuna.com/v1/api/jobs/us/search/1

Connect: Student credentials, Career goals, Resume, Job matching, Applications, Outcomes reporting

---

## DATABASE + MIGRATIONS

Audit migrations. Run all. Verify:
- Tables exist
- Columns exist
- Indexes exist
- Seed data active
- No drift

Do not skip migration errors. Fix them.

---

## NORTHFLANK PRODUCTION AUDIT

Enter Northflank and audit:
- Build logs
- Docker logs
- Runtime logs
- Health checks
- Container startup
- Memory errors
- Warnings
- Failed routes
- Environment variables

Fix:
- TypeScript errors
- Imports
- Route conflicts
- Docker failures
- Runtime crashes
- Warnings that affect production

---

## BUILD REQUIREMENTS

Trigger all builds: Marketing, Admin, LMS

Run:
- pnpm typecheck
- pnpm lint
- pnpm build

If scoped: build:marketing, build:admin, build:lms

**ALL MUST BE GREEN.**

---

## FINAL REPORT REQUIRED

Return:
1. Pages audited
2. Pages fixed
3. UI improvements
4. Images restored
5. Stripe status
6. Database migrations
7. Dashboard connections
8. LMS connections
9. Northflank errors fixed
10. Runtime status
11. Build results
12. Remaining credential-only issues

**SUCCESS MEANS:**
- Premium website restored
- Backend power remains
- No dead pages
- No broken checkout
- No disconnected dashboards
- No fake data
- No build errors
- No runtime failures
- Production ready

---

## VERIFIED PRODUCTION MARKETING DEPLOYMENT

### Active Production Deployment
| Field | Value |
|-------|-------|
| Service | elevate-marketing |
| Deployment ID | 7757897c64 |
| Git SHA | 36e59cc23c6e82a0713c8042b150d6e74f38c549 |
| Source | GitHub Actions pipeline (CD) |
| Health Verification | Pipeline verified |
| Commit | fix: update health check to use root path |

### Stale Deployments (TERMINATED)
- elevate-marketing-6df5655d8d (manual/unknown source)
- elevate-marketing-58c79d89c6
- elevate-marketing-865d584596
- elevate-marketing-7dfdf5c5c5

### Deployment Rules
1. ONLY trust deployments with Reason: "CD" (GitHub Actions pipeline)
2. DO NOT use deployments with blank Reason (manual/unknown)
3. DELETE stale/duplicate deployments to avoid conflicts
4. Keep only ONE active deployment revision per service

### Northflank API
- Team ID: 6a1e9a33da6e472da6551c07
- Project ID: 01j5e5b3e3v8z9z5z6q3t9a
- Service: elevate-marketing
- Domain: www.elevateforhumanity.org

---

## WEBSITE PAGE AUDIT CHECKLIST

Audit EVERY:
- Header page
- Footer page
- Program page
- Testing page
- Landing page

Find and fix:
- ❌ Stub pages
- ❌ Missing hero images
- ❌ Missing CTAs
- ❌ Broken buttons
- ❌ Fake content
- ❌ Generic icons
- ❌ Missing pricing
- ❌ Missing application links
- ❌ Missing checkout

No page should say: "Coming soon", "Back home only", "Placeholder", "Lorem ipsum"

---

## AUDIT SYSTEM FOR ERRORS

### ⚠️ CRITICAL RULE: Always do LINE-BY-LINE audits when investigating issues

---

### FULL AUDIT PROMPT (Use This Every Time)

```
AUDIT LINE BY LINE - Side by side comparison of [FILE_A] and [FILE_B]

RULES:
1. Use `diff -y` or `paste` to show BOTH files side by side, line by line
2. For EVERY line that differs (EVEN comments), report:
   - Exact line numbers in each file
   - Exact content of both lines  
   - Flag as ⚠️ ISSUE if different
   - Flag as ✅ EXPECTED if intentionally different (e.g., different app names, URLs, paths)
3. Do NOT skip ANY differences - even 1 character matters
4. After showing all differences, provide a FIXED summary table
5. Ask before making any fixes
6. ITERATIVE FIXING: After each fix, RE-AUDIT to verify fixed and check for MORE issues
7. Keep auditing until system is as expected (all fixed, all matching, all working)
```

---

### BUILD FAILURE CHECKLIST

```bash
# 1. Lockfile version vs pnpm version
grep "lockfileVersion" pnpm-lock.yaml
grep "pnpm@" Dockerfile.*

# 2. Environment variable consistency
grep "ENV" Dockerfile.* | sort

# 3. Dependency installation
grep "pnpm install" Dockerfile.*

# 4. Port conflicts
grep -E "PORT|EXPOSE|8080|3000" Dockerfile.*

# 5. Memory settings
grep "max-old-space-size" Dockerfile.*
```

---

### VERSION MATCHING RULES

| Lockfile | pnpm Version |
|----------|--------------|
| lockfileVersion: '6.0' | pnpm@9.x |
| lockfileVersion: '9.0' | pnpm@10.x |

**NEVER use pnpm@10.x with lockfileVersion '6.0'**

---

### COMMON BUILD ISSUES & ROOT CAUSES

| Issue | Check | Fix |
|-------|-------|-----|
| Memory spike | NODE_OPTIONS vs requirements | Match memory to app size |
| Lockfile error | pnpm version vs lockfileVersion | Match versions |
| Module not found | @ alias in standalone | Inline dependencies |
| Cache miss | Cache invalidation marker | Add RUN echo after FROM |
| Build timeout | Single worker vs parallel | CI=true, single worker |

---

### FILES TO ALWAYS CHECK FOR SYNC

- Dockerfile.northflank-lms
- Dockerfile.northflank-admin
- package.json (workspace structure)
- pnpm-lock.yaml
- apps/admin/server.js
- apps/server.js

---

### ROUTING ARCHITECTURE (Updated 2024)

#### Portal Routing (middleware.ts)
All portal paths on www.elevateforhumanity.org are redirected to subdomains:
- /lms/, /student/, /instructor/, /employer/, /apprentice/, /parent-portal/, /workforce/, /cosmetology-host-shop/ → app.elevateforhumanity.org
- /admin/* → admin.elevateforhumanity.org

CRITICAL: DO NOT add admin/lms/apprentice redirects to canonical-routes.json or next.config.mjs — they conflict with portal routing and cause 404s. All portal paths should go through the subdomain.

#### Nav Routing (lib/navigation/routes.ts + site-nav.config.ts)
- Single source of truth: lib/navigation/routes.ts for all canonical routes
- lib/navigation/site-nav.config.ts for all nav links
- NEVER add redirect patching for broken nav links — fix the nav link itself

#### Common Route Bugs (CHECK BEFORE ADDING REDIRECTS)
- programsBeauty: MUST be /barber-and-beauty-apprenticeship (NOT /programs/beauty-cosmetology)
- employers: MUST be /employer (NOT /employers — page is at /employer)
- programsIT: MUST be /programs/it-help-desk (WITH hyphen)
- aboutApprovals: MUST be /approvals (NOT /about/approvals)
- aboutLocations: Use /about (NOT /about/locations — doesn't exist)
- testing: Use /testing (NOT /testing/testing-center — doesn't exist)
- fundingVocRehab: Use /funding/state-programs (NOT /funding/voc-rehab — doesn't exist)
- successStories: Use /success-stories (NOT /success — doesn't exist)

#### Program Routes
- Static pages: /programs/[program]/page.tsx (e.g., /programs/cna)
- Dynamic routes: /programs/[program] catch-all (handles 30+ programs via data files)
- Always check data/programs/index.ts for valid slugs

#### Portal URLs in Marketing Nav
For links to portal features, use external URLs:
- LMS: https://app.elevateforhumanity.org/lms
- Student dashboard: https://app.elevateforhumanity.org/learner/dashboard
- Employer dashboard: /employer (or /employers/post-job for job posting)
- Admin: NEVER link from marketing nav to /admin/* — use portal subdomain

---

### REMEMBER

**You are too fast. Slow down and audit line by line.**

Every character matters. A misplaced `#` or wrong version number can cause hours of debugging.
