# API Endpoint Audit Report

**Generated:** July 12, 2026

## Summary

| Metric | Count |
|--------|-------|
| Total API Routes (app/api) | 1,071 |
| Total API Routes (apps/*/api) | 476 |
| **Grand Total** | **1,547** |

---

## Routes Missing Authentication

These routes may need authentication guards:

```
⚠️  app/api/create-checkout-session/route.ts
⚠️  app/api/chatbot/lead/route.ts
⚠️  app/api/heygen/status/route.ts
⚠️  app/api/heygen/generate/route.ts
⚠️  app/api/terminal/connect/route.ts
⚠️  app/api/terminal/exec/route.ts
⚠️  app/api/build/route.ts
⚠️  app/api/reporting/funder-metrics/route.ts
⚠️  app/api/reporting/program-metrics/route.ts
⚠️  app/api/reporting/site-metrics/route.ts
⚠️  app/api/reporting/overall-metrics/route.ts
⚠️  app/api/admin/site-health/route.ts
⚠️  app/api/admin/route.ts
```

### Assessment

Many of these are intentional public endpoints (webhooks, health checks, chatbots). The following should be reviewed:

| Route | Risk Level | Recommendation |
|-------|------------|----------------|
| `terminal/connect` | HIGH | Requires auth |
| `terminal/exec` | HIGH | Requires auth |
| `admin/*` | HIGH | Requires admin auth |
| `reporting/*` | MEDIUM | Check if data is public |
| `heygen/*` | MEDIUM | Check if data is public |

---

## Routes Missing Error Handling (Try-Catch)

```
⚠️  app/api/certifications/progress/route.ts
⚠️  app/api/terminal/connect/route.ts
⚠️  app/api/terminal/exec/route.ts
⚠️  app/api/workone/[id]/route.ts
⚠️  app/api/workone/list/route.ts
⚠️  app/api/payroll/export/route.ts
⚠️  app/api/build/route.ts
⚠️  app/api/reporting/dol-dwd/route.ts
⚠️  app/api/demo/seed/route.ts
⚠️  app/api/file/route.ts
⚠️  app/api/public/supabase-config/route.ts
⚠️  app/api/jobs/search/route.ts
⚠️  app/api/admin/site-health/route.ts
⚠️  app/api/admin/ai-provider-status/route.ts
⚠️  app/api/admin/audit-logs/route.ts
⚠️  app/api/admin/integrations/quickbooks/route.ts
⚠️  app/api/auth/login/route.ts
⚠️  app/api/auth/logout/route.ts
```

### Assessment

These routes use wrapper patterns (`withApiAudit`, `withRuntime`) that may handle errors, but should be reviewed for:
1. Consistent error response format
2. Proper HTTP status codes
3. Error logging

---

## Critical Security Routes to Verify

### Admin Routes (Require Admin Auth)
```
⚠️  app/api/admin/site-health/route.ts
⚠️  app/api/admin/route.ts
⚠️  app/api/admin/ai-provider-status/route.ts
⚠️  app/api/admin/audit-logs/route.ts
⚠️  app/api/admin/leads/[...path]/route.ts
```

### Terminal/Exec Routes (HIGH RISK)
```
⚠️  app/api/terminal/connect/route.ts
⚠️  app/api/terminal/exec/route.ts
```

### Reporting Routes
```
⚠️  app/api/reporting/funder-metrics/route.ts
⚠️  app/api/reporting/program-metrics/route.ts
⚠️  app/api/reporting/site-metrics/route.ts
⚠️  app/api/reporting/overall-metrics/route.ts
⚠️  app/api/reporting/dol-dwd/route.ts
```

---

## Webhook Routes (Should be Public)

These are intentionally public for external integrations:

```
✅  app/api/chatbot/calendly-webhook/route.ts
✅  app/api/csp-report/route.ts
✅  app/api/token/validate/route.ts
✅  app/api/stripe/webhook/route.ts
✅  app/api/paypal/webhook/route.ts
```

---

## API Patterns Used

### Standard Pattern
```typescript
export const POST = withApiAudit('/api/path', _POST);
export const GET = withApiAudit('/api/path', _GET);
```

### With Runtime
```typescript
export const POST = withRuntime(withApiAudit('/api/path', _POST));
```

### With Auth
```typescript
export const POST = withApiAudit('/api/path', async (req) => {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  // ...
});
```

---

## Recommendations

1. **High Priority:** Add authentication to terminal/exec routes
2. **High Priority:** Verify admin routes have proper admin-only checks
3. **Medium Priority:** Review reporting routes for data exposure
4. **Low Priority:** Add consistent error handling wrapper

---

## Test Coverage

Consider adding tests for:
- Authentication guards on protected routes
- Error handling on routes without try-catch
- Rate limiting on public endpoints
- Input validation on all POST/PUT/PATCH routes
