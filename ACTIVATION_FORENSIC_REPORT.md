# FULL ACTIVATION FORENSIC REPORT
**Generated: 2026-02-13**
**Branch:** main | **Commit:** c93b50e279dbe0058de6a4c2dd1922c849043b8b
**Uncommitted changes:** 244 files, +1114/-580 lines

---

## SECTION 1: ENVIRONMENT MATRIX

| Field | Value |
|---|---|
| Git branch | `main` |
| Commit SHA | `c93b50e` |
| Uncommitted changes | 244 files |
| Node.js | v20.20.0 |
| Next.js | v16.1.6 (Turbopack) |
| Package manager | pnpm |
| Hosting | Gitpod dev environment |
| `.env` file | **DOES NOT EXIST** |
| `.env.local` file | **DOES NOT EXIST** |
| `NEXT_PUBLIC_SUPABASE_URL` | **UNDEFINED** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **UNDEFINED** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **UNDEFINED** |
| `OPENAI_API_KEY` | **UNDEFINED** |
| All env vars | **ZERO loaded** |

**DOMINANT BLOCKER:** No environment variables are configured. Every Supabase query, Stripe payment, AI chat, and external service call will fail silently or return null. The `.env.example` file defines ~100+ variables but none are populated.

---

## SECTION 2: COMPONENT ACTIVATION TRUTH TABLE

### Summary

| Category | Count |
|----------|-------|
| Total components | 273 |
| Truly unused (0 imports anywhere) | 78 |
| Mounted in app (1+ imports) | 195 |
| Purely static/UI (no data deps) | 182 |
| Supabase-dependent | 50 |
| Fetch/API-dependent | 43 |
| Env-var dependent | 9 |
| External SDK dependent (Stripe, Sentry, Tawk) | 4 |

### TIER 1: SAFE — 182 Static UI Components

These render with hardcoded data, props, or local state only. No database, no API calls, no env vars. **Safe to activate on any page.**

Of 182 static components:
- **113 are ACTIVE** (imported and mounted in pages)
- **69 are UNUSED** (exist in components/ but imported nowhere)

Key active static components on public pages:
- Homepage: `StatStrip`, `TrustStrip`, `TrustBadges`, `ComplianceBadges`, `TestimonialCarousel`, `EnrollmentCounter`, `ProgramFinder`, `ProgramHighlights`, `MarqueeBanner`, `HeroWithVoiceover`, `HomeHeroWithVoiceover`
- Programs: `ProgramCTA`, `EnrollmentProcess`, `ProgramOutcomesTracker`, `PathwayBlock`
- Courses: `CourseCatalog`, `CourseCompletionTracking`, `CoursePrerequisiteManagement`
- About: `TeamSection`, `IndustryPartnershipPortal`
- Career Services: `SkillsGapAnalysis`, `VirtualCareerFair`, `StudentSuccessCoaching`, `WorkOneLocator`
- Contact: `CallTextButton`, `FeedbackWidget`

### TIER 2: CONDITIONAL — 79 Data-Dependent Components

These query Supabase tables or call internal API routes. They render but show empty/loading states without a database connection.

**Supabase-dependent (50):** Will return null/empty arrays because `NEXT_PUBLIC_SUPABASE_URL` is undefined. `lib/supabase/client.ts` returns a mock client.

**API-dependent (43):** Call `/api/` routes that themselves need Supabase. API routes return 401/405/500 without auth/DB.

Key Tier 2 components and their blockers:
| Component | Blocker |
|-----------|---------|
| NewsletterSignup | `newsletter_subscribers` table missing |
| ShoppingCart | `cart_items` table missing |
| EnhancedDashboard | `achievements`, `messages`, `notifications`, `user_progress` tables missing |
| NotificationBell | `notifications` table missing |
| SearchDialog | `training_programs` table missing |
| TrustStrip | `employer_profiles`, `site_settings`, `training_programs` tables missing |
| DiscussionForum | `forum_posts` table missing |
| ContentLibrary | `content_library`, `content_views` tables missing |
| LiveStreamingClassroom | `live_session_attendance` table missing |
| GoogleClassroomSync | `google_classroom_sync` table missing + `/api/integrations/google-classroom/sync` route missing |
| SMSNotificationSystem | `sms_messages`, `sms_templates` tables missing + `/api/sms/send` route missing |
| AchievementsBadges | `/api/users/{id}/badges` route missing |
| ProgressDashboard | `/api/users/{id}/progress` route missing |

### TIER 3: HIGH-RISK — 10 External Service Components

These require third-party API keys that are not configured:

