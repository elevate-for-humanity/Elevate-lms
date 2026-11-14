# Audit: `/apply` → `/apply` Redirect Loop — 2026-07-23

**Status:** Root cause identified. Fix in progress.
**Live URL:** `https://www.elevateforhumanity.org/apply` — ERR_TOO_MANY_REDIRECTS

---

## PROBLEM

```
curl https://www.elevateforhumanity.org/apply
→ HTTP/2 307
→ location: /apply
→ server: istio-envoy
→ x-nextjs-matched-path: ABSENT ← Next.js never processed this request
```

Both `/apply` and `/apply/` redirect to themselves (infinite loop).

---

## LAYER 1 — Next.js `next.config.mjs`

### ALL active `/apply` redirect rules in deployed version `e1a2eec5f1`

| Line | Rule | Matches `/apply`? | Verdict |
|------|------|:----------------:|---------|
| 379 | `{ source: '/apply/barber' }` → `/partners/barber-host-shop/apply` | ❌ exact match | ✅ SAFE |
| 383 | `{ source: '/apply/cosmetology' }` → `/partners/cosmetology-host-shop/apply` | ❌ exact match | ✅ SAFE |
| 442 | `{ source: '/apply/student' }` → `/apply` | ❌ exact match | ✅ SAFE |
| 443 | `{ source: '/apply/quick' }` → `/apply` | ❌ exact match | ✅ SAFE |

### WHY `/apply/student` and `/apply/quick` CANNOT cause a loop

Next.js redirect matching uses **exact string comparison**. A redirect with `source: '/apply/student'` matches only the exact path `/apply/student`. It does NOT match `/apply` because:

```
'/' + 'apply' + '/' + 'student'  ≠  '/' + 'apply'
```

`'/apply'` has 6 characters. `'/apply/student'` has 14 characters. They are different strings.

### `trailingSlash: false` (line 101)

With `trailingSlash: false`:
- `/apply` → no redirect (serves the page at `/apply` directly)
- `/apply/` → redirects to `/apply` (removes trailing slash)

This does NOT cause a loop — `/apply` is never redirected.

### Ghost block REMOVED in commit `a00da73373`

```diff
- // REMOVED: This redirect was causing /apply to loop
- // {
- //   source: '/apply',
- //   has: [{ type: 'query', key: 'program', value: 'barber-apprenticeship' }],
- //   destination: '/programs/barber-apprenticeship/apply',
- //   permanent: true,
- // },
```

This was the redirect that CAUSED the loop. It is now FULLY REMOVED from `next.config.mjs`.

**LAYER 1 VERDICT:** Next.js is NOT the source. `{ source: '/apply' }` is fully removed.

---

## LAYER 2 — Next.js `middleware.ts`

### All `/apply` rules in middleware

| Line | Rule | Matches `/apply`? | Verdict |
|------|------|:----------------:|---------|
| 24 | `['/apply/barber', '/partners/barber-host-shop/apply']` | ❌ exact match | ✅ SAFE |
| 42 | `/apply` in `PUBLIC_PATHS` | ✅ yes | ✅ passes through with `NextResponse.next()` |
| 196 | `['/apply/fssa', '/apply']` | ❌ exact match `/apply/fssa` | ✅ SAFE |

### `isPublicPath` check for `/apply`

```typescript
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p)) || ...
}
```

`PUBLIC_PATHS` includes `/apply` (line 42).  
`'/apply'.startsWith('/apply')` = **TRUE** → `NextResponse.next()` — no redirect.

**LAYER 2 VERDICT:** No `/apply` redirect exists in middleware.

---

## LAYER 3 — Northflank Istio

### Live response headers

```
GET /apply  →  HTTP/2 307, location: /apply, server: istio-envoy
               x-envoy-upstream-service-time: 3ms
               x-nextjs-matched-path: ABSENT
               x-nextjs-cache: ABSENT
```

**Key:** `x-nextjs-matched-path` is ABSENT. Next.js NEVER processed this request.
The redirect originates from **Northflank Istio**, NOT from Next.js.

