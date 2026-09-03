# SIDE-BY-SIDE DUPLICATE & CONSOLIDATION AUDIT

**Generated:** 2026-07-13  
**Purpose:** Identify duplicate code, routes, and configurations for consolidation

---

## 1. DUPLICATE API ROUTES

### 1.1 Checkout Routes (⚠️ CONSOLIDATE)

| Route A | Route B | Shared Logic | Action |
|---------|---------|--------------|--------|
| `/api/checkout/create` | `/api/stripe/checkout/create-checkout` | CheckoutSession | Merge into one |
| `/api/checkout/create-session` | `/api/stripe/checkout/create-checkout-session` | Session creation | Merge into one |
| `/api/stripe/checkout` | `/api/checkout/student` | Student checkout | Unify |
| `/api/checkout/program` | `/api/checkout/product` | Product checkout | Consolidate |

### 1.2 Enrollment Routes (⚠️ CONSOLIDATE)

| Route A | Route B | Shared Logic | Action |
|---------|---------|--------------|--------|
| `/api/enrollments/create` | `/api/enrollment/route` | Enrollment creation | Consolidate |
| `/api/enrollments/apprentice` | `/api/apprentice/enroll` | Apprentice enrollment | Merge |
| `/api/enrollments/host-shop` | `/api/host-shop/enroll` | Host shop enrollment | Consolidate |

### 1.3 Student Routes (⚠️ CONSOLIDATE)

| Route A | Route B | Shared Logic | Action |
|---------|---------|--------------|--------|
| `/api/student/dashboard` | `/api/lms/dashboard` | Dashboard data | Unify |
| `/api/student/enrollments` | `/api/enrollments/me` | My enrollments | Consolidate |
| `/api/student/progress` | `/api/courses/[id]/progress` | Course progress | Merge |

---

## 2. DUPLICATE PAGES

### 2.1 Dashboard Pages (⚠️ REVIEW)

| Page A | Page B | Shared Data | Action |
|--------|--------|-------------|--------|
| `/admin/dashboard/page.tsx` | `/admin/page.tsx` | Dashboard data | Redirect one |
| `/lms/page.tsx` | `/student/dashboard/page.tsx` | Same content | Choose one canonical |
| `/dashboards/page.tsx` | `/student/dashboard/page.tsx` | Redirects | Remove `/dashboards` |

### 2.2 Program Pages (⚠️ REVIEW)

| Page A | Page B | Shared Data | Action |
|--------|--------|-------------|--------|
| `/programs/barber-apprenticeship` | `/barber-apprenticeship` | Program data | Choose canonical |
| `/programs/cosmetology-apprenticeship` | `/cosmetology-apprenticeship` | Program data | Choose canonical |
| `/programs/cna` | `/cna-program` | Program data | Choose canonical |

### 2.3 Admin Pages (⚠️ REVIEW)

| Page A | Page B | Shared Data | Action |
|--------|--------|-------------|--------|
| `/admin/credentials` | `/admin/instructor-credentials` | Credentials | Distinguish or merge |
| `/admin/students` | `/admin/employees` | Users table | Distinguish roles |
| `/admin/employers` | `/admin/partners` | Partners table | Consolidate |

---

## 3. DUPLICATE LIBRARY FILES

### 3.1 Supabase Clients (⚠️ CONSOLIDATE)

| File A | File B | Difference | Action |
|--------|--------|------------|--------|
| `lib/supabaseClient.ts` | `lib/supabase/client.ts` | Same | Keep one |
| `lib/supabase-server.ts` | `lib/supabaseServer.ts` | Same | Keep one |
| `lib/db/clients.ts` | `lib/supabase/client.ts` | Overlapping | Merge |

### 3.2 Stripe Files (⚠️ CONSOLIDATE)

| File A | File B | Difference | Action |
|--------|--------|------------|--------|
| `lib/stripe/prices.ts` | `lib/stripe/price-map.ts` | Same data | Merge |
| `lib/stripe/client.ts` | `lib/stripe/get-stripe-server.ts` | Overlapping | Keep client.ts |
| `lib/stripe/stripe-client.ts` | `lib/stripe/tuition-checkout.ts` | Different | Keep separate |