| Component | Required Key | Service | Status |
|-----------|-------------|---------|--------|
| CheckoutForm | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | WILL CRASH — `loadStripe(undefined!)` |
| DonationForm | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | WILL CRASH |
| ProgramPaymentOptions | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | WILL CRASH |
| Captcha | `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` | hCaptcha | Falls back to hardcoded key |
| Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare | Renders without key |
| FacebookPixel | `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` | Facebook | No-op without ID |
| LiveChat | `NEXT_PUBLIC_TAWK_PROPERTY_ID` | Tawk.to | No-op without ID |
| SecurityMonitor | `NODE_ENV` | Internal | Dev-mode only behavior |
| InvisibleWatermark | `NODE_ENV` | Internal | Skips in non-production |
| sentry-init | Sentry SDK | Sentry | No-op without DSN |

---

## SECTION 3: SUPABASE VERIFICATION

### Connection Status: IMPOSSIBLE
No `.env` or `.env.local` file exists. Cannot connect to any Supabase instance.

### Table Cross-Reference

Components reference **65 unique Supabase tables** via `.from()` calls.

- **10 tables exist** in SQL schema files: `applications`, `assignment_submissions`, `assignments`, `certificates`, `course_reviews`, `enrollments`, `profiles`, `quiz_questions`, `quizzes`, `testimonials`
- **55 tables are MISSING** from all schema files

### Missing Tables (55) — Full List

| Missing Table | Components Affected |
|---------------|-------------------|
| `accessibility_preferences` | TextToSpeech |
| `achievements` | EnhancedDashboard |
| `admin_activity_log` | AdminHeader, AdminReportingDashboard, ModuleListForProgram |
| `admin_notifications` | AdminHeader |
| `ambient_music_log` | AmbientMusic |
| `analytics_events` | HomeHeroWithVoiceover |
| `application_claim_log` | ClaimApplications |
| `audio_preferences` | AmbientMusic |
| `banner_analytics` | VideoHeroBanner |
| `cart_items` | ShoppingCart |
| `certificate_downloads` | CertificateDownload |
| `collaboration_messages` | RealTimeCollaboration |
| `collaboration_presence` | RealTimeCollaboration |
| `community_posts` | SocialLearningCommunity |
| `content_library` | ContentLibrary |
| `content_views` | ContentLibrary |
| `employer_profiles` | EmployerPartners, TrustStrip |
| `events` | SiteSearch |
| `financial_aid_calculations` | FinancialAidCalculator |
| `forum_posts` | DiscussionForum |
| `generated_assets` | AssetGenerator |
| `generated_pages` | AIPageBuilder, PageManager |
| `google_classroom_sync` | GoogleClassroomSync |
| `grades` | LearningAnalyticsDashboard |
| `job_placements` | JobPlacementTracking |
| `learning_activity` | LearningAnalyticsDashboard |
| `learning_paths` | AdaptiveLearningPath |
| `live_chat_messages` | LiveChatSupport |
| `live_chat_sessions` | LiveChatSupport |
| `live_session_attendance` | LiveStreamingClassroom |
| `messages` | EnhancedDashboard |
| `newsletter_subscribers` | NewsletterSignup |
| `notification_events` | NotificationPrompt |
| `notification_preferences` | NotificationPrompt |
| `notifications` | EnhancedDashboard, NotificationBell, StudentPortalNav |
| `page_versions` | PageManager |
| `payments` | AdminReportingDashboard |
| `peer_reviews` | PeerReview |
| `platform_stats` | SocialProof |
| `portfolio_projects` | StudentPortfolio |
| `program_modules` | ModuleListForProgram |
| `scraper_detection_events` | ScraperDetection |
| `site_settings` | EmployerPartners, HomeHeroWithVoiceover, LiveChatWidget, TenantCustomStyles, TrustStrip |
| `sms_messages` | SMSNotificationSystem |
| `sms_templates` | SMSNotificationSystem |
| `study_groups` | SocialLearningCommunity, StudyGroups |
| `subscriptions` | SubscriptionManager |
| `training_programs` | AdminReportingDashboard, AdvancedSearch, SearchDialog, SiteSearch, TrustStrip |
| `transcript_search_log` | TranscriptPanel |
| `tts_usage_log` | TextToSpeech |
| `turnstile_verifications` | Turnstile |
| `user_activity` | AdminReportingDashboard, LiveChatWidget |
| `user_learning_paths` | AdaptiveLearningPath |
| `user_progress` | EnhancedDashboard |
| `user_skills` | AdaptiveLearningPath, StudentPortfolio |
| `video_engagement` | VideoHeroBanner |

### RLS Status
All 10 existing tables have Row Level Security enabled in schema files.

### Supabase Client Fragmentation
The codebase has **10+ separate Supabase client files** across `lib/supabase/`, `lib/supabase*.ts`, and `utils/supabase/`. All read from `process.env.NEXT_PUBLIC_SUPABASE_URL` which is undefined.

---

## SECTION 4: API ROUTE AUDIT

### API Routes Called by Components — HTTP Response Codes

