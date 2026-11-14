# Session State — 2026-04-20

## Elevate-lms (main LMS repo)

### Build fixes pushed

- Removed custom splitChunks (was creating one chunk per npm package — OOM cause)
- Webpack cache key changed from COMMIT_REF to stable 'elevate-lms-v1'
- withSentryConfig bypassed entirely on Netlify (still runs at runtime)
- 15 packages added to serverExternalPackages: @upstash/ratelimit, @mailchimp/mailchimp_marketing, @octokit/rest, @octokit/auth-oauth-app, @webcontainer/api, cheerio, docx, fast-xml-parser, jszip, qrcode, resend, speakeasy, web-push, yjs, y-websocket
- metadata exports removed from 10 'use client' pages (build error fix)
- NOW_BUILDER=1 added to netlify.toml (suppresses no-cache warning)
- onRouterTransitionStart export added to instrumentation-client.ts

### Pages restored to Elevate-lms

- career-services, employer-portal, ferpa, funding, help, legal, license, policies, preview, pwa, support, docs
- app/reels (redirect stub)

### Pages removed from Elevate-lms

- app/supersonic, app/tax legacy product routes, app/api/supersonic\*, app/api/supersonic-cash
- Test pages: sentry-test, test-enrollment, test-images, cache-diagnostic, demos, micro-classes

### Pending

- Netlify build not yet confirmed passing (last error was metadata/use client — fixed)
- Footer in next-platform-starter not yet committed with new sections

---

## next-platform-starter (marketing repo)

### Supabase

- Project: jlqrfwxuhpzmuivdxvvz
- URL: https://jlqrfwxuhpzmuivdxvvz.supabase.co
- lib/supabase/client.ts and server.ts set up
- .env.local has all 3 keys (gitignored)

### Sections present and wired into nav

about, accreditation, alumni, apprenticeships, blog, career-training,
community-services, consumer-education, donate, features, financial-aid,
for-employers, hire-graduates, partnerships, pathways, philanthropy,
programs, solutions, testimonials, training-providers, tuition, workforce-partners

### Sections NOT in starter (belong in Elevate-lms)

career-services, employer-portal, ferpa, funding, help, legal, license,
policies, preview, pwa, support, docs

### Pending

- Footer not yet updated with all new sections (uncommitted)
- Nav dropdown added (primary 5 + More dropdown for rest)
- employee section — user asked to send back and wire up (not yet done)
