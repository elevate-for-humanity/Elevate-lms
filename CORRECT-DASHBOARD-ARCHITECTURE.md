# CORRECT DASHBOARD ARCHITECTURE

**Generated:** July 7, 2026

---

## THE THREE USER TYPES

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                               THREE SEPARATE DASHBOARDS                                   ║
╠════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                          ║
║   1. EMPLOYER                    2. PARTNER (HOST SHOP)              3. LMS/STUDENT     ║
║   ──────────────────             ────────────────────────              ──────────────────  ║
║   Companies that hire           Beauty shops (barbers,               Learners enrolled    ║
║   and sponsor apprentices       salons, spas) that host               in programs         ║
║                                 apprentices                                                ║
║                                                                                          ║
║   /employer/dashboard           /partner/dashboard                    /lms/dashboard      ║
║   ✅ 430 lines                   ✅ 115 lines (router)               ✅ 132 lines        ║
║                                                                                          ║
║   • Post jobs                   • Manage apprentices                 • View courses      ║
║   • Browse candidates           • Track RTI hours                    • Track progress    ║
║   • Manage applications         • Sign OJL competencies              • View grades      ║
║   • Start apprenticeship        • Schedule apprentices                • Get credentials   ║
║                                                                                          ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## CURRENT STATE vs EXPECTED

### EMPLOYER ✅
```
EXPECTED: /employer/dashboard
ACTUAL:   /employer/dashboard
STATUS:   ✅ WORKING (430 lines)
```

### PARTNER (HOST SHOP) ✅
```
EXPECTED: /partner/dashboard
ACTUAL:   /partner/dashboard
STATUS:   ✅ WORKING (115 lines - routes to sub-pages)
```

### LMS/STUDENT ✅
```
EXPECTED: /lms/dashboard (and /learner/dashboard redirects here)
ACTUAL:   /lms/dashboard
STATUS:   ✅ WORKING (132 lines)
```

---

## HOST SHOP TYPES (Special Case)

These are SPECIALIZATIONS of Partner, they should use `/partner/dashboard`:

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                          HOST SHOP TYPE PORTALS                                          ║
╠════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                          ║
║  /host-shop/dashboard               → Barber Host Shops                        🔴 STUB   ║
║  /barber-host-shop/dashboard         → Barber Host Shops (alias)                ❌ MISSING ║
║  /cosmetology-host-shop/dashboard    → Cosmetology Host Shops                   ✅ EXISTS  ║
║  /esthetician-host-shop/dashboard    → Esthetician Host Shops                   ❌ MISSING ║
║  /nail-host-shop/dashboard           → Nail Tech Host Shops                     ❌ MISSING ║
║                                                                                          ║
║  ALL SHOULD ROUTE TO: /partner/dashboard                                              ║
║                                                                                          ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝
```

### What's Inside `/host-shop/dashboard/`

| Sub-page | Lines | Status |
|----------|-------|--------|
| apprentices | 295 | ✅ |
| competencies | 304 | ✅ |
| hours | 215 | ✅ |
| schedule | 217 | ✅ |
| documents | 178 | ✅ |
| profile | 297 | ✅ |
| reports | 204 | ✅ |
| messages | 198 | ✅ |
| store | 203 | ✅ |
| subscription | 25 | ⚠️ STUB |
| apprentices/new | 25 | ⚠️ STUB |

**Total: 2,186 lines across 11 sub-pages**

---

## THE REAL ISSUE

### 1. `/host-shop/dashboard/page.tsx` is a STUB
```tsx
// Current (STUB)
export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Link href="/">Back to Home</Link>  ← NO CONTENT!
    </div>
  );
}
```

### 2. Other host shop types MISSING dashboards
- `/barber-host-shop/dashboard` → MISSING
- `/esthetician-host-shop/dashboard` → MISSING
- `/nail-host-shop/dashboard` → MISSING

---

## THE FIX

### Option A: Redirect all host shop types to `/partner/dashboard`
```
/host-shop/dashboard          → redirect to /partner/dashboard
/barber-host-shop/dashboard   → redirect to /partner/dashboard
/cosmetology-host-shop/dashboard → already has dashboard, keep or redirect
/esthetician-host-shop/dashboard → redirect to /partner/dashboard
/nail-host-shop/dashboard     → redirect to /partner/dashboard
```

### Option B: Fix `/host-shop/dashboard/page.tsx` to show real dashboard
Replace the stub with a real dashboard that shows:
- Apprentices list
- Hours tracking
- Competencies
- Schedule
- Reports
- etc.

---

## DASHBOARD SUMMARY

| Dashboard | Route | Lines | Status | Type |
|-----------|-------|-------|--------|------|
| **Employer** | `/employer/dashboard` | 430 | ✅ | Self-contained |
| **Partner** | `/partner/dashboard` | 115 | ✅ | Router |
| **LMS** | `/lms/dashboard` | 132 | ✅ | Self-contained |
| **Learner** | `/learner/dashboard` | 10 | ✅ | Redirects to /lms |
| **Case Manager** | `/case-manager/dashboard` | 322 | ✅ | Self-contained |
| **Host Shop** | `/host-shop/dashboard` | 25 | 🔴 | STUB - needs fix |
| **Program Holder** | `/program-holder/dashboard` | 25 | 🔴 | STUB - needs fix |

---

## ACTUAL WORK NEEDED

### 1. Host Shop Dashboard
- **Current:** 25 line stub
- **Sub-pages:** 2,186 lines across 11 pages
- **Fix:** Either redirect to `/partner/dashboard` OR implement the dashboard shell

### 2. Program Holder Dashboard
- **Current:** 25 line stub
- **Expected:** Similar to Partner/Employer
- **Fix:** Implement or redirect

### 3. Other Host Shop Types
- **barber-host-shop:** No dashboard
- **esthetician-host-shop:** No dashboard
- **nail-host-shop:** No dashboard
- **Fix:** Redirect all to `/partner/dashboard`

---

## CONCLUSION

**Three separate dashboards exist:**
1. Employer ✅
2. Partner (Host Shop) ✅
3. LMS/Student ✅

**Issues:**
1. `/host-shop/dashboard` is a stub - needs either fix or redirect
2. Program holder is a stub - needs implementation or clarification
3. Some host shop types missing dashboards - should redirect to partner

---

**Report Version:** 1.0
