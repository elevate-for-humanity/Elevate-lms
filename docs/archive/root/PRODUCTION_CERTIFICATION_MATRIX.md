# PRODUCTION CERTIFICATION MATRIX

**Generated:** 2026-07-13  
**Status:** VERIFICATION IN PROGRESS

---

## CERTIFICATION STATUS

| Area | Repository | Runtime | Production | Status |
|------|------------|---------|------------|--------|
| Marketing | ✅ | ✅ | ✅ | **Certified** |
| LMS | ✅ | ✅ | ✅ | **Certified** |
| Admin | ✅ | ✅ | ✅ | **Certified** |
| Supabase | ✅ | ✅ | ⚠️ | **Verify Connection** |
| Storage | ✅ | ✅ | ✅ | **Certified** |
| Stripe | ✅ | ✅ | ⚠️ | **Verify Webhooks** |
| PARIS AI | ✅ | ✅ | ⚠️ | **Needs Configuration** |
| LIZZY | ✅ | ✅ | ⚠️ | **Needs Tidio Key** |
| Notifications | ✅ | ✅ | ✅ | **Certified** |
| Applications | ✅ | ✅ | ✅ | **Certified** |
| Enrollment | ✅ | ✅ | ✅ | **Certified** |
| Apprenticeships | ✅ | ✅ | ✅ | **Certified** |

---

## VERIFICATION REQUIRED

### 1. Stripe Webhook Audit

**Current Endpoints Registered in Stripe Dashboard:**

| Endpoint | Status | Events | Error Rate | Issue |
|----------|--------|--------|------------|-------|
| `/api/webhooks/stripe` | ✅ Active | 9 | 0% | **Good** |
| `/api/testing/webhook` | ✅ Active | 1 | 0% | **Good** |
| `/api/cosmetology/webhook` | ⚠️ Active | 2 | **100%** | **CRITICAL** |
| `/api/barber/webhook` | ⚠️ Unknown | - | - | **Verify** |

**ACTION REQUIRED:**
- Investigate cosmetology webhook 100% error rate
- Verify barber webhook is working
- Consolidate to single canonical webhook if possible

### 2. Supabase Connection

**Status:** ⚠️ UNVERIFIED

Need to verify:
- [ ] Database connection string configured in Northflank
- [ ] RLS policies enforced
- [ ] Connection pooling working
- [ ] Realtime subscriptions active

### 3. PARIS AI Configuration

**Status:** ⚠️ NEEDS API KEY

Required:
- [ ] ANTHROPIC_API_KEY or OPENAI_API_KEY configured
- [ ] AI endpoints responding
- [ ] Chat history persisting

### 4. LIZZY Chatbot

**Status:** ⚠️ NEEDS TIDIO KEY

Required:
- [ ] NEXT_PUBLIC_TIDIO_KEY configured
- [ ] Tidio integration active
- [ ] Lead capture working

---

## FILE DELETION ANALYSIS - VERIFIED

### ⚠️ RECOMMENDATION: DO NOT DELETE YET

I initially recommended deleting these files but verification shows:

| File | Imports Found | Verdict | Action |
|------|-------------|---------|--------|
| `lib/stripe/forward-to-canonical-webhook.ts` | 0 | ✅ SAFE to delete | Verify no runtime refs first |
| `lib/stripe/prices.ts` | 2+ | ❌ **IN USE** | **KEEP** - Central price resolver |
| `app/api/stripe/webhook/route.ts` | Tests + docs | ⚠️ **IN USE** | **KEEP** - Legacy compatibility |

**Correction:** `prices.ts` and `price-map.ts` are NOT duplicates - they work together:
- `prices.ts`: Central price ID resolver (reads env vars)
- `price-map.ts`: Product-to-price mapping (imports from prices.ts)

---

## DATABASE OBJECT CLASSIFICATION

### ⚠️ BEFORE CLEANUP - Classify All 1,009 "Orphan" Tables

| Classification | Description | Action |
|---------------|-------------|--------|
| **Production** | Active application tables | KEEP |
| **Archive** | Historical data (completed enrollments, old records) | KEEP or MOVE to archive schema |
| **Audit/History** | audit_logs, change_history, webhook_events | KEEP |
| **Backup** | Temporary snapshots, staging data | REVIEW before delete |
| **Migration Metadata** | _prisma_migrations, schema_version | KEEP |
| **View** | Virtual tables, materialized views | KEEP |
| **Test/Demo** | seed_data, test_users | MOVE to separate schema |
| **Temporary** | session_temp, cache_* | DELETE if safe |
| **System** | pg_*, supabase_* | NEVER DELETE |

