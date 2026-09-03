# 503 Console Audit — 2026-08-08

## Scope
Production 503 / `no healthy upstream` behavior across Marketing, LMS, Admin, CDL and application surfaces.

## Confirmed findings

1. `www.elevateforhumanity.org/programs/cdl-training` is reachable when Marketing has a ready pod. The reported 503 is intermittent service availability, not a missing CDL route.
2. Marketing, LMS and Admin `/api/health` handlers are lightweight and return HTTP 200 without external dependency checks. A Northflank 503 therefore means no ready process is available to the proxy, not a Supabase/Stripe readiness failure.
3. All three production Dockerfiles listen on port 3000 and use `/api/ping` for container liveness. The historical health-endpoint mismatch is no longer the primary cause.
4. Canonical Northflank configuration requests one steady instance plus `maxSurge=1,maxUnavailable=0`. Marketing refuses fallback if Northflank rejects explicit custom rollout semantics.
5. LMS and Admin still fall back to `rollout-steady` if custom rollout is rejected. That leaves a remaining path to a temporary zero-ready-instance window and must be removed.
6. A successful Northflank build only proves image compilation. It does not prove the deployed service retained a healthy upstream throughout rollout.
7. Host Shop submission had a separate route-level production defect: API insert columns/status did not match the live `host_shop_applications` table. Fixed in PR #554.
8. Canonical student/program application API has a separate Turnstile contract defect: when `TURNSTILE_SECRET_KEY` is configured, the endpoint requires a token, while current same-origin application clients do not supply one. This can return 403 and be surfaced to users as submission/network failure. Same-origin submissions should rely on allowed-origin + rate limit + honeypot unless a Turnstile widget/token is actually rendered; cross-origin submissions may require Turnstile.

## 503 root-cause classification

- Proxy 503 / `no healthy upstream`: orchestration/runtime availability defect.
- Route 4xx/5xx from application APIs: application contract/schema defect, not Northflank proxy availability.
- CDL 503: Marketing upstream availability; CDL route itself exists and renders when Marketing is healthy.

## Required closure gates

- No service may fall back to rollout semantics that can remove the old ready pod before replacement readiness.
- `/api/ping` and `/api/health` must remain dependency-free.
- Every deployment must verify exact SHA plus representative application routes after rollout.
- Application submission failures must return the actual route error, not be conflated with proxy 503.
