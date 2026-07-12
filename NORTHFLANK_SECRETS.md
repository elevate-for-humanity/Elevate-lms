# Northflank Secrets Configuration Guide

## Required Secrets for Elevate LMS Build

The build is failing due to missing environment variables. These must be configured in Northflank.

### Required Secrets

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anon key (runtime fallback) | Same as NEXT_PUBLIC_SUPABASE_ANON_KEY |

### How to Configure in Northflank

1. Go to your Northflank dashboard
2. Select the `elevate-lms-build` service
3. Navigate to **Environment** → **Secrets**
4. Add each secret:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

### Optional But Recommended

| Secret Name | Description |
|-------------|-------------|
| `ONET_API_KEY` | O*NET API key for career data |
| `STRIPE_SECRET_KEY` | Stripe payment processing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `RESEND_API_KEY` | Email sending via Resend |
| `SENDGRID_API_KEY` | Email sending via SendGrid |
| `ANTHROPIC_API_KEY` | Claude AI integration |
| `OPENAI_API_KEY` | OpenAI API key |
| `ADZUNA_API_KEY` | Job search API |

### Troubleshooting

#### Error: "Missing NEXT_PUBLIC_SUPABASE_URL"
**Cause:** Supabase URL not configured
**Fix:** Add `NEXT_PUBLIC_SUPABASE_URL` secret in Northflank

#### Error: "SUPABASE_SERVICE_ROLE_KEY is not set"
**Cause:** Service role key not configured
**Fix:** Add `SUPABASE_SERVICE_ROLE_KEY` secret in Northflank

#### Error: "requireRole is not defined"
**Cause:** This is a build caching issue. Rebuild after setting secrets.

#### Error: "useRouter is not defined"
**Cause:** Build caching issue. Rebuild after setting secrets.
