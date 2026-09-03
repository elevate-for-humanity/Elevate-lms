# PLATFORM COMPLETION ROADMAP
**Elevate for Humanity LMS Platform**  
**Audit Date:** July 16, 2026  

---

## RELEASE 1: STABILITY (Week 1)

### P0 - Route Collisions

| Gap | Evidence | Fix | File | Priority |
|-----|----------|-----|------|----------|
| /employers collision | Two pages resolve to same URL | Delete redirect page | `app/employers/page.tsx` | P0 |
| /accessibility collision | Two pages resolve to same URL | Delete redirect page | `app/accessibility/page.tsx` | P0 |

### P0 - SEO Validation

| Gap | Evidence | Fix | File | Priority |
|-----|----------|-----|------|----------|
| Missing metadata | SEO check fails | Add metadata or redirect | `app/accessibility/page.tsx` | P0 |
| Missing metadata | SEO check fails | Add metadata | `app/employers/page.tsx` | P0 |

### P1 - Build Reliability

| Gap | Evidence | Fix | File | Priority |
|-----|----------|-----|------|----------|
| TypeScript errors | `npm run typecheck` | Fix type issues | Multiple | P1 |
| Platform doctor failures | 82 CRITICAL findings | Address criticals | Various | P1 |

---

## RELEASE 2: COMPLETE JOURNEYS (Week 2)

### P1 - Student Learning E2E

| Gap | Evidence | Fix | File | Priority |
|-----|----------|-----|------|----------|
| Lesson completion not tested | No E2E test | Add test student, complete lesson | Test | P1 |
| Progress tracking not verified | Table exists, no verification | Test progress update | `lesson_progress` | P1 |
| Certificate not tested | Table exists | Test certificate generation | `certificates` | P1 |

### P1 - Course Builder Wiring

| Gap | Evidence | Fix | File | Priority |
|-----|----------|-----|------|----------|
| AI generator not connected | Generator exists, no API | Create `/api/course/generate` | `app/api/course/generate/route.ts` | P1 |
| No trigger from UI | Workflow page exists | Wire to API | `app/admin/education-workflow/page.tsx` | P1 |
| Approval export not tested | Code exists | Test with real data | `lib/curriculum/export/` | P1 |

### P1 - Enrollment Flow

| Gap | Evidence | Fix | File | Priority |
|-----|----------|-----|------|----------|
| Payment webhook not tested | Handler exists | Test with Stripe CLI | `app/api/webhooks/stripe/route.ts` | P1 |
| Enrollment creation not verified | Logic exists | Test complete flow | `lib/enrollment.ts` | P1 |

---

## RELEASE 3: COMMERCIAL DEMONSTRATION (Week 3)

### P1 - Demo Data

| Gap | Evidence | Fix | File | Priority |
|-----|----------|-----|------|----------|
| No realistic program | Empty database | Seed Phlebotomy program | `scripts/seed/program.ts` | P1 |
| No test students | Empty students | Create 3 test accounts | `scripts/seed/users.ts` | P1 |
| No test instructor | Empty instructors | Create test instructor | `scripts/seed/users.ts` | P1 |

### P2 - AI Studios Connection

| Gap | Evidence | Fix | File | Priority |
|-----|----------|-----|------|----------|
| PARIS agents not operational | 18 types defined | Create execution routes | `lib/paris/` | P2 |
| Dev Studio not connected | Container panel exists | Wire to Northflank | `app/admin/dev-studio/` | P2 |
| CFD Studio no execution | Schema exists | Add worker | `lib/cfd/worker.ts` | P2 |

### P2 - Security Hardening

| Gap | Evidence | Fix | File | Priority |
|-----|----------|-----|------|----------|
| RLS not reviewed | Policies exist | Audit for gaps | `supabase/migrations/` | P2 |
| API rate limiting | Not configured | Add limits | `middleware.ts` | P2 |
| Secret exposure | Some in code | Move to env | Various | P2 |

---

## GAP MATRIX

| Category | Gap | Impact | Files | Fix | Dependency |
|----------|-----|--------|-------|-----|------------|
| **Build** | Route collisions | Cannot deploy | 2 files | Delete | None |
| **Build** | SEO failures | Deploy blocked | 2 pages | Add metadata | None |
| **LMS** | Progress tracking untested | Cannot verify | 1 table | E2E test | Test data |
| **LMS** | Certificate untested | Cannot verify | 1 table | E2E test | Test data |
| **Builder** | AI not wired | No generation | 3 files | Create API | AI key |
| **Builder** | Export untested | No output | 3 files | Test | Test data |
| **Enroll** | Webhook untested | Payment broken | 1 route | Stripe CLI | Stripe |
| **Demo** | No test data | Cannot demo | Scripts | Seed data | None |
| **AI** | Agents idle | No automation | 18 agents | Routes | AI keys |
| **Security** | RLS unchecked | Data leak risk | Policies | Audit | None |

---

## ACCEPTANCE TESTS

### Release 1 Acceptance
```
1. npm run build succeeds
2. npm run seo:check passes
3. No route collisions in build output
```

### Release 2 Acceptance
```
1. Test student completes 1 lesson
2. Progress updates in database
3. Course builder generates curriculum
4. Approval packet exports
5. Stripe webhook creates enrollment
```

### Release 3 Acceptance
```
1. Demo script runs end-to-end
2. PARIS agent responds to command
3. RLS audit complete
4. No critical security findings
```

---

## TIMELINE

| Week | Focus | Deliverables |
|------|-------|--------------|
| Week 1 | Stability | Build passes, routes fixed |
| Week 2 | Completeness | All E2E journeys work |
| Week 3 | Polish | Demo ready, security hardened |

---

## RESOURCE ESTIMATE

| Task | Hours | Priority |
|------|-------|---------|
| Fix route collisions | 1 | P0 |
| Fix SEO metadata | 2 | P0 |
| E2E student journey | 4 | P1 |
| Wire course builder | 8 | P1 |
| Test payment webhook | 3 | P1 |
| Seed demo data | 4 | P1 |
| AI studio connection | 16 | P2 |
| Security hardening | 8 | P2 |

**Total: ~46 hours**