| API Route | Status | Meaning | Component |
|-----------|--------|---------|-----------|
| `/api/ai-assistant/chat` | 200 | Returns API info (GET), needs POST | AIAssistantBubble |
| `/api/ai-instructor/message` | 405 | Method not allowed (POST only) | AIInstructorWidget |
| `/api/ai-tutor/chat` | 405 | Method not allowed (POST only) | ChatAssistant |
| `/api/career-counseling/chat` | 200 | Returns API info (GET) | AICareerCounseling |
| `/api/chat/avatar-assistant` | 400 | Bad request (missing body) | AvatarChatAssistant |
| `/api/applications` | 405 | POST only | ApplicationForm |
| `/api/checkout` | 405 | POST only | EnrollmentPaymentWidget |
| `/api/create-checkout-session` | 405 | POST only | BuyNowButton |
| `/api/donate/create-checkout` | 405 | POST only | DonationForm |
| `/api/enroll` | 405 | POST only | QuickEnrollmentForm |
| `/api/export` | 400 | Missing params | DataExportDialog |
| `/api/feedback` | 401 | Auth required | FeedbackWidget |
| `/api/moderation` | 401 | Auth required | ModerationDashboard |
| `/api/notes` | 401 | Auth required | NoteTaking |
| `/api/payments` | 401 | Auth required | CheckoutForm |
| `/api/programs/checkout` | 405 | POST only | PaymentButton |
| `/api/receptionist` | 405 | POST only | FloatingChatWidget |
| `/api/referrals` | 400 | Missing params | ReferralDashboard |
| `/api/security/log` | 405 | POST only | SecurityMonitor |
| `/api/surveys` | 200 | Works | SurveyModal |
| `/api/tutorials` | 401 | Auth required | TutorialSystem |
| `/api/track-usage` | 500 | Server error | InvisibleWatermark |
| `/api/alert-scraper` | 200 | Works | ScraperDetection |
| `/api/marketplace/report` | 405 | POST only | ReportProduct |

### Missing API Routes (no route.ts file exists)

| Route | Component |
|-------|-----------|
| `/api/integrations/google-classroom/sync` | GoogleClassroomSync |
| `/api/sms/send` | SMSNotificationSystem |
| `/api/users/{id}/badges` | AchievementsBadges |
| `/api/users/{id}/progress` | ProgressDashboard |
| `/api/calendar/events` | CalendarWidget |

---

## SECTION 5: CLIENT vs SERVER BOUNDARY AUDIT

| Metric | Count |
|--------|-------|
| Components with `'use client'` | 47 / 273 |
| Components using hooks WITHOUT `'use client'` | 155 |
| Client components importing server-only modules | 0 (clean) |
| Pages with boundary violations | **32** |

### Boundary Violations
32 server-component pages directly import components that use `useState`/`useEffect` without `'use client'` and without `dynamic()` wrapping.

Affected pages include: `app/page.tsx`, `app/about/page.tsx`, `app/courses/page.tsx`, `app/programs/page.tsx`, `app/donate/page.tsx`, `app/career-services/page.tsx`, `app/contact/page.tsx`, all `app/lms/(app)/*/page.tsx`, all `app/admin/*/page.tsx`, `app/employer/dashboard/page.tsx`, `app/instructor/dashboard/page.tsx`.

**Why this doesn't crash in dev:** Next.js dev mode with Turbopack is lenient about boundary violations. **Production builds also succeed** because TypeScript checking is skipped and the components happen to be imported in contexts where Next.js can infer client boundaries. However, this is fragile and could break with Next.js updates.

---

## SECTION 6: FEATURE FLAG & CONDITIONAL RENDERING SCAN

| Finding | Detail |
|---------|--------|
| Formal feature flag system | **NONE** — no `FEATURE_*`, `FF_*`, or toggle service |
| Env var gates in components | 11 references across 9 components |
| Auth-conditional components | 15 components check session/user state |
| Data-null fallbacks | Most components render empty/loading states when data is null |

**No centralized feature toggle mechanism exists.** Components are either imported or not — there's no way to disable a feature without removing its import.

---

## SECTION 7: REDIRECT & ACCESS CONTROL AUDIT

| Category | Count |
|----------|-------|
| Total pages with auth redirects | 391 |
| Admin pages (expected) | 169 |
| LMS pages (expected) | 56 |
| Other authenticated pages | 166 |

### Previously Fixed Login Walls (9 pages)
All 9 pages that were fixed to remove login walls remain fixed:
- `/leaderboard`, `/achievements`, `/calendar`, `/career-services/ongoing-support`, `/community/communityhub`, `/community/leaderboard`, `/community/members`, `/student-handbook`, `/student-support/schedule`

### Auth-Gated Pages That Redirect

