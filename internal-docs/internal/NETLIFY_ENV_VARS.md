# Netlify Environment Variables

Set these in: **Netlify Dashboard → Site settings → Environment variables**

## Required (App will not work without these)

| Variable | Description | Example Format |
|----------|-------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | `eyJhbGci...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres` |
| `NEXTAUTH_SECRET` | Random 32+ char secret for sessions | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | **Canonical domain** | `https://www.elevateforhumanity.org` |
| `SESSION_SECRET` | Random secret for sessions | Generate: `openssl rand -base64 32` |

## Domain (CRITICAL - Must match canonical)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://www.elevateforhumanity.org` |
| `NEXTAUTH_URL` | `https://www.elevateforhumanity.org` |
| `NODE_ENV` | `production` |

## Payments - Stripe

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_live_...) |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (whsec_...) |

## Payments - Affirm

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_AFFIRM_PUBLIC_KEY` | Affirm public API key |
| `AFFIRM_PRIVATE_API_KEY` | Affirm private API key |

## Email - Resend

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key (re_...) |
| `EMAIL_FROM` | `Elevate for Humanity <noreply@elevateforhumanity.org>` |
| `REPLY_TO_EMAIL` | `info@elevateforhumanity.org` |
| `MOU_ARCHIVE_EMAIL` | `agreements@elevateforhumanity.org` |
| `SPONSOR_FINANCE_EMAIL` | `accounting@elevateforhumanity.org` |

## OAuth - GitHub

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub personal access token |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `GITHUB_OAUTH_ENABLED` | `true` |
| `NEXT_PUBLIC_GITHUB_ENABLED` | `true` |

## OAuth - LinkedIn

| Variable | Description |
|----------|-------------|
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth app client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth app client secret |

## AI - OpenAI

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (sk-proj-...) |

## Cache - Upstash Redis

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

## Analytics

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics measurement ID (G-...) |

## Security & Webhooks

| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Secret for cron job authentication |
| `PARTNER_WEBHOOK_SECRET` | Secret for partner webhook verification |

## Program Configuration

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_RAPIDS_PROGRAM_NUMBER` | RAPIDS program number |
| `NEXT_PUBLIC_RAPIDS_SPONSOR_NAME` | RAPIDS sponsor name |
| `NEXT_PUBLIC_RTI_PROVIDER_ID` | RTI provider ID |
| `IRS_EFIN` | IRS EFIN number |

## Social Media

| Variable | Description |
|----------|-------------|
| `SOCIAL_MEDIA_DEV_MODE` | `false` for production |
| `SOCIAL_MEDIA_AUTO_POST_BLOG` | `true` to auto-post blog content |
| `SOCIAL_MEDIA_TIMEZONE` | `America/New_York` |

## Government APIs

| Variable | Description |
|----------|-------------|
| `SAM_API_KEY` | SAM.gov API key |

---

## Credentials to Rotate (URGENT)

After exposing credentials, rotate these immediately:

1. **Stripe** - Dashboard → Developers → API keys → Roll keys
2. **Supabase** - Dashboard → Settings → API → Generate new service role key
3. **NextAuth/Session** - Generate new: `openssl rand -base64 32`
4. **GitHub** - Settings → Developer settings → Personal access tokens → Revoke & regenerate
5. **GitHub OAuth** - Settings → Developer settings → OAuth Apps → Generate new secret
6. **OpenAI** - Platform → API keys → Create new key, delete old
7. **Resend** - Dashboard → API Keys → Create new, revoke old
8. **Affirm** - Dashboard → API credentials → Regenerate
9. **Upstash** - Console → Database → Reset token
10. **LinkedIn OAuth** - Developer Portal → App → Auth → Generate new secret

---

## OAuth Callback URLs to Update

After changing to canonical domain, update callback URLs in:

### GitHub OAuth App
```
Homepage URL: https://www.elevateforhumanity.org
Callback URL: https://www.elevateforhumanity.org/api/auth/callback/github
```

### LinkedIn OAuth App
```
Redirect URL: https://www.elevateforhumanity.org/api/auth/callback/linkedin
```

### Stripe Webhook
```
Endpoint URL: https://www.elevateforhumanity.org/api/webhooks/stripe
```

### Supabase Auth
In Supabase Dashboard → Authentication → URL Configuration:
```
Site URL: https://www.elevateforhumanity.org
Redirect URLs: https://www.elevateforhumanity.org/**
```