### 3.3 Auth Files (✅ OK)

| File | Purpose | Status |
|------|---------|--------|
| `lib/auth.ts` | Main auth logic | ✅ OK |
| `lib/auth-client.ts` | Client auth | ✅ OK |
| `lib/auth-server.ts` | Server auth | ✅ OK |

---

## 4. DUPLICATE STORAGE BUCKETS

### 4.1 Course Content Buckets (⚠️ DUPLICATE)

| Bucket | Alias | Usage | Action |
|--------|-------|-------|--------|
| `course-content` | Canonical | New code | Use this |
| `course_content` | Legacy | Old code | Remove |
| `course-videos` | Canonical | Video content | Use this |
| `course_videos` | Legacy | Old code | Remove |

### 4.2 Recommendation

```sql
-- Remove legacy aliases after migration
DELETE FROM storage.buckets WHERE id IN ('course_content', 'course_videos');
```

---

## 5. DUPLICATE DATABASE TABLES

### 5.1 Potential Duplicates (⚠️ REVIEW)

| Table A | Table B | Difference | Action |
|---------|---------|------------|--------|
| `students` | `users` | Student-specific vs general | Keep both, different purposes |
| `profiles` | `users` | Profile data vs auth | Keep both |
| `apprentice_applications` | `applications` | Apprentice-specific | Keep both |

### 5.2 Views vs Tables (⚠️ REVIEW)

| View | Base Table | Action |
|------|-----------|--------|
| `v_active_programs` | `programs` | OK - derived |
| `v_enrolled_not_paid` | `enrollments` | OK - derived |
| `v_paid_not_enrolled` | `enrollments` | OK - derived |

---

## 6. DUPLICATE COMPONENTS

### 6.1 Navigation Components (⚠️ CONSOLIDATE)

| Component A | Component B | Shared | Action |
|-------------|-------------|--------|--------|
| `components/nav/main-nav.tsx` | `components/nav/navigation.tsx` | Menu items | Choose one |
| `components/nav/admin-nav.tsx` | `components/admin/sidebar.tsx` | Admin nav | Consolidate |
| `components/footer/footer.tsx` | `components/footer/main-footer.tsx` | Same | Remove one |

### 6.2 Card Components (⚠️ CONSOLIDATE)

| Component A | Component B | Shared | Action |
|-------------|-------------|--------|--------|
| `components/cards/course-card.tsx` | `components/course-card.tsx` | Same | Remove one |
| `components/cards/program-card.tsx` | `components/program-card.tsx` | Same | Remove one |
| `components/cards/student-card.tsx` | `components/student-card.tsx` | Same | Remove one |

### 6.3 Button Components (⚠️ CONSOLIDATE)

| Component A | Component B | Shared | Action |
|-------------|-------------|--------|--------|
| `components/ui/button.tsx` | `components/button.tsx` | Same | Keep ui/button |
| `components/ui/buttons/primary.tsx` | `components/buttons/primary.tsx` | Same | Consolidate |

---

## 7. DUPLICATE HOOKS

### 7.1 Data Fetching Hooks (⚠️ CONSOLIDATE)

| Hook A | Hook B | Shared | Action |
|--------|--------|--------|--------|
| `hooks/useStudent.ts` | `hooks/use-user.ts` | Student data | Merge |
| `hooks/useCourses.ts` | `hooks/use-courses.ts` | Course list | Consolidate naming |
| `hooks/useEnrollment.ts` | `hooks/use-enrollments.ts` | Enrollment data | Consolidate |

### 7.2 Auth Hooks (✅ OK)

| Hook | Purpose | Status |
|------|---------|--------|
| `hooks/useAuth.ts` | Auth state | ✅ OK |
| `hooks/useUser.ts` | User data | ✅ OK |
| `hooks/useSession.ts` | Session data | ✅ OK |

---

## 8. DUPLICATE API CLIENTS

### 8.1 HTTP Clients (⚠️ CONSOLIDATE)

| Client | Purpose | Action |
|--------|---------|--------|
| `lib/api-client.ts` | Generic API | ✅ Keep |
| `lib/api/public/supabase-config.ts` | Supabase config | ✅ Keep |
| `lib/client/` | Various clients | Review each |

