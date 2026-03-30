# Dead Code & Redirect Audit

**Date:** 2025-06  
**Scope:** Full platform — routes, components, lib modules, dependencies, DB schema refs  
**Method:** Static analysis via grep, script runners, and redirect graph traversal

---

## Summary Counts

| Category | Count |
|---|---|
| Shadowed pages (page.tsx exists but next.config.mjs redirect fires first) | **75** |
| Redirect chains (A→B→C, user hits 2 hops) | **17** |
| Self-referential redirect (A→A, infinite loop) | **1** |
| Redirects pointing to non-existent destinations | **20** |
| Deprecated shim files still receiving imports | **8** |
| Zero-reference root components (`components/*.tsx`) | **50** |
| Zero-reference lib modules | **~30** |
| Zero-reference `lib/courses/` files (HVAC legacy) | **20** |
| Packages in `package.json` with zero app/lib imports | **13** |
| DB tables referenced in code with no migration | **116 of 117** |

---

## 1. Redirect Issues

### 1a. Self-Referential Redirect (infinite loop)

```
/admin/courses/create  →  /admin/courses/create
```

**Fix:** Remove this entry from `next.config.mjs`. The page `app/admin/courses/create/page.tsx` exists and works — the redirect is a no-op that adds a round-trip.

---

### 1b. Redirect Chains (2+ hops — fix by pointing directly to final destination)

| Entry | Chain |
|---|---|
| `/admin/course-studio-ai` | → `/admin/course-generator` → `/admin/courses/create` |
| `/admin/marketplace` | → `/admin/store` → `/admin/dashboard` |
| `/fundingimpact` | → `/impact` → `/about` |
| `/ai-studio` | → `/admin` → `/admin/dashboard` |
| `/preview/video-quiz` | → `/admin` → `/admin/dashboard` |
| `/creator/analytics` | → `/admin` → `/admin/dashboard` |
| `/franchise/office/:path*` | → `/admin` → `/admin/dashboard` |
| `/leaderboard` | → `/lms/dashboard` → `/learner/dashboard` |
| `/calculator/revenue-share` | → `/admin` → `/admin/dashboard` |
| `/partner/dashboard` | → `/partner` → `/partner-portal` |
| `/partner/courses` | → `/partner` → `/partner-portal` |
| `/partner/students` | → `/partner` → `/partner-portal` |
| `/admin/autopilots` | → `/admin/autopilot` → `/admin/dashboard` |
| `/admin/analytics-dashboard` | → `/admin/analytics` → `/admin/reports` |
| `/partner/programs` | → `/partner/dashboard` → `/partner` |
| `/admin/course-generator` | → `/admin/courses/create` → `/admin/courses/create` (hits loop) |

**Fix:** Update each source to point directly to the final destination.

---

### 1c. Redirects Pointing to Non-Existent Destinations

These redirects will 404 at the destination:

| Source | Destination | Issue |
|---|---|---|
| `/lms/messages/new` | `/lms/messages` | No `app/lms/(app)/messages/page.tsx` |
| `/lms/messages/support/new` | `/lms/messages` | Same |
| `/lms/catalog` | `/lms/courses` | No `app/lms/(app)/courses/page.tsx` at that path |
| `/student-portal/messages` | `/lms/chat` | No `/lms/chat` page |
| `/student-portal/settings` | `/lms/settings` | No `/lms/settings` page |
| `/learner/courses` | `/lms/courses` | No page at that exact path |
| `/lms/my-courses` | `/lms/courses` | Same |
| `/leaderboard` | `/lms/dashboard` | No `/lms/dashboard` page |
| `/partner/dashboard` | `/partner` | No `app/partner/page.tsx` |
| `/partner/courses` | `/partner` | Same |
| `/partner/students` | `/partner` | Same |
| `/admin/staff` | `/admin/users?role=staff` | No `/admin/users` page |
| `/ai-studio` | `/admin` | No `app/admin/page.tsx` (only `app/admin/dashboard`) |
| `/preview/video-quiz` | `/admin` | Same |
| `/creator/analytics` | `/admin` | Same |
| `/franchise/office/:path*` | `/admin` | Same |
| `/calculator/revenue-share` | `/admin` | Same |
| `/clear-pathways-hero.jpg` | `/clear-path-main-image.jpg` | Image redirect — no page |
| `/sitemap-page` | `/sitemap.xml` | Not a page route |

