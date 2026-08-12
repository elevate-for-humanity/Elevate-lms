# Worker Scripts

This directory contains support scripts for infrastructure and service integrations.

## Cloudflare

`get-cloudflare-credentials.sh` is used for optional Cloudflare service credentials such as R2 and Stream.

Cloudflare is also the authoritative DNS provider for `elevateforhumanity.org`. Production application traffic is routed from Cloudflare DNS to Northflank; the application is not deployed to Cloudflare Workers, Durable, Vercel, or Netlify.

Canonical production host ownership:

- `www.elevateforhumanity.org` -> Northflank `elevate-marketing`
- `app.elevateforhumanity.org` -> Northflank `elevate-lms`
- `admin.elevateforhumanity.org` -> Northflank `elevate-admin`
- `elevateforhumanity.org` -> permanent redirect to `https://www.elevateforhumanity.org`

Do not add cleanup/removal scripts that detach these production hostnames from Cloudflare without an explicit infrastructure migration plan.

## Supabase

`get-supabase-credentials.sh` provides interactive local setup for Supabase credentials.

## Production deployment

Production application services deploy to Northflank. Canonical infrastructure configuration is maintained in:

- `scripts/northflank/configure-services.ts`
- `scripts/northflank/configure-domains.ts`
- `scripts/northflank/configure-dns.ts`
- `scripts/northflank/sync-env.ts`

Use the repository's GitHub Actions/Northflank deployment path. Do not deploy this platform to Netlify or Vercel.

## Security

- Never commit `.env.local`, API tokens, service-role keys, or production secrets.
- Use the Northflank production secret group for runtime secrets.
- Cloudflare DNS tokens should use least privilege; DNS automation needs only the zone permissions required for the intended operation.
- R2/Stream credentials should be scoped separately from DNS credentials where possible.