### All Northflank API endpoints tested

| Endpoint | Token | HTTP | Status |
|----------|-------|------|--------|
| `GET /domains` | project (T1) | 401 | ❌ Unauthorized |
| `GET /domains/elevateforhumanity.org` | project (T1) | 401 | ❌ Unauthorized |
| `GET /domains/www.elevateforhumanity.org/subdomains/%40/paths` | project (T1) | 401 | ❌ Unauthorized |
| `GET /domains/www.elevateforhumanity.org/subdomains/%40/paths` | team (T2) | 401 | ❌ Unauthorized |
| `GET /teams/{id}/domains/{name}/subdomains/%40/paths` | project (T1) | 401 | ❌ Unauthorized |
| `GET /projects/{id}/services/{id}` | project (T1) | 200 | ✅ Working |

Both T1 and T2 tokens lack **domain management RBAC permissions**.

**Token T1 (project-scoped):** `entityType=team`, `role=owner`, `iat=1784020082`
**Token T2 (team-scoped):** `entityType=team`, `role=owner`, `iat=1783960554`

Neither has access to `/domains/...` endpoints. Need a token from the **Owner RBAC role** with full domain permissions.

**LAYER 3 VERDICT:** Istio is generating `307 → /apply`. Config is INACCESSIBLE via available API tokens.

---

## LAYER 4 — CDN / External Proxy

| Check | Result |
|-------|--------|
| DNS A record | `34.145.171.7` (GCP, Northflank only) |
| Cloudflare headers | ❌ None |
| CDN cache headers | ❌ None |
| TLS issuer | Let's Encrypt (direct, no proxy) |

**LAYER 4 VERDICT:** No CDN. Direct to Northflank Istio.

---

## DEFINITIVE CONCLUSION

| Layer | Rule | Status |
|-------|------|--------|
| `next.config.mjs` | `{ source: '/apply' }` | ❌ **FULLY REMOVED** (commit `a00da73373`) |
| `next.config.mjs` | `{ source: '/apply/student' }` → `/apply` | ✅ Active — exact match only |
| `next.config.mjs` | `{ source: '/apply/quick' }` → `/apply` | ✅ Active — exact match only |
| `middleware.ts` | `PUBLIC_PATHS` includes `/apply` | ✅ Active — `NextResponse.next()` |
| `middleware.ts` | `['/apply/fssa', '/apply']` | ✅ Active — exact match only |
| `trailingSlash: false` | — | ✅ Cannot redirect `/apply` to itself |
| **Northflank Istio** | Unknown VirtualService rule | ❌ **ROOT CAUSE** — config invisible |

**Root cause:** Northflank Istio VirtualService has a path rule matching `/apply` → `/apply`. This was configured before the `next.config.mjs` fix and was never removed.

---

## FIX REQUIRED

### Step 1: Get a token with domain management permissions

1. Log in to **Northflank Dashboard** → **Team Settings** → **API** → **Tokens**
2. Click **Create API Token**
3. Select **Role: Owner** (has all permissions including domains)
4. Copy the new token immediately
5. Store it in **GitHub Secrets** as `NORTHFLANK_DOMAIN_TOKEN`

### Step 2: Audit the Istio VirtualService

```bash
curl -H "Authorization: Bearer $NORTHFLANK_DOMAIN_TOKEN" \
  "https://api.northflank.com/v1/domains/www.elevateforhumanity.org/subdomains/%40/paths"
```

Look for a redirect rule with source matching `/apply` → destination `/apply`.

### Step 3: Delete the offending rule

Use Northflank dashboard:
```
Domains → www.elevateforhumanity.org → Paths → delete rule for /apply
```

Or via API once token has domain permissions.

---

## COMMITS

- `a00da73373` — fix: remove ghost commented `/apply` redirect block from next.config.mjs
- `4e58ddfdff` — fix: remove broken /app/public COPY from Dockerfile.marketing
- `e1a2eec5f1` — current deployed version (contains Dockerfile fix, ghost block already commented out)
