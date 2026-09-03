# DNS Configuration Guide

## Production architecture

```text
User Request
     |
     v
Cloudflare authoritative DNS
     |
     v
Northflank Load Balancer
     |
     +---> www.elevateforhumanity.org    ---> elevate-marketing
     +---> app.elevateforhumanity.org    ---> elevate-lms
     +---> admin.elevateforhumanity.org ---> elevate-admin
```

Cloudflare owns DNS. Northflank owns the application services and custom-domain TLS. Durable, Vercel, and Netlify are not production origins for these hostnames.

## Required Cloudflare DNS records

| Service | Type | Host | Target | Proxy during verification |
|---|---|---|---|---|
| Marketing | CNAME | `www` | `www.elevateforhumanity.org.elev-5vfk.dns.northflank.app` | DNS only |
| LMS | CNAME | `app` | `app.elevateforhumanity.org.elev-5vfk.dns.northflank.app` | DNS only |
| Admin | CNAME | `admin` | `admin.elevateforhumanity.org.elev-5vfk.dns.northflank.app` | DNS only |

Use Cloudflare TTL Auto. Keep the records DNS-only until Northflank reports each custom domain verified and its certificate is provisioned. Cloudflare proxying may be enabled afterward only if it is intentionally part of the production edge design and origin/TLS behavior has been verified.

The apex `elevateforhumanity.org` must permanently redirect to `https://www.elevateforhumanity.org`. Do not attach the apex to LMS or Admin.

## Northflank domain ownership

- `elevate-marketing` owns `www.elevateforhumanity.org`
- `elevate-lms` owns `app.elevateforhumanity.org`
- `elevate-admin` owns `admin.elevateforhumanity.org`

A production hostname must never be attached to more than one service.

## Runtime contract

All three services use the canonical Northflank configuration in `scripts/northflank/configure-services.ts`:

- public HTTP port `site`
- internal port `3000`
- `HOSTNAME=0.0.0.0`
- distinct `SERVICE_ROLE` values for Marketing, LMS, and Admin
- startup `/api/ping`
- readiness `/api/health`
- liveness `/api/ping`
- zero-downtime rollout with `maxUnavailable=0` and `maxSurge=1`

Shared production URLs are synchronized by `scripts/northflank/sync-env.ts`:

- `NEXT_PUBLIC_SITE_URL=https://www.elevateforhumanity.org`
- `NEXT_PUBLIC_APP_URL=https://app.elevateforhumanity.org`
- `NEXT_PUBLIC_LMS_URL=https://app.elevateforhumanity.org`
- `NEXT_PUBLIC_ADMIN_URL=https://admin.elevateforhumanity.org`

## Verification

Run:

```bash
npx tsx scripts/northflank/configure-dns.ts
npx tsx scripts/northflank/configure-domains.ts --dry-run
```

Then test:

```bash
curl -sI https://www.elevateforhumanity.org/
curl -sI https://app.elevateforhumanity.org/
curl -sI https://admin.elevateforhumanity.org/
curl -sI https://elevateforhumanity.org/
```

Expected results are a successful HTTP response or an intentional application redirect. The apex should redirect to `www`.

## Failure interpretation

- DNS resolution failure: verify the Cloudflare CNAME and nameserver/zone ownership.
- Northflank custom-domain verification failure: temporarily keep the record DNS-only and verify the exact CNAME target Northflank provides.
- 502/503 or `no healthy upstream`: DNS may be correct; inspect Northflank pod health, `/api/ping`, `/api/health`, and container port `3000`.
- Redirect loop: compare the request host against `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_LMS_URL`, `NEXT_PUBLIC_ADMIN_URL`, `next.config.mjs`, and middleware host routing.
- TLS error: verify Northflank certificate status before enabling Cloudflare proxying.
