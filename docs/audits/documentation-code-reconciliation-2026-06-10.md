# Documentation-to-code reconciliation audit — 2026-06-10

## Scope and honesty note

This audit inventories every Markdown/MDX document in the repository and performs automated reconciliation against implemented App Router routes, API routes, GitHub workflows, and source-code incompletion markers. It does **not** claim that every prose statement in every business proposal, archived audit, grant narrative, or historical TODO is fully implemented; claims that require live Supabase/Northflank/Stripe/GitHub access still require operator validation in those systems.

## Inventory summary

| Surface | Count |
| --- | ---: |
| Markdown/MDX documents reviewed | 319 |
| Active/non-archived documents | 304 |
| Archived/historical documents | 15 |
| App Router API route files | 1400 |
| App Router page files | 1433 |
| GitHub workflow files | 25 |
| Source incompletion/deprecation markers | 3030 |
| Live-integration blocker markers | 0 |
| Documented API route refs without matching route file | 0 |
| Documented page route refs without matching page file | 0 |
| Documented workflow refs without matching workflow file | 0 |

## Completion policy for this audit

Do **not** mark a feature complete from file presence alone. A documented feature is only complete when all of the following evidence exists:

1. The code path exists and is reachable in the running application.
2. The page/API/workflow is wired to live data or a real third-party integration where production credentials/infrastructure exist.
3. Mock data, placeholder responses, fake success states, and hardcoded production fallbacks are removed or explicitly gated to development/test mode.
4. An end-to-end test, smoke test, screenshot, workflow run, or live API result proves the feature works.
5. Any required production secrets, Supabase migrations, Northflank services, webhooks, buckets, or third-party accounts are present and verified.

Anything missing one of those evidence items must remain **not validated** or **blocked**, never **complete**.

## Can this container send code live?

No. Based on the current environment checks, this container cannot be treated as a live deploy runner until outbound HTTPS/DNS to GitHub and Northflank works. Use GitHub Actions or an operator machine with unrestricted egress for production deployment. See `docs/deploy/container-egress-deploy-blocker.md`.

## High-priority mismatches found

### Documented API routes with no matching App Router API route

- None found by automated route matching.

### Documented page routes with no matching page file

- None found by automated route matching.

### Documented workflow files with no matching workflow file

- None found by automated workflow matching.

## Live-integration blocker markers

These markers are the highest priority for the user's requirement to replace mock data with live integrations where available. Generic form/image placeholder attributes and legitimate domain terms such as pay stubs are excluded from this focused list; they remain in the broader source marker section when matched. These findings are not automatically defects, but no feature touching one of these lines should be called complete without an explicit test/dev-only justification.

- No live-integration blocker markers found.

## Source markers requiring implementation review

These are not all bugs: tests, legitimate mock interviews, and intentional placeholders can appear. The list below focuses on non-test source files and should be burned down in bounded PRs.