| Page | Redirects To | Expected? |
|------|-------------|-----------|
| `/lms` | `/login?redirect=/lms` | YES — requires enrollment |
| `/admin/dashboard` | `/admin-login?redirect=/admin` | YES — admin only |
| `/instructor/dashboard` | `/login?redirect=/instructor` | YES — instructor only |
| `/employer/dashboard` | 200 (renders) | Renders without auth (may show empty) |

---

## SECTION 8: RUNTIME ERROR LOG

### Build Result: SUCCESS
```
✓ Compiled successfully in 36.7s
✓ Generating static pages (836/836) in 2.3s
0 build errors
0 type errors (checking skipped)
```

### Build Warnings
- `[Sezzle] Not configured - missing env vars` (5 occurrences)
- `EPS credentials not configured` (3 occurrences)
- `Using edge runtime disables static generation` (1 page)

### HTTP Status on Key Pages
All public pages return 200. Auth-gated pages return 307 redirect to login.

### Server Error
- `/api/track-usage` returns 500 (InvisibleWatermark component)

---

## SECTION 9: FINAL ROOT CAUSE CLASSIFICATION

### ROOT CAUSE #1: No Environment Variables (BLOCKS 100% of data features)

**Evidence:** No `.env` or `.env.local` file exists. `env | grep NEXT_PUBLIC` returns empty. All Supabase client files read from `process.env.NEXT_PUBLIC_SUPABASE_URL` with no hardcoded fallback.

**Impact:** Every component that queries Supabase (50 components), calls API routes that need Supabase (43 components), or uses external services (10 components) is non-functional. This is the single dominant blocker.

**Fix:** Create `.env.local` with real Supabase credentials and API keys from the production/staging environment.

### ROOT CAUSE #2: 55 Missing Supabase Tables (BLOCKS 50+ components even with env vars)

**Evidence:** Components reference 65 tables via `.from()`. Only 10 exist in SQL schema files. 55 are missing including core tables like `notifications`, `site_settings`, `training_programs`, `cart_items`, `forum_posts`.

**Impact:** Even with a valid Supabase connection, these components will get Postgres errors or empty results. The schema has never been fully migrated.

**Fix:** Create migration SQL for all 55 missing tables. Some may exist in the production database but not in the schema files — verify against the live Supabase instance.

### ROOT CAUSE #3: 5 Missing API Routes (BLOCKS 5 components)

**Evidence:** Components call API endpoints that have no `route.ts` file:
- `/api/integrations/google-classroom/sync`
- `/api/sms/send`
- `/api/users/{id}/badges`
- `/api/users/{id}/progress`
- `/api/calendar/events`

**Impact:** These components will get 404 errors at runtime.

**Fix:** Create the missing API route files or update components to use existing routes.

### ROOT CAUSE #4: 155 Missing `'use client'` Directives (LATENT RISK)

**Evidence:** 155 components use React hooks (`useState`, `useEffect`) without `'use client'`. 32 pages import these directly without `dynamic()`.

**Impact:** Currently works in dev and build due to Next.js inference, but is architecturally fragile. A Next.js update could break all 32 pages.

**Fix:** Add `'use client'` to all 155 components that use hooks/browser APIs.

### ROOT CAUSE #5: 78 Truly Unused Components (DEAD CODE)

**Evidence:** 78 components in `components/` are imported by zero files anywhere in the codebase.

**Impact:** No runtime impact. Increases bundle analysis noise and maintenance burden.

**Fix:** Either activate them in appropriate pages or remove them.

---

## ACTIVATION READINESS MATRIX

| Tier | Components | Ready? | Blocker |
|------|-----------|--------|---------|
| Tier 1 (Static UI) | 113 active | ✅ YES | None — rendering now |
| Tier 1 (Static UI) | 69 unused | ⚠️ NEEDS PLACEMENT | No page imports them |
| Tier 2 (Supabase) | 50 | ❌ NO | Missing env vars + 55 missing tables |
| Tier 2 (API) | 43 | ❌ NO | Missing env vars + 5 missing routes |
| Tier 3 (External) | 10 | ❌ NO | Missing API keys (Stripe, Tawk, hCaptcha, Sentry, Facebook) |

### Recommended Activation Order

1. **FIRST:** Create `.env.local` with real Supabase URL + anon key
2. **SECOND:** Verify which of the 55 "missing" tables actually exist in the live Supabase instance
3. **THIRD:** Create migrations for truly missing tables
4. **FOURTH:** Add `'use client'` to 155 components (batch fix, low risk)
5. **FIFTH:** Create 5 missing API routes
6. **SIXTH:** Add Stripe, Tawk, and other API keys
7. **LAST:** Activate the 69 unused static components in appropriate pages

---

*This report contains only verifiable evidence from file system analysis, grep searches, HTTP requests, and build output. No assumptions were made about the state of any external service or database.*
