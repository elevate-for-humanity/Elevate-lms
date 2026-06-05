# Northflank + Durable DNS (no apex ALIAS)

Durable **cannot** CNAME-flatten apex to Northflank. An apex **A** record to the Northflank IP serves the wrong TLS cert (`*.northflank.app`) and mobile browsers block the site.

**Working pattern:** `www` on Northflank (CNAME + Let's Encrypt) + **apex URL redirect** to `www` in Durable.

## Durable DNS records

Run `pnpm tsx scripts/northflank/print-cname-targets.ts` for current Northflank targets.

### 1. Apex — `elevateforhumanity.org` (redirect only)

**Do not** point apex at Northflank (no A → `34.145.171.7`, no ALIAS to `*.northflank.app`).

In Durable / SystemDNS, add a **URL redirect** (301/302) or **domain forward**:

| Setting | Value |
|---------|--------|
| Host | `@` (apex) |
| Type | URL Redirect / Web Forward / HTTP Redirect (name varies) |
| Target | `https://www.elevateforhumanity.org` |
| Include path | Yes (so `/programs/foo` → `https://www.elevateforhumanity.org/programs/foo`) |

If Durable only offers “forward to URL” without HTTPS on their edge, use their HTTPS forward option when available.

### 2. WWW — `www.elevateforhumanity.org` (app traffic)

| Type | Host | Value |
|------|------|--------|
| CNAME | `www` | `www.elevateforhumanity.org.elev-5vfk.dns.northflank.app` |

**Typo check:** use `5vfk` not `5kfv`, and the **`www.`** hostname (not the apex `elevateforhumanity.org.elev-…` target).

Remove any **A** record on `www`.

### 3. Admin — `admin.elevateforhumanity.org`

| Type | Host | Value |
|------|------|--------|
| CNAME | `admin` | `admin.elevateforhumanity.org.elev-5vfk.dns.northflank.app` |

## App behavior (after deploy)

- Canonical host: **`www.elevateforhumanity.org`**
- `proxy.ts` and `next.config.mjs` **308** apex → www (backup if traffic reaches Northflank)

Set Northflank runtime env:

```bash
NEXT_PUBLIC_SITE_URL=https://www.elevateforhumanity.org
NEXT_PUBLIC_CANONICAL_DOMAIN=www.elevateforhumanity.org
```

## Verify

```bash
dig +short www.elevateforhumanity.org @8.8.8.8
curl -sSI https://www.elevateforhumanity.org/ | head -5
curl -sSI https://elevateforhumanity.org/ | head -5   # should 301/308 to www
```

Expect **valid TLS** on `www` and a **redirect** on apex (from Durable and/or the app).

## Northflank

LMS direct URL (smoke test): `https://site--elevate-lms--pknyktykz4wg.code.run/`

Attach domains: `pnpm tsx scripts/northflank/configure-domains.ts --execute`