- `app/(dashboard)/org/create/page.tsx:108` — className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-black rounded-md focus:outline-none focus:ring-brand-blue-500 foc
- `app/(dashboard)/org/create/page.tsx:109` — placeholder="Acme Training Center"
- `app/(dashboard)/org/create/page.tsx:130` — placeholder="acme-training"
- `app/(dashboard)/org/invites/page.tsx:209` — placeholder="you@example.com"
- `app/HomeHeroVideo.tsx:103` — {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
- `app/HomeHeroVideo.tsx:110` — className="object-cover z-0" placeholder="empty"
- `app/about/mission/page.tsx:70` — {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
- `app/about/mission/page.tsx:77` — sizes="100vw" placeholder="empty"
- `app/about/mission/page.tsx:122` — sizes="(max-width: 768px) 100vw, 50vw" placeholder="empty"
- `app/about/mission/page.tsx:157` — sizes="(max-width: 768px) 100vw, 50vw" placeholder="empty"
- `app/about/page.tsx:70` — {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
- `app/about/page.tsx:77` — sizes="(max-width: 640px) 160px, 208px" placeholder="empty"
- `app/about/page.tsx:162` — <Image src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/about-career-training.webp" alt="Career training programs" fill sizes="(max-width: 640px) 100vw, 224px" quality={90} className="object-cover" placeholder=
- `app/about/page.tsx:181` — <Image src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/about-funding-nav.webp" alt="Workforce funding options" fill sizes="(max-width: 640px) 100vw, 224px" quality={90} className="object-cover" placeholder="em
- `app/about/page.tsx:199` — <Image src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/about-employer-partners.webp" alt="Employer partnerships" fill sizes="(max-width: 640px) 100vw, 224px" quality={90} className="object-cover" placeholder="
- `app/about/page.tsx:218` — <Image src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/about-supportive-services.webp" alt="Supportive services" fill sizes="(max-width: 640px) 100vw, 224px" quality={90} className="object-cover" placeholder="
- `app/about/page.tsx:359` — <Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 100vw, 50vw" quality={90} className="object-cover" placeholder="empty" />
- `app/about/page.tsx:394` — <Image src={cred.logo} alt={cred.name} fill sizes="64px" className="object-contain" placeholder="empty" />
- `app/about/page.tsx:459` — className="object-cover object-top" placeholder="empty"
- `app/about/page.tsx:555` — quality={90} className="object-cover object-center" placeholder="empty"
- `app/about/page.tsx:584` — <Image src={p.image} alt={p.name} fill sizes="(max-width: 640px) 100vw, 33vw" quality={90} className="object-cover group-hover:scale-105 transition-transform duration-300" placehol
- `app/about/page.tsx:608` — <Image src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/about-partner-cta.webp" alt="Partner with Elevate" fill sizes="(max-width: 640px) 100vw, 33vw" quality={90} className="object-cover" placeholder="empty" /
- `app/about/page.tsx:620` — <Image src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/employer-hero.webp" alt="Employer and community partners" fill sizes="(max-width: 640px) 100vw, 33vw" quality={90} className="object-cover" placeholder="e
- `app/about/page.tsx:632` — <Image src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/job-placement.webp" alt="Career pathways" fill sizes="(max-width: 640px) 100vw, 33vw" quality={90} className="object-cover" placeholder="empty" />
- `app/about/partners/page.tsx:51` — {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
- `app/about/partners/page.tsx:58` — sizes="100vw" placeholder="empty"
- `app/about/partners/page.tsx:94` — placeholder="empty"
- `app/about/partners/page.tsx:129` — placeholder="empty"
- `app/about/partners/page.tsx:173` — placeholder="empty"
- `app/academic-calendar/page.tsx:68` — {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
- `app/academic-calendar/page.tsx:75` — priority placeholder="empty"
- `app/academic-integrity/page.tsx:30` — {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
- `app/academic-integrity/page.tsx:38` — sizes="100vw" placeholder="empty"
- `app/accessibility/page.tsx:30` — {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
- `app/accessibility/page.tsx:38` — sizes="100vw" placeholder="empty"
- `app/account/profile/ProfileEditForm.tsx:118` — placeholder="Your full name"
- `app/account/profile/ProfileEditForm.tsx:139` — placeholder="(555) 123-4567"
- `app/account/profile/ProfileEditForm.tsx:150` — placeholder="City, State"
- `app/account/profile/ProfileEditForm.tsx:162` — placeholder="Tell us about yourself..."
- `app/account/profile/ProfileEditForm.tsx:179` — placeholder="https://yourwebsite.com"
- `app/account/profile/ProfileEditForm.tsx:190` — placeholder="https://linkedin.com/in/yourprofile"
- `app/account/settings/notifications/page.tsx:223` — placeholder={PLATFORM_DEFAULTS.supportPhone}
- `app/agencies/page.tsx:194` — {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
- `app/agencies/page.tsx:200` — sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" placeholder="empty"
- `app/ai-chat/page.tsx:179` — placeholder="Type your question..."
- `app/ai-tutor/page.tsx:59` — {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
- `app/ai-tutor/page.tsx:66` — sizes="100vw" placeholder="empty"
- `app/ai/instructor/page.tsx:121` — placeholder="Program ID (optional — narrows responses to your program)"
- `app/ai/instructor/page.tsx:122` — className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 placeholder:text-slate-400"
- `app/ai/instructor/page.tsx:177` — placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
- `app/ai/job-match/page.tsx:55` — placeholder="e.g., CNA certification, customer service, Microsoft Office, bilingual Spanish..."
- `app/api/affirm-charge/route.ts:1` — // PUBLIC ROUTE: deprecated tombstone — always returns 410, no data access
- `app/api/affirm-charge/route.ts:9` — * DEPRECATED — superseded by /api/affirm/checkout + /api/affirm/capture.
- `app/api/affirm-charge/route.ts:24` — 'This endpoint is deprecated. Use /api/affirm/checkout to initiate Affirm checkout.',
- `app/api/ai-instructor/message/route.ts:2` — * @deprecated Route to lib/ai/orchestrator.ts for new callers.
- `app/api/ai/chat/route.ts:2` — * @deprecated Route to lib/ai/orchestrator.ts for new callers.
- `app/api/ai/instructor/route.ts:2` — * @deprecated Route to lib/ai/orchestrator.ts for new callers.
- `app/api/announcements/route.ts:12` — * Returns empty array if no announcements (strict - no fake data).
- `app/api/apprentice/program-slug/route.ts:10` — * Used by DocumentsClient and other pages that previously hardcoded 'barber-apprenticeship'.
- `app/api/automation/test/shop-routing/route.ts:144` — program_id: '00000000-0000-0000-0000-000000000001', // Placeholder
- `app/api/chat/ai-response/route.ts:2` — * @deprecated Route to lib/ai/orchestrator.ts for new callers.
- `app/api/chat/avatar-assistant/route.ts:53` — prompt += \`IMPORTANT: User has missing or incomplete documents. Prioritize document completion.\n\`;
- `app/api/checkout/create-session/route.ts:2` — * @deprecated Use POST /api/programs/enroll/checkout
- `app/api/checkout/student/route.ts:23` — logger.warn('Deprecated checkout endpoint called', {
- `app/api/courses/[courseId]/lessons/public/route.ts:223` — // Enrich DB lessons that have placeholder content with generated rich HTML
- `app/api/cron/check-licenses/route.ts:17` — const { data: incomplete, error } = await db
- `app/api/cron/check-licenses/route.ts:30` — for (const lic of incomplete ?? []) {
- `app/api/cron/onboarding-followup/route.ts:21` — // Users with incomplete onboarding steps, last updated > 48h ago
- `app/api/cron/onboarding-followup/route.ts:22` — const { data: incomplete, error } = await db
- `app/api/cron/onboarding-followup/route.ts:39` — for (const row of incomplete ?? []) {
- `app/api/cron/onboarding-followup/route.ts:50` — message: 'You have incomplete onboarding steps. Complete them to access all platform features.',
- `app/api/enroll/auto/route.ts:2` — * @deprecated Disabled. Use /api/enrollments/create-enforced.
- `app/api/enroll/auto/route.ts:4` — // PUBLIC ROUTE: deprecated auto-enroll — kept for backward compat, rate-limited
- `app/api/enroll/auto/route.ts:34` — { error: 'This endpoint is deprecated. Use /api/enrollments/create-enforced.' },
- `app/api/enrollments/checkout/route.ts:2` — * @deprecated Use POST /api/programs/enroll/checkout
- `app/api/enrollments/create/route.ts:4` — * @deprecated Use /api/enrollments/create-enforced for program enrollments
- `app/api/enrollments/create/route.ts:49` — logger.warn('Deprecated: programId sent to /api/enrollments/create', {
- `app/api/enrollments/create/route.ts:58` — deprecated: true,
- `app/api/funnel/lead/route.ts:147` — subject: \`[NEW LEAD] ${name.trim()} — ${program || 'Program TBD'} (${sourceLabel})\`,
- `app/api/health/route.ts:140` — // TODO(security): missing immutability triggers are a hardening gap, not
- `app/api/health/route.ts:165` — // Activation gates — derived from live checks only (no hardcoded marketing scores).
- `app/api/hr/payroll/route.ts:184` — for (const stub of priorStubs ?? []) {
- `app/api/hr/payroll/route.ts:185` — const prev = ytdByEmployee.get(stub.employee_id) ?? {
- `app/api/hr/payroll/route.ts:191` — ytdByEmployee.set(stub.employee_id, {
- `app/api/hr/payroll/route.ts:192` — gross: prev.gross + Number(stub.gross_pay ?? 0),
- `app/api/hr/payroll/route.ts:193` — taxes: prev.taxes + Number(stub.total_taxes ?? 0),
- `app/api/hr/payroll/route.ts:194` — deductions: prev.deductions + Number(stub.total_deductions ?? 0),
- `app/api/hr/payroll/route.ts:195` — net: prev.net + Number(stub.net_pay ?? 0),
- `app/api/instructor/course-performance/route.ts:51` — // If no data, return placeholder
- `app/api/intake/route.ts:325` — // placeholder so the admin email still renders rather than showing "null".
- `app/api/jobs/government-feed/route.ts:166` — // Placeholder for future DWD API integration
- `app/api/lessons/[lessonId]/complete/route.ts:498` — return NextResponse.json({ error: 'Failed to mark lesson incomplete' }, { status: 500 });
- `app/api/license-request/route.ts:40` — return NextResponse.json({ error: 'Incomplete or invalid submission.' }, { status: 400 });
- `app/api/onboarding/launch/route.ts:26` — * Vision flow: describe business → provision workspace → AI site config → optional LMS stub.
- `app/api/proctor/sessions/[id]/route.ts:84` — // Setting a final result (pass/fail/incomplete) requires identity verified
- `app/api/proctor/sessions/[id]/route.ts:85` — const finalResults = ['pass', 'fail', 'incomplete'];
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:11` — * GET /api/program-holder/payroll/stub/[stubId]/download
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:13` — * Returns a signed URL redirect for a pay stub PDF stored in Supabase storage,
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:31` — // Fetch the stub — must belong to this user
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:32` — const { data: stub, error } = await db
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:39` — if (error || !stub) return safeError('Pay stub not found', 404);
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:42` — if (stub.pdf_url) {
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:44` — if (stub.pdf_url.startsWith('http')) {
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:45` — return NextResponse.redirect(stub.pdf_url);
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:51` — .createSignedUrl(stub.pdf_url, 300); // 5-minute expiry
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:60` — // No PDF stored — return a plain-text pay stub summary as a downloadable file
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:61` — const date = new Date(stub.created_at).toLocaleDateString('en-US', {
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:68` — 'ELEVATE FOR HUMANITY — PAY STUB',
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:71` — \`Stub ID:    ${stub.id}\`,
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:72` — \`Gross Pay:  $${Number(stub.gross_pay ?? 0).toFixed(2)}\`,
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:73` — \`Net Pay:    $${Number(stub.net_pay ?? 0).toFixed(2)}\`,
- `app/api/program-holder/payroll/stub/[stubId]/download/route.ts:82` — 'Content-Disposition': \`attachment; filename="pay-stub-${stub.id.slice(0, 8)}.txt"\`,
- `app/api/stripe/webhook/route.ts:2` — * DEPRECATED — canonical Stripe webhook is at /api/webhooks/stripe
- `app/api/stripe/webhook/route.ts:15` — logger.warn('[stripe/webhook] Deprecated endpoint — forwarding to /api/webhooks/stripe. Update Stripe Dashboard webhook URL.');
- `app/api/student/dashboard/route.ts:16` — * Strict rendering: Returns empty arrays if no data (never fake data).
- `app/api/testimonials/route.ts:16` — * Strict: Returns empty array if no data (never fake data).
- `app/api/testing/calendly-webhook/route.ts:276` — subject: \`New Testing Appointment: ${inviteeName} — ${examAnswer || 'Exam TBD'}\`,
- `app/api/testing/retake/route.ts:41` — * All values come from the pricing engine — no hardcoded amounts.
- `app/api/testing/retake/route.ts:109` — // Derive retake fee from the provider — never hardcoded
- `app/api/testing/webhook/route.ts:2` — * DEPRECATED — canonical Stripe webhook is at /api/webhooks/stripe
- `app/api/testing/webhook/route.ts:18` — '[testing/webhook] Deprecated endpoint — forwarding to /api/webhooks/stripe. Update Stripe Dashboard webhook URL.',
- `app/api/video/generate/route.ts:156` — // Select placeholder video based on content
- `app/api/workone/[id]/route.ts:48` — status?: 'todo' | 'in_progress' | 'done';
- `app/api/workone/seed/route.ts:124` — status: 'todo',
- `app/apply/IntakeFormInner.tsx:54` — { value: 'income_proof',    label: 'Proof of Income (pay stub, tax return, benefit letter)' },
- `app/apply/IntakeFormInner.tsx:403` — placeholder="First and last name"
- `app/apply/IntakeFormInner.tsx:424` — placeholder="you@example.com"
- `app/apply/IntakeFormInner.tsx:444` — placeholder="(317) 555-0100"
- `app/apply/IntakeFormInner.tsx:485` — placeholder="e.g. Marion, Hamilton"
- `app/apply/IntakeFormInner.tsx:570` — placeholder="e.g. Indianapolis, Kokomo"
- `app/apply/actions.ts:832` — // 'incomplete' is not a valid eligibility_status value — use 'pending' as the default
- `app/apply/employer/EmployerApplicationForm.tsx:139` — placeholder="https://"
- `app/apply/employer/EmployerApplicationForm.tsx:216` — placeholder="Minimum 8 characters"
- `app/apply/employer/EmployerApplicationForm.tsx:244` — placeholder="Re-enter your password"
- `app/apply/employer/EmployerApplicationForm.tsx:264` — placeholder="Tell us about the positions you're looking to fill..."
- `app/apply/employer/EmployerApplicationForm.tsx:280` — placeholder="e.g., 5-10 positions"
- `app/apply/employer/page.tsx:31` — {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
- `app/apply/employer/page.tsx:38` — priority placeholder="empty"
- `app/apply/fssa/FssaApplicationForm.tsx:155` — <input className={inputCls} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First name" />
- `app/apply/fssa/FssaApplicationForm.tsx:158` — <input className={inputCls} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last name" />
- `app/apply/fssa/FssaApplicationForm.tsx:166` — <input type="tel" className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(317) 000-0000" />
- `app/apply/fssa/FssaApplicationForm.tsx:169` — <input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" />
- `app/apply/fssa/FssaApplicationForm.tsx:173` — <input className={inputCls} value={form.streetAddress} onChange={e => set('streetAddress', e.target.value)} placeholder="123 Main St" />
- `app/apply/fssa/FssaApplicationForm.tsx:177` — <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Indianapolis" />
- `app/apply/fssa/FssaApplicationForm.tsx:180` — <input className={inputCls} value={form.state} onChange={e => set('state', e.target.value)} placeholder="IN" maxLength={2} />
- `app/apply/fssa/FssaApplicationForm.tsx:183` — <input className={inputCls} value={form.zipCode} onChange={e => set('zipCode', e.target.value)} placeholder="46201" maxLength={10} />
- `app/apply/fssa/FssaApplicationForm.tsx:205` — <input className={inputCls} value={form.snapCaseNumber} onChange={e => set('snapCaseNumber', e.target.value)} placeholder="Case number (optional)" />
- `app/apply/fssa/FssaApplicationForm.tsx:214` — <input className={inputCls} value={form.tanfCaseNumber} onChange={e => set('tanfCaseNumber', e.target.value)} placeholder="Case number (optional)" />
- `app/apply/fssa/FssaApplicationForm.tsx:227` — <input className={inputCls} value={form.caseManagerName} onChange={e => set('caseManagerName', e.target.value)} placeholder="Full name" />
- `app/apply/fssa/FssaApplicationForm.tsx:230` — <input className={inputCls} value={form.caseManagerAgency} onChange={e => set('caseManagerAgency', e.target.value)} placeholder="e.g. DFR, WorkOne, Catholic Charities" />
- `app/apply/fssa/FssaApplicationForm.tsx:234` — <input type="tel" className={inputCls} value={form.caseManagerPhone} onChange={e => set('caseManagerPhone', e.target.value)} placeholder="(317) 000-0000" />
- `app/apply/fssa/FssaApplicationForm.tsx:237` — <input type="email" className={inputCls} value={form.caseManagerEmail} onChange={e => set('caseManagerEmail', e.target.value)} placeholder="email@agency.gov" />
- `app/apply/fssa/FssaApplicationForm.tsx:269` — <input className={inputCls} value={form.employerName} onChange={e => set('employerName', e.target.value)} placeholder="Employer name" />
- `app/apply/fssa/FssaApplicationForm.tsx:290` — <textarea className={inputCls} rows={3} value={form.additionalBarriers} onChange={e => set('additionalBarriers', e.target.value)} placeholder="Optional..." />
- `app/apply/fssa/FssaApplicationForm.tsx:333` — placeholder="Type your full name"
- `app/apply/fssa/waitlist/page.tsx:247` — placeholder="e.g. WorkOne Indianapolis, FSSA Marion County"
- `app/apply/fssa/waitlist/page.tsx:273` — placeholder="Anything else we should know…"
- `app/apply/page.tsx:96` — placeholder="empty"
- `app/apply/program-holder/ProgramHolderForm.tsx:210` — placeholder={isBusinessOwner ? 'e.g. Kountry Kutz Barbershop' : ''}
- `app/apply/program-holder/ProgramHolderForm.tsx:230` — placeholder="State or local license #"
- ... 2870 more omitted from this generated summary.

## Required follow-up implementation batches

1. **Route/documentation cleanup:** for each missing documented route above, either add the route/page, update the documentation to the canonical route, or mark the document archived.
2. **Workflow cleanup:** for each missing workflow reference, either restore the workflow or update/remove stale documentation.
3. **Mock/live integration remediation:** replace production mock data with live DB/API/provider integrations where the provider is available; otherwise mark the feature blocked with the exact missing account, secret, migration, or infrastructure.
4. **Production integration verification:** validate Northflank, GitHub Actions, Stripe, Supabase, AI providers, and Dev Studio from an environment with real secrets and outbound egress.
5. **Evidence capture:** add screenshots, E2E test output, workflow run links, or live API results for every feature claimed as complete.
6. **Source marker burn-down:** remove real stubs/placeholders/hardcoded production fallbacks in small batches with tests.
7. **Archived document labeling:** historical audits and PRDs should be clearly labeled as archived if they no longer describe current production.

## Checklist of every document reviewed

- [x] `AGENTS-IMPROVEMENT-SPEC.md`
- [x] `AGENTS.md`
- [x] `AUTOPILOT_STATUS.md`
- [x] `BROKEN_FEATURES_FIX.md`
- [x] `COMPETITIVE_ANALYSIS.md`
- [x] `COMPONENT_DB_INTEGRATION_PROOF.md`
- [x] `COMPONENT_MANIFEST.md`
- [x] `CONTRIBUTING.md`
- [x] `DEPLOY.md`
- [x] `DEPLOY_TRIGGER.md`
- [x] `ENROLLMENT_FLOW_MAP.md`
- [x] `FEATURE-LIST.md`
- [x] `FRANCHISE_SETUP.md`
- [x] `LICENSES.md`
- [x] `MIGRATION_SUMMARY.md`
- [x] `README.md`
- [x] `REBUILD_EXECUTION_PLAN.md`
- [x] `SECURITY.md`
- [x] `SETUP.md`
- [x] `SITEMAP.md`
- [x] `SMOKE_TEST_REPORT.md`
- [x] `SNAP-ET-State-Plan-Final-Submission.md`
- [x] `SPONSORS.md`
- [x] `SUPPORT.md`
- [x] `TENANT_ISOLATION_RUNBOOK.md`
- [x] `TOP_RISKS.md`
- [x] `app/blog/redirect-config.md`
- [x] `app/performance-report.md`
- [x] `audit-packet/AUDIT_REPORT.md`
- [x] `audit-packet/EXECUTIVE_SUMMARY.md`
- [x] `canonical_systems.md`
- [x] `cloudflare-workers/README.md`
- [x] `cloudflare-workers/studio-ide/README.md`
- [x] `cloudflare-workers/studio-ide/SECURITY.md`
- [x] `components/README.md`
- [x] `dead_code_candidates.md`
- [x] `docs/API_DOCUMENTATION.md`
- [x] `docs/ARCHIVED_CODE.md`
- [x] `docs/CANONICAL_COMPONENTS.md`
- [x] `docs/CODEX_PLAYBOOK.md`
- [x] `docs/COURSE_ENGINE.md`
- [x] `docs/DEAD_CODE_AUDIT.md`
- [x] `docs/DEPLOYMENT-OPTIONS.md`
- [x] `docs/DESIGN_SYSTEM.md`
- [x] `docs/INDIANA_WORKFORCE_COMPLIANCE.md`
- [x] `docs/INFRASTRUCTURE_HARDENING_PLAN.md`
- [x] `docs/LOCAL_DEVELOPMENT.md`
- [x] `docs/OPERATIONAL_MATURITY_TODO.md`
- [x] `docs/PRODUCTION_READINESS_TODO.md`
- [x] `docs/README.md`
- [x] `docs/SECURITY.md`
- [x] `docs/SETUP.md`
- [x] `docs/STAGING-VERIFICATION.md`
- [x] `docs/SYSTEM_INTEGRITY_AUDIT_2026-06-07.md`
- [x] `docs/USER_FLOWS.md`
- [x] `docs/VIDEO_HERO_FIX.md`
- [x] `docs/access-model.md`
- [x] `docs/architecture-overview.md`
- [x] `docs/architecture/ai-boundaries.md`
- [x] `docs/architecture/canonical-routes.md`
- [x] `docs/architecture/shell-hierarchy.md`
- [x] `docs/audits/2025-platform-audit.md`
- [x] `docs/audits/2026-04-19-daily-stability-report.md`
- [x] `docs/audits/ADMIN_DASHBOARD_STORAGE_AUDIT.md`
- [x] `docs/audits/FINAL-PRODUCTION-READINESS-VALIDATION-2026-05-11.md`
- [x] `docs/audits/IMAGE_ASSETS_AUDIT.md`
- [x] `docs/audits/VISUAL_LAYOUT_AUDIT.md`
- [x] `docs/audits/admin-runtime-idle-and-storage-2026-06-05.md`
- [x] `docs/audits/apply-header-menu-audit-2026-05.md`
- [x] `docs/audits/apply-pages-health-checklist.md`
- [x] `docs/audits/aws-ecs-decommission-2026-06.md`
- [x] `docs/audits/marketing-visual-compliance-audit.md`
- [x] `docs/audits/node-20-bookworm-slim-runtime-audit.md`
- [x] `docs/audits/northflank-build-timeout-health-audit.md`
- [x] `docs/audits/northflank-pnpm-cache-mount-audit.md`
- [x] `docs/audits/northflank-pnpm-fetch-enospc-audit.md`
- [x] `docs/audits/pdfjs-canvas-production.md`
- [x] `docs/audits/production-followups-checklist-2026-06-05.md`
- [x] `docs/audits/production-readiness-validation-2026-05-11.md`
- [x] `docs/audits/redirect-parity-checklist-2026-05-14.md`
- [x] `docs/audits/root-archive-2026-05-14/ACTIVATION_FORENSIC_REPORT.md`
- [x] `docs/audits/root-archive-2026-05-14/AUDIT_BARBER_PAYMENT_PLAN.md`
- [x] `docs/audits/root-archive-2026-05-14/AUDIT_DUPLICATES_CATEGORIZED.md`
- [x] `docs/audits/root-archive-2026-05-14/AUDIT_LMS_COURSE_GENERATOR_BARBER_DASHBOARD.md`
- [x] `docs/audits/root-archive-2026-05-14/AUDIT_REPORT.md`
- [x] `docs/audits/root-archive-2026-05-14/AUDIT_REPORT_111_PAGES.md`
- [x] `docs/audits/root-archive-2026-05-14/AUDIT_RUBRIC.md`
- [x] `docs/audits/root-archive-2026-05-14/IMAGE_AUDIT_REPORT.md`
- [x] `docs/audits/root-archive-2026-05-14/MARKETING_AUDIT_RESULTS.md`
- [x] `docs/audits/root-archive-2026-05-14/MARKETING_PAGE_AUDIT.md`
- [x] `docs/audits/root-archive-2026-05-14/PRODUCTION_AUDIT_REPORT.md`
- [x] `docs/audits/root-archive-2026-05-14/SITE_AUDIT_REPORT.md`
- [x] `docs/audits/root-archive-2026-05-14/SMOKE_TEST_REPORT.md`
- [x] `docs/audits/root-archive-2026-05-14/STRUCTURAL_AUDIT.md`
- [x] `docs/audits/supabase-platform-discipline-audit-2026-06-05.md`
- [x] `docs/business/ADMIN_DASHBOARD_COMMERCIALIZATION_CHECKLIST.md`
- [x] `docs/business/ADMIN_ONBOARDING_RUNBOOK.md`
- [x] `docs/business/ADMIN_REMEDIATION_TODO.md`
- [x] `docs/business/ADMIN_SECURITY_SECRETS_RUNBOOK.md`
- [x] `docs/business/DEVSTUDIO_GITHUB_DISPATCH_CHECKLIST.md`
- [x] `docs/capability-statement.md`
- [x] `docs/cna-idoh-alignment-matrix.md`
- [x] `docs/compliance-overview.md`
- [x] `docs/compliance/public-metrics-evidence-binder.md`
- [x] `docs/deploy/container-egress-deploy-blocker.md`
- [x] `docs/deploy/manual-github-deploy-package.md`
- [x] `docs/deploy/northflank-separate-lms-admin.md`
- [x] `docs/diagnostics.md`
- [x] `docs/enrollment-funding-states.md`
- [x] `docs/enrollment-state-policy.md`
- [x] `docs/grants/employindy-2026-003-package/00-cover-letter.md`
- [x] `docs/grants/employindy-2026-003-package/01-table-of-contents.md`
- [x] `docs/grants/employindy-2026-003-package/02-proposal-narrative.md`
- [x] `docs/grants/employindy-2026-003-package/03-wioa-14-elements-plan.md`
- [x] `docs/grants/employindy-2026-003-package/04-projected-performance-outcomes.md`
- [x] `docs/grants/employindy-2026-003-package/05-budget-template.md`
- [x] `docs/grants/employindy-2026-003-package/06-mou-warren-central.md`
- [x] `docs/grants/employindy-2026-003-package/07-org-chart.md`
- [x] `docs/grants/employindy-2026-003-package/08-letter-of-recognition-warren-central.md`
- [x] `docs/grants/employindy-rfp-2026-003-proposal.md`
- [x] `docs/grants/mou-elevate-warren-central.md`
- [x] `docs/hero-video-standard.md`
- [x] `docs/hvac-migration-decision-memo.md`
- [x] `docs/migration-discipline-audit-2026-05-09.md`
- [x] `docs/module4-lock-packet.md`
- [x] `docs/module6-prebuild-spec.md`
- [x] `docs/northflank-dns-durable.md`
- [x] `docs/page-design-standard.md`
- [x] `docs/pending-migrations.md`
- [x] `docs/platform-e2e-audit-2026-05.md`
- [x] `docs/platform-hardening-audit-2026-05-31.md`
- [x] `docs/platform-owner-tenant-model.md`
- [x] `docs/platform-readiness-completion-report.md`
- [x] `docs/platform-readiness-implementation-plan.md`
- [x] `docs/platform-saas-blueprint.md`
- [x] `docs/prestige-elevation-media-pipeline.md`
- [x] `docs/production-activation-2026-05.md`
- [x] `docs/production-ready-objective.md`
- [x] `docs/repository-scope.md`
- [x] `docs/schema-drift-decisions.md`
- [x] `docs/session-state-2026-04-20.md`
- [x] `docs/store-14-day-trial.md`
- [x] `docs/supabase-pending-migrations.md`
- [x] `docs/testing-db-map.md`
- [x] `documents/cna-approval-package/01-program-overview.md`
- [x] `documents/cna-approval-package/02-curriculum-outline.md`
- [x] `documents/cna-approval-package/03-lessons-mod1-mod3.md`
- [x] `documents/cna-approval-package/04-lessons-mod4-mod6.md`
- [x] `documents/cna-approval-package/05-lessons-mod7-mod12.md`
- [x] `documents/cna-approval-package/06-skills-checklist.md`
- [x] `documents/cna-approval-package/07-clinical-training-plan.md`
- [x] `documents/cna-approval-package/08-student-policies.md`
- [x] `documents/cna-approval-package/09-instructor-facility-requirements.md`
- [x] `documents/cna-approval-package/10-assessments-and-answer-keys.md`
- [x] `documents/cna-approval-package/11-student-forms.md`
- [x] `documents/cna-approval-package/12-program-schedule.md`
- [x] `documents/cna-approval-package/13-compliance-language.md`
- [x] `documents/serene-comfort-care/policy-manual-architecture.md`
- [x] `exports/email-copies/README.md`
- [x] `fly-containers/README.md`
- [x] `internal-docs/README.md`
- [x] `internal-docs/internal/ADMIN_RUNBOOK.md`
- [x] `internal-docs/internal/ARCHITECTURE-REPORT.md`
- [x] `internal-docs/internal/ARCHITECTURE.md`
- [x] `internal-docs/internal/AUDIT_RECOVERY_PROCEDURE.md`
- [x] `internal-docs/internal/AUTOMATED_EVIDENCE_APPROVAL_SYSTEM.md`
- [x] `internal-docs/internal/AUTOMATION_COMPLIANCE_CHECKLIST.md`
- [x] `internal-docs/internal/AVATAR-GUIDE-SYSTEM.md`
- [x] `internal-docs/internal/BUYER_DECK_OUTLINE.md`
- [x] `internal-docs/internal/BUYER_DEMO_SCRIPT.md`
- [x] `internal-docs/internal/BUYER_READINESS.md`
- [x] `internal-docs/internal/COHORT_ONBOARDING_CHECKLIST.md`
- [x] `internal-docs/internal/COPYRIGHT-PROTECTION.md`
- [x] `internal-docs/internal/DASHBOARD_READINESS_AUDIT.md`
- [x] `internal-docs/internal/DATA-IMPORT-GUIDE.md`
- [x] `internal-docs/internal/DOCS-INDEX-OLD.md`
- [x] `internal-docs/internal/ENROLLMENT_TABLES.md`
- [x] `internal-docs/internal/ENTERPRISE_READINESS.md`
- [x] `internal-docs/internal/FEATURE-INVENTORY-2025.md`
- [x] `internal-docs/internal/LAUNCH-PROOF-EVIDENCE.md`
- [x] `internal-docs/internal/LICENSING-CHECKLIST.md`
- [x] `internal-docs/internal/LICENSING-PLAYBOOK.md`
- [x] `internal-docs/internal/ONBOARDING_MATERIALS_AUDIT.md`
- [x] `internal-docs/internal/OPERATIONAL_READINESS_AUDIT.md`
- [x] `internal-docs/internal/PLATFORM-TRANSPARENCY-INDEX.md`
- [x] `internal-docs/internal/PLATFORM_PRICING.md`
- [x] `internal-docs/internal/PRODUCTION-READINESS-REPORT.md`
- [x] `internal-docs/internal/REGULATORY_FUNDING_PACKAGE.md`
- [x] `internal-docs/internal/REPO_AND_ENVIRONMENT_OVERVIEW.md`
- [x] `internal-docs/internal/SCOPE-FREEZE.md`
- [x] `internal-docs/internal/SEO-GOVERNANCE-SUMMARY.md`
- [x] `internal-docs/internal/SEO-GOVERNANCE.md`
- [x] `internal-docs/internal/SEO-MONITORING-CHECKLIST.md`
- [x] `internal-docs/internal/SMTP_SETUP_GUIDE.md`
- [x] `internal-docs/internal/STAGING_ENVIRONMENT.md`
- [x] `internal-docs/internal/STORE-AUDIT.md`
- [x] `internal-docs/internal/STRIPE_SETUP.md`
- [x] `internal-docs/internal/TAKEDOWN-TEMPLATES.md`
- [x] `internal-docs/internal/VERIFIED_SYSTEM_STATUS.md`
- [x] `internal-docs/internal/activation-audit.md`
- [x] `internal-docs/internal/la-plaza-followup-email.md`
- [x] `internal-docs/internal/la-plaza-loc-proposal.md`
- [x] `internal-docs/internal/loc-readiness-audit.md`
- [x] `internal-docs/internal/proof-pack.md`
- [x] `internal-docs/outreach/EMPLOYER-AGREEMENT-OUTLINE.md`
- [x] `internal-docs/outreach/EMPLOYER-SPONSORSHIP-PITCH.md`
- [x] `internal-docs/outreach/WORKFORCE-REFERRAL-ONE-PAGER.md`
- [x] `internal-docs/policies/EMPLOYER-SPONSORSHIP.md`
- [x] `internal-docs/policies/ENROLLMENT-SCRIPT.md`
- [x] `internal-docs/policies/FUNDING-PATHWAYS.md`
- [x] `internal-docs/policies/GROWTH-PLAYBOOK.md`
- [x] `internal-docs/policies/INTAKE-CHECKLIST.md`
- [x] `internal-docs/policies/INTERNAL-TUITION-POLICY.md`
- [x] `internal-docs/policies/MONTHLY-COMPLIANCE-AUDIT.md`
- [x] `internal-docs/policies/PROGRAM-SELECTION.md`
- [x] `internal-docs/policies/STAFF-TRAINING-CHECKLIST.md`
- [x] `legacy_program_paths.md`
- [x] `lib/api/README.md`
- [x] `lib/audit/README.md`
- [x] `lib/certificates/README.md`
- [x] `lib/email-templates/README.md`
- [x] `lib/tenant/README.md`
- [x] `lms-content/COMPLETE_TRAINING_PORTFOLIO.md`
- [x] `lms-content/JRI_SETUP_GUIDE.md`
- [x] `lms-content/careersafe-osha/CAREERSAFE_OSHA_TRAINING.md`
- [x] `lms-content/certifications/BYBLACK_CERTIFICATION.md`
- [x] `lms-content/certifications/INDIANA_PROCUREMENT_REGISTRATION.md`
- [x] `lms-content/certifications/SAM_GOV_REGISTRATION.md`
- [x] `lms-content/certiport/CERTIPORT_CATC_SETUP.md`
- [x] `lms-content/curricula/README.md`
- [x] `lms-content/hsi-safety/HSI_SAFETY_TRAINING.md`
- [x] `lms-content/milady-rise/MILADY_RISE_SETUP.md`
- [x] `lms-content/national-drug-screening/NDS_DOT_ORAL_FLUID_TRAINING.md`
- [x] `lms-content/nrf-rise-up/NRF_RISE_UP_SETUP.md`
- [x] `lms_architecture.md`
- [x] `outreach/wave-plan.md`
- [x] `proofs/ACCESSIBILITY_TEST_RESULTS.md`
- [x] `proofs/AI_BUYER_OPERATOR_SPEC.md`
- [x] `proofs/BOUNDARY_AGENCY.md`
- [x] `proofs/BOUNDARY_DISTRICT.md`
- [x] `proofs/BOUNDARY_DOCUMENT.md`
- [x] `proofs/BOUNDARY_NONPROFIT.md`
- [x] `proofs/BUYER_FOLLOWUP_ANSWERS.md`
- [x] `proofs/BUYER_SCORING_RUBRIC.md`
- [x] `proofs/COMPLIANCE_GUARDRAILS.md`
- [x] `proofs/DEFLECTION_LINES.md`
- [x] `proofs/DEMO_SCRIPT_10MIN.md`
- [x] `proofs/DEMO_SCRIPT_5MIN_EXEC.md`
- [x] `proofs/EMAIL_FOLLOWUPS.md`
- [x] `proofs/EXHIBIT_A_CONTRACT.md`
- [x] `proofs/EXHIBIT_A_FALLBACK.md`
- [x] `proofs/INTERNAL_APPROVAL_MEMO.md`
- [x] `proofs/MUTUAL_NDA.md`
- [x] `proofs/ONBOARDING_SCRIPT.md`
- [x] `proofs/ORDER_FORM.md`
- [x] `proofs/PERSONA_SCRIPTS.md`
- [x] `proofs/PILOT_MOU_ADDENDUM.md`
- [x] `proofs/PRICING_TIERS.md`
- [x] `proofs/PRICING_TRANSITION.md`
- [x] `proofs/QUALIFICATION_TREE.md`
- [x] `proofs/RENEWAL_EXPANSION_SCRIPT.md`
- [x] `proofs/SECURITY_COMPLIANCE_PACK.md`
- [x] `proofs/SUCCESS_SCORECARD_90DAY.md`
- [x] `proofs/TEST_CHECKLIST.md`
- [x] `public/digital-products/README.md`
- [x] `public/docs/CERTIFICATION_PORTFOLIO.md`
- [x] `public/docs/Indiana-Barbershop-Apprenticeship-MOU.md`
- [x] `public/docs/PARTNER_MOU_TEMPLATE.md`
- [x] `public/docs/PROGRAM_HOLDER_ONBOARDING_PACKET.md`
- [x] `public/docs/chatbot/buyer-evaluation-prompt.md`
- [x] `public/docs/chatbot/internal-approval-memo.md`
- [x] `public/docs/chatbot/nda-template.md`
- [x] `public/docs/chatbot/security-compliance-pack.md`
- [x] `public/docs/chatbot/why-not-build-this-yourself.md`
- [x] `public/docs/revenue-sharing-policy.md`
- [x] `public/docs/syllabi/ETPL_MASTER_SUBMISSION_PACKAGE.md`
- [x] `public/docs/syllabi/barber-apprenticeship.md`
- [x] `public/docs/syllabi/beauty-career-educator.md`
- [x] `public/docs/syllabi/building-maintenance.md`
- [x] `public/docs/syllabi/business-startup-marketing.md`
- [x] `public/docs/syllabi/culinary-arts.md`
- [x] `public/docs/syllabi/electrical.md`
- [x] `public/docs/syllabi/emergency-health-safety-tech.md`
- [x] `public/docs/syllabi/hvac-technician.md`
- [x] `public/docs/syllabi/it-support.md`
- [x] `public/docs/syllabi/medical-assistant.md`
- [x] `public/docs/syllabi/peer-recovery-coach.md`
- [x] `public/docs/syllabi/peer-support-professional.md`
- [x] `public/docs/syllabi/pharmacy-tech.md`
- [x] `public/docs/syllabi/phlebotomy.md`
- [x] `public/docs/syllabi/professional-esthetician.md`
- [x] `public/docs/syllabi/truck-driving.md`
- [x] `public/docs/syllabi/welding.md`
- [x] `public/hls/sample/README.md`
- [x] `public/images/prestige-elevation/README.md`
- [x] `public/videos/hero-scripts.md`
- [x] `public/workforce-partner-packet.md`
- [x] `repo_audit_report.md`
- [x] `repository_cleanup_report.md`
- [x] `route_audit.md`
- [x] `schema_audit.md`
- [x] `scripts/README-AI-WORKERS.md`
- [x] `scripts/README.md`
- [x] `scripts/admin-final-completeness-report.md`
- [x] `scripts/apply-migrations.md`
- [x] `scripts/course-import-templates/README.md`
- [x] `scripts/insert-surface-matrix.md`
- [x] `scripts/load/README.md`
- [x] `scripts/schema-contract-report.md`
- [x] `scripts/schema-drift-report.md`
- [x] `scripts/setup-stripe-licensing.md`
- [x] `scripts/test-user-journeys.md`
- [x] `scripts/video-scripts/reel-barber-apprenticeship.md`
- [x] `scripts/video-scripts/reel-elevate-enroll-today.md`
- [x] `scripts/workers/README.md`
- [x] `storage_audit.md`
- [x] `supabase/functions/public-submit/DEPLOY.md`
- [x] `supabase/seeds/README.md`
- [x] `tests/security/pentest-checklist.md`
