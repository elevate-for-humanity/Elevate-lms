# Tenant Preview Domain Runbook — `*.app.elevateforhumanity.org`

Status: **action required (infrastructure, outside the repo).**

## Symptom

Starting a trial or converting a demo returns a `publicPreviewUrl` such as
`https://verify-trial-path.app.elevateforhumanity.org`, and a `loginUrl` that
redirects back to the workspace. The login link and `/apps/*` dashboards work,
but the public preview link does not load.

## Root cause

There is **no wildcard DNS record** for `*.app.elevateforhumanity.org`.

Verified 2026-11-09 via DNS-over-HTTPS (`cloudflare-dns.com/dns-query`):

| Host | Result |
| --- | --- |
| `app.elevateforhumanity.org` | resolves → `34.110.235.233` |
| `randomxyz987.app.elevateforhumanity.org` | NXDOMAIN (status 3) |
| `<new-tenant>.app.elevateforhumanity.org` | NXDOMAIN |

The application side is already correct:

- `lib/tenant/public-site-url.ts` builds `https://{slug}.app.elevateforhumanity.org`.
- `lib/tenant/middleware-tenant-routing.ts` extracts the slug from that host and
  rewrites to `/tenant-site/...` (or `/admin/...` for explicit admin paths).
- `apps/marketing/middleware.ts` applies that rewrite for recognized tenant hosts.

So the only missing piece is the DNS record and a TLS certificate that covers the
wildcard. This cannot be created from the repository — it needs access to the DNS
zone and the hosting platform.

## Fix

1. **Add the wildcard DNS record** in the `elevateforhumanity.org` zone:

   ```
   Type:  A
   Name:  *.app
   Value: 34.110.235.233
   TTL:   300 (raise after verification)
   ```

   Use the same target the `app` host uses (currently `34.110.235.233`). If the
   platform uses a load balancer hostname, use a `CNAME` to that hostname instead
   of an `A` record.

2. **Issue/attach a TLS certificate covering `*.app.elevateforhumanity.org`**
   on the load balancer / ingress. A certificate for the bare `app.` host does
   **not** cover subdomains of it — the wildcard must be its own SAN.

3. **Route the wildcard host to the marketing app** (the service that serves
   `/tenant-site`). If the ingress matches on host, add `*.app.elevateforhumanity.org`
   to the same backend as `app.elevateforhumanity.org`.

4. **Verify**:

   ```bash
   dig +short verify-trial-path.app.elevateforhumanity.org
   curl -sSI https://verify-trial-path.app.elevateforhumanity.org | head -1
   # expect: HTTP/2 200
   ```

   Then start a fresh trial and confirm the returned `publicPreviewUrl` loads.

## Interim customer-facing behavior

Until the wildcard exists, the success screen and API response should prefer the
working `loginUrl` / `/apps/*` dashboard as the primary "continue" action and
label the preview URL as pending. The API already returns `loginUrl`,
`dashboardUrl` and `builderUrl`, so no customer is blocked — only the preview
link is inert.

## Follow-up

- [ ] Wildcard A/CNAME record created.
- [ ] Wildcard TLS certificate issued and attached.
- [ ] `*.app.elevateforhumanity.org` routed to the marketing backend.
- [ ] Verified with a fresh trial conversion.