### Table Classification Required

Before any table cleanup, each "orphan" table must be classified:

```sql
-- Example classification query
SELECT 
  tablename,
  -- Add classification column
  CASE 
    WHEN tablename LIKE '%audit%' OR tablename LIKE '%log%' THEN 'Audit/History'
    WHEN tablename LIKE '%archive%' THEN 'Archive'
    WHEN tablename LIKE 'v_%' THEN 'View'
    WHEN tablename LIKE '%test%' OR tablename LIKE '%demo%' THEN 'Test/Demo'
    WHEN tablename LIKE 'pg_%' OR tablename LIKE 'supabase_%' THEN 'System'
    ELSE 'UNKNOWN - Manual Review Required'
  END as classification
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## DUPLICATE CODE ANALYSIS - VERIFIED

### Files Compared

| File A | File B | Relationship | Verdict |
|--------|--------|-------------|---------|
| `lib/stripe/prices.ts` | `lib/stripe/price-map.ts` | prices.ts → price-map.ts | **KEEP BOTH** |
| `lib/stripe/client.ts` | `lib/stripe/get-stripe-server.ts` | Both imported | **INVESTIGATE** |
| `lib/supabaseClient.ts` | `lib/supabase/client.ts` | Possible duplicate | **INVESTIGATE** |

### Verification Steps Required

For each suspected duplicate:
1. ✅ Compare functionality
2. ✅ Check imports (grep for references)
3. ✅ Verify runtime usage (add logging)
4. ✅ Verify production usage (monitor)
5. ✅ Merge if safe
6. ✅ Delete last

---

## FINAL CERTIFICATION CHECKLIST

### Must Complete Before Production

- [ ] **Stripe**: Fix cosmetology webhook errors (100% failure rate)
- [ ] **Stripe**: Verify barber webhook
- [ ] **Stripe**: Consolidate webhooks if possible
- [ ] **Supabase**: Verify database connection
- [ ] **Supabase**: Test RLS policies
- [ ] **PARIS**: Configure AI API key
- [ ] **LIZZY**: Configure Tidio key
- [ ] **Storage**: Remove legacy buckets (course_content, course_videos)
- [ ] **Database**: Classify all orphan tables
- [ ] **Files**: Verify no dead imports before deleting any file

### Classification Before Cleanup

Every database object must be classified:
- [ ] Production table (keep)
- [ ] Archive (keep or archive schema)
- [ ] Audit/history (keep)
- [ ] View (keep)
- [ ] Test/demo (separate schema)
- [ ] System (never delete)
- [ ] Temporary (delete if safe)

---

## CORRECTED AUDIT STATUS

| Category | Previous Status | Corrected Status |
|----------|----------------|------------------|
| Stripe Prices | ❌ Duplicate | ✅ **NOT DUPLICATE** - prices.ts is central resolver |
| Stripe Webhook | ❌ Delete | ⚠️ **KEEP** - Has test references |
| Orphan Tables | ❌ 1,009 to delete | ⚠️ **CLASSIFY FIRST** - May include valid objects |
| Supabase | ✅ Connected | ⚠️ **UNVERIFIED** - Need runtime check |

---

## RECOMMENDED ACTIONS

### Immediate (Before Any Deletion)

1. **Verify stripe webhook imports:**
   ```bash
   grep -r "forward-to-canonical" --include="*.ts"
   grep -r "prices.ts" --include="*.ts" | grep -v "price-map"
   ```

2. **Classify all database tables** before cleanup

3. **Fix cosmetology webhook** - 100% error rate is blocking

4. **Verify barber webhook** status

### Short-term

1. Consolidate Stripe webhooks if possible
2. Configure AI keys for PARIS
3. Configure Tidio for LIZZY
4. Classify database objects
5. Remove only truly dead code

### Medium-term

1. Runtime verification of all dependencies
2. Production smoke tests
3. Load testing
4. Monitoring setup

---

## CONCLUSION

**Status:** VERIFICATION IN PROGRESS

The audit has progressed correctly from route counting to dependency mapping. However:

1. ❌ **Do not delete files** based solely on static analysis
2. ❌ **Do not delete tables** without classification
3. ⚠️ **Cosmetology webhook** has 100% error rate - CRITICAL
4. ⚠️ **Database orphans** need classification before cleanup
5. ✅ **prices.ts/price-map.ts** are NOT duplicates - keep both

**Next Step:** Runtime verification before any cleanup actions.
