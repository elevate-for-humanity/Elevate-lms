# DNS Configuration Guide

## Architecture Overview

```
User Request
     |
     v
DNS Provider (Durable.io)
     |
     v
Northflank Load Balancer (istio-envoy)
     |
     +---> www.elevateforhumanity.org    ---> elevate-marketing container
     +---> app.elevateforhumanity.org   ---> elevate-lms container
     +---> admin.elevateforhumanity.org ---> elevate-admin container
```

## Required DNS Records

Configure these CNAME records in **Durable.io** (or your DNS provider):

| Service     | Type | Name                      | Value                                              | TTL |
|-------------|------|---------------------------|----------------------------------------------------|-----|
| Marketing   | CNAME| www.elevateforhumanity.org | www.elevateforhumanity.org.elev-5vfk.dns.northflank.app | 300 |
| LMS         | CNAME| app.elevateforhumanity.org | app.elevateforhumanity.org.elev-5vfk.dns.northflank.app | 300 |
| Admin       | CNAME| admin.elevateforhumanity.org| admin.elevateforhumanity.org.elev-5vfk.dns.northflank.app| 300 |

## Northflank Service Configuration

In the **Northflank dashboard**, each service must have the custom domain attached:

### 1. elevate-marketing
- Go to: Services -> elevate-marketing -> Ports/Domains
- Add custom domain: `www.elevateforhumanity.org`

### 2. elevate-lms
- Go to: Services -> elevate-lms -> Ports/Domains
- Add custom domain: `app.elevateforhumanity.org`

### 3. elevate-admin
- Go to: Services -> elevate-admin -> Ports/Domains
- Add custom domain: `admin.elevateforhumanity.org`

## Verification

Run the DNS configuration script:
```bash
npx tsx scripts/northflank/configure-dns.ts
```

Test each domain:
```bash
curl -sI https://www.elevateforhumanity.org/
curl -sI https://app.elevateforhumanity.org/
curl -sI https://admin.elevateforhumanity.org/
```

All should return HTTP 307 (redirect) or 200 (success).

## Troubleshooting

### Domain not resolving
- Check DNS provider (Durable.io) for correct CNAME records
- Wait for DNS propagation (up to 48 hours, but usually 5-30 minutes)

### 502 Bad Gateway
- Check Northflank service is running
- Verify custom domain is attached to the correct service
- Check service logs in Northflank dashboard

### Redirect loop
- Verify `NEXT_PUBLIC_APP_URL` is set in the Dockerfile
- Check middleware.ts for correct host configuration