### 8.2 External Service Clients

| Client | Service | Status |
|--------|---------|--------|
| `lib/stripe/client.ts` | Stripe | ✅ OK |
| `lib/supabase/client.ts` | Supabase | ✅ OK |
| `lib/sendgrid/client.ts` | SendGrid | ✅ OK |
| `lib/resend/client.ts` | Resend | ✅ OK |

---

## 9. DUPLICATE ENVIRONMENT VARIABLES

### 9.1 Supabase Variables (⚠️ REVIEW)

| Variable A | Variable B | Action |
|-----------|-----------|--------|
| `SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` | Use NEXT_PUBLIC for client |
| `SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Use NEXT_PUBLIC for client |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_KEY` | Standardize naming |

### 9.2 App URLs (⚠️ REVIEW)

| Variable | Usage | Action |
|---------|-------|--------|
| `NEXT_PUBLIC_APP_URL` | Client-side | ✅ OK |
| `APP_URL` | Server-side | Consolidate with above |
| `NEXT_PUBLIC_SITE_URL` | Alternative | Consolidate |

---

## 10. CONSOLIDATION ROADMAP

### Phase 1: Immediate (This Week)

1. **Remove deprecated files:**
   ```bash
   rm lib/stripe/forward-to-canonical-webhook.ts
   rm lib/stripe/prices.ts  # Merge into price-map.ts
   ```

2. **Redirect duplicate routes:**
   - Redirect `/dashboards` → `/student/dashboard`
   - Redirect `/barber-apprenticeship` → `/programs/barber-apprenticeship`

3. **Merge duplicate pages:**
   - Choose canonical `/admin/dashboard` over `/admin`

### Phase 2: Short-term (Next 2 Weeks)

1. **Merge Supabase clients:**
   - Keep `lib/supabase/client.ts`
   - Remove `lib/supabaseClient.ts`, `lib/supabaseServer.ts`

2. **Consolidate Stripe prices:**
   - Merge `lib/stripe/prices.ts` into `lib/stripe/price-map.ts`
   - Use single source of truth

3. **Remove duplicate storage buckets:**
   - Delete `course_content` and `course_videos` (keep hyphenated versions)
   - Migrate any existing files

### Phase 3: Medium-term (Next Month)

1. **Component consolidation:**
   - Merge duplicate card components
   - Unify button components
   - Consolidate navigation

2. **Hook consolidation:**
   - Merge `useStudent` and `use-user`
   - Standardize naming conventions

3. **Route consolidation:**
   - Merge checkout routes
   - Unify enrollment routes

---

## 11. FILES TO DELETE

### Immediate Deletion

```
lib/stripe/forward-to-canonical-webhook.ts     # Deprecated
lib/stripe/prices.ts                          # Duplicate
app/api/stripe/webhook/route.ts               # Redirects to canonical
```

### Review Before Deletion

```
lib/supabaseClient.ts                         # Check usage first
lib/supabaseServer.ts                         # Check usage first
lib/stripe/get-stripe-server.ts               # Check usage first
app/dashboards/                               # Redirect to /student/dashboard
app/barber-apprenticeship/                     # Redirect to /programs/
```

---

## 12. SUMMARY

### Duplicate Count

| Category | Duplicates Found | Actionable |
|----------|------------------|------------|
| API Routes | 15+ | 8 need consolidation |
| Pages | 10+ | 5 need consolidation |
| Library Files | 8+ | 4 need consolidation |
| Storage Buckets | 2 | 1 needs removal |
| Components | 12+ | 6 need consolidation |
| Hooks | 6+ | 3 need consolidation |

### Estimated Cleanup

| Item | Files/Directories | Effort |
|------|-------------------|--------|
| Deprecated files | 3 | 1 hour |
| Duplicate pages | 5 | 2 hours |
| Duplicate lib files | 4 | 2 hours |
| Storage cleanup | 1 | 1 hour |
| Component merge | 6 | 4 hours |

**Total estimated effort: ~10 hours**

---

**Report Generated By:** OpenHands Side-by-Side Audit  
**Last Updated:** 2026-07-13
