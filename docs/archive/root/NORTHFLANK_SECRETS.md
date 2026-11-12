# Northflank Secrets Configuration Guide

## Required Secrets for Elevate LMS Build

### Required Secrets (Database)

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anon key (runtime fallback) | Same as NEXT_PUBLIC_SUPABASE_ANON_KEY |

### Optional But Recommended

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `ONET_API_KEY` | O*NET API key for career data | Register at https://onetws.prod.icloud.vginternal.online/ |
| `STRIPE_SECRET_KEY` | Stripe payment processing | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | Stripe Dashboard → Developers → Webhooks |
| `RESEND_API_KEY` | Email sending via Resend | Resend Dashboard → API Keys |
| `SENDGRID_API_KEY` | Email sending via SendGrid | SendGrid Dashboard → API Keys |
| `ANTHROPIC_API_KEY` | Claude AI integration | Anthropic Console → API Keys |
| `OPENAI_API_KEY` | OpenAI API key | OpenAI Dashboard → API Keys |
| `ADZUNA_API_KEY` | Job search API | Adzuna Developer Dashboard |

### How to Configure in Northflank

1. Go to your Northflank dashboard
2. Select the service (elevate-lms-build, elevate-lms-admin, etc.)
3. Navigate to **Environment** → **Secrets**
4. Add each secret key-value pair

### O*NET API Key Setup (IMPORTANT)

Based on your O*NET account, add:

```
ONET_API_KEY=jkkII-vDFMZ-Dd32X-REn8d
```

Get your key at: https://onetws.prod.icloud.vginternal.online/

### Troubleshooting

#### Error: "Missing NEXT_PUBLIC_SUPABASE_URL"
**Cause:** Supabase URL not configured
**Fix:** Add `NEXT_PUBLIC_SUPABASE_URL` secret in Northflank

#### Error: "SUPABASE_SERVICE_ROLE_KEY is not set"
**Cause:** Service role key not configured
**Fix:** Add `SUPABASE_SERVICE_ROLE_KEY` secret in Northflank

#### Error: "ONET_API_KEY not set — skipping fetch"
**Cause:** O*NET key not configured
**Fix:** Add `ONET_API_KEY` secret in Northflank

#### Error: "requireRole is not defined"
**Cause:** Build caching issue
**Fix:** Rebuild after setting secrets

#### Error: "useRouter is not defined"
**Cause:** Build caching issue
**Fix:** Rebuild after setting secrets