**Fix:** Update destinations to real pages (e.g. `/admin` → `/admin/dashboard`).

---

### 1d. Shadowed Pages (page.tsx exists but redirect fires first — 75 total)

Next.js redirects run before page rendering. These directories have `page.tsx` files that are **unreachable** because a matching redirect exists in `next.config.mjs`:

**Admin (20 shadowed routes):**
`/admin/governance` (9 pages), `/admin/email-marketing` (5 pages), `/admin/social-media` (2 pages), `/admin/copilot` (2 pages), `/admin/video-generator`, `/admin/autopilot`, `/admin/ai-studio`, `/admin/ai-console`, `/admin/portal-map`, `/admin/advanced-tools`, `/admin/sap`, `/admin/analytics`, `/admin/certifications`, `/admin/crm`, `/admin/campaigns`, `/admin/course-generator`, `/admin/courses/builder`, `/admin/licenses`, `/admin/licensing`, `/admin/reporting`

**Other (notable):**
`/employer-portal` (root only — sub-routes are live), `/studio`, `/forgot-password`, `/register`, `/team`, `/partner/dashboard`, `/student-portal/handbook`, `/student/handbook`

**Fix options:**
- **Delete** the `page.tsx` if the redirect is permanent and the page content is superseded.
- **Remove** the redirect if the page should be live.
- For `/admin/governance` specifically: the redirect sends to `/admin/compliance` but 9 governance sub-pages exist and are internally linked from `app/store/licensing/enterprise/page.tsx`. Either restore the governance section or update those links.

---

### 1e. Portal Terminology Inconsistency (tracked UX debt)

- `/employer-portal/*` (14 pages) — root redirects to `/employer/dashboard` but sub-routes (`/jobs`, `/candidates`, `/wotc`, etc.) are live and linked directly. No redirect covers sub-routes.
- `/partner-portal` — live page, but canonical is supposed to be `/partner/dashboard` (which itself redirects back to `/partner-portal`). Circular.
- `/student-portal` — live, but AGENTS.md canonical is `/learner/dashboard`. 88 inbound `href` links still point to `/lms/courses` vs 2 to `/lms/programs`.

---

## 2. Dead Components (`components/`)

50 root-level components with **zero imports** anywhere in `app/`, `components/`, or `lib/`:

### Avatar / AI persona system (entire subsystem unused)
`AIAssistantBubble`, `AvatarChatBar`, `AvatarCourseGuide`, `AvatarProvider`, `AvatarVideoOverlay`, `GlobalAvatar`, `PageAudio`, `PageAvatar`, `PageAvatarGuide`

### Feature shells never wired up
`ARTrainingModules`, `BlockchainCredentialVerification`, `CopyrightProtection`, `DeviceCompatibility`, `EmployerTalentPipeline`, `EnhancedDashboard`, `FacebookPixel`, `FrameworkSettingsPanel`, `IndustryPartnershipPortal`, `JobPlacementTracking`, `MobileVoiceOver`, `ModerationDashboard`, `OrchestratorAdmin`, `RealTimeCollaboration`, `RouteGuard`, `ScraperDetection`, `ScrollUnlocker`, `SecurityMonitor`, `SelfHostedAnalytics`, `SocialLearningCommunity`, `StudyGroups`, `TikTokStyleVideoPlayer`, `UniversalCoursePlayer`, `VersionGuard`

### Utility/UI components never used
`AutoPlayTTS`, `LazyComponents`, `LazyLoad`, `LiveChatWidget`, `NewsletterSignup`, `OnboardingPrompt`, `OptimizedComponent`, `PageFlow`, `PageManager`, `PageTemplate`, `PerformanceMonitor`, `PushNotificationService`, `ReportContentButton`, `ReportProduct`, `ResourceLibrary`, `RotatingHeroBanner`, `SocialMediaHighlight`, `StudentFeedbackRating`, `SubscriptionManager`, `SurveyModal`, `VoiceoverPlayer`, `WelcomeAudio`

**Fix:** Delete all 50. None are imported anywhere. Run `git grep` before deleting to confirm no dynamic imports via string interpolation.

---

## 3. Dead `lib/` Modules

### Email system — entire `lib/email/` subdirectory is split/dead
These files have zero imports outside their own directory:

```
lib/email/templates.ts
lib/email/professional-templates.ts
lib/email/sendTemplated.ts
lib/email/index.ts
lib/email/legacy-templates.ts
lib/email/email-service.ts
lib/email/config.ts
lib/email/templates/student-emails.ts
lib/email/templates/barber-welcome.ts
lib/email/templates/barber-welcome-paid.ts
lib/email/templates/appointment-emails.ts
lib/email/templates/platform-emails.ts
lib/email/templates/tax-emails.ts
```

Active email code imports from `lib/email/sendgrid.ts`, `lib/email/service.ts`, `lib/email/monitor.ts`, and `lib/email/workone-hold.ts` — those are live. The above are dead.

### Avatar system — entire `lib/avatar/` is unused
```
lib/avatar/avatarRouteMap.ts
lib/avatar/index.ts
lib/avatar/useAvatarOnLoad.ts
```

### HVAC legacy `lib/courses/` — 20 zero-reference files
```
lib/courses/hvac-video-map.ts
lib/courses/hvac-lesson5-recap.ts
lib/courses/lesson-module-map.ts
lib/courses/prs-lesson-content.ts
lib/courses/hvac-ojt-competencies.ts
lib/courses/hvac-module-data.ts
lib/courses/hvac-captions.ts
lib/courses/hvac-program-metadata.ts
lib/courses/hvac-csv-loader.ts
lib/courses/curriculum-db.ts
lib/courses/hvac-sims/loader.ts
lib/courses/hvac-sims/registry.ts
lib/courses/hvac-sims/index.ts
lib/courses/hvac-sims/schema.ts
lib/courses/hvac-troubleshooting-sims.ts
lib/courses/hvac-lesson5-captions.ts
lib/courses/hvac-lesson-quizzes.ts
lib/courses/hvac-epa-tags.ts
lib/courses/hvac-labs.ts
lib/courses/hvac-tool-breakdowns.ts
lib/courses/hvac-recaps.ts
lib/courses/hvac-epa608-lessons.ts
lib/courses/promoteToCurriculum.ts
```

### Other dead lib files
```
lib/admin.ts                          — zero imports (not lib/admin/)
lib/audit-logger.ts
lib/error-utils.ts
lib/errors/public-error.ts
lib/guide/page-guides.ts
lib/paths.ts
lib/pathways/url.ts
lib/program-data.ts
lib/spam-protection.ts
lib/validateRequest.ts
lib/chatbot/config.ts
lib/docs/templates/employer-mou.ts
lib/partner-workflows/payments.ts
lib/partner-workflows/enrollment.ts
lib/program-holder/route-guard.ts
lib/program-holder/onboarding-status.ts
lib/seo/programMetadata.ts
lib/seo/page-metadata.ts
lib/seo/keywords.ts
lib/seo/indexing-governance.ts
lib/seo/structured-data.ts
lib/store/licenseLinks.ts
lib/store/cards.ts
lib/store/provisioning.ts
lib/store/queue.ts
lib/store/provision-tenant.ts
lib/supabase/server-db.ts
lib/supabase/index.ts
lib/drug-testing/drug-test-service.ts
lib/drug-testing/types.ts
```

### Deprecated shims still receiving imports (migrate, don't delete yet)

| File | Active importers | Migrate to |
|---|---|---|
| `lib/supabase-api.ts` | 28 | `@/lib/supabase/server` or `@/lib/supabase/admin` |
| `lib/supabaseAdmin.ts` | 11 | `@/lib/supabase/admin` |
| `lib/supabase-admin.ts` | 7 | `@/lib/supabase/admin` |
| `lib/supabaseServer.ts` | 7 | `@/lib/supabase/server` |
| `lib/supabaseClients.ts` | 4 | `@/lib/supabase/server` / `client` / `admin` |
| `lib/auth/require-admin.ts` | 1 | `@/lib/authGuards` |
| `lib/licenseGuard.ts` | 1 | `@/lib/licensing` |
| `lib/auth-server.ts` | 0 | Safe to delete |

---

## 4. Dead Dependencies (`package.json`)

These packages have **zero imports** in `app/`, `components/`, `lib/`, `netlify/`, or `scripts/`:

| Package | Notes |
|---|---|
| `@node-saml/passport-saml` | SAML SSO — never wired up |
| `@opentelemetry/exporter-trace-otlp-http` | OTel — in `serverExternalPackages` but never imported |
| `@opentelemetry/resources` | Same |
| `@opentelemetry/sdk-node` | Same |
| `@opentelemetry/semantic-conventions` | Same |
| `express-rate-limit` | Rate limiting done via Upstash; this is unused |
| `express-slow-down` | Same |
| `express-validator` | No validation imports from this package |
| `html2canvas` | No imports found |
| `joi` | No imports found |
| `mammoth` | No imports found (Word doc parsing) |
| `next-intl` | i18n — never used |
| `passport-google-oauth20` | OAuth — never wired up |
| `winston` | Logging — no imports; `lib/logger.ts` uses a different approach |
| `winston-daily-rotate-file` | Same |
| `xterm` | Terminal emulator — only used in `app/studio/` which is shadowed |
| `xterm-addon-fit` | Same |

**Used only in scripts (not app bundle — keep but note):**
`canvas` (video generation scripts), `playwright` (image audit script), `socket.io` (terminal server script), `node-pty` (terminal server script), `express` (utility scripts only)

**Fix:** Remove the 13 zero-import packages. The script-only packages (`canvas`, `playwright`, `socket.io`, `node-pty`, `express`) can stay or move to `devDependencies`.

---

## 5. DB Schema Gaps

The `audit-schema-refs.sh` script found **117 tables** referenced in code (≥5 refs each) with no `CREATE TABLE` in any migration file. Of these, **116 have no migration at all**.

This is consistent with the known state: the live Supabase DB has 516+ tables, most created outside the migration files tracked in this repo. The script is a gap detector, not a definitive "table doesn't exist" signal.

**High-priority tables to verify exist in the live DB** (most referenced, most likely to cause runtime errors if missing):

| Table | Refs | Risk |
|---|---|---|
| `course_modules` | 29 | Core LMS — likely exists as view or under different name |
| `credential_registry` | 16 | Certification chain |
| `partner_enrollments` | 14 | Partner portal |
| `employer_onboarding` | 14 | Employer portal |
| `jri_participants` | 12 | JRI program |
| `user_onboarding` | 11 | Onboarding flow |
| `course_enrollments` | 8 | LMS enrollment |
| `compliance_audits` | 8 | Compliance portal |
| `achievements` | 8 | Gamification |
| `two_factor_auth` | 8 | Auth security |

**Verify in Supabase Dashboard SQL Editor:**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'course_modules','credential_registry','partner_enrollments',
    'employer_onboarding','jri_participants','user_onboarding',
    'course_enrollments','compliance_audits','achievements','two_factor_auth',
    'user_badges','tax_documents','student_requirements','organization_users',
    'mentorships','support_tickets','marketing_campaigns','invoices'
  )
ORDER BY tablename;
```

---

## 6. Auth & Security Gaps (from `audit-auth-gaps.sh`)

- **48 API routes** leak `error.message` directly in response bodies
- **62 routes** have no auth check at all
- **13 admin routes** have identity-only auth (no role check)

These are tracked separately — see `scripts/audit-auth-gaps.sh` output for the full list.

---

## Recommended Cleanup Order

### Immediate (no risk, pure deletion)
1. Remove the self-referential redirect `/admin/courses/create → /admin/courses/create`
2. Fix 17 redirect chains — update sources to point directly to final destinations
3. Fix 20 redirects pointing to non-existent destinations (mostly `/admin` → `/admin/dashboard`)
4. Delete 50 zero-reference root components
5. Remove 13 zero-import packages from `package.json`

### Short-term (verify before deleting)
6. Delete 23 zero-reference `lib/courses/` HVAC legacy files (confirm no dynamic imports)
7. Delete dead `lib/email/` template files (13 files — active email still works)
8. Delete dead `lib/avatar/` (3 files)
9. Delete other dead lib files (~30 files listed in §3)
10. Decide on 75 shadowed pages: delete or restore (governance section needs a decision)

### Medium-term (requires migration work)
11. Migrate 58 remaining importers off deprecated Supabase shims
12. Verify 116 unmigratable DB tables exist in live Supabase; write migrations for any that don't
13. Resolve portal terminology split (`/employer-portal` vs `/employer/dashboard`, `/partner-portal` vs `/partner/dashboard`)
