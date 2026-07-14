# Northflank Deployment Configuration

## Overview

This directory contains configuration files and secrets templates for deploying the Elevate LMS platform on Northflank.

## Services

| Service | Dockerfile | Description |
|---------|------------|-------------|
| **LMS** | `Dockerfile.northflank-lms` | Main application with all routes |
| **Admin** | `Dockerfile.northflank-admin` | Admin-only routes |
| **Marketing** | `Dockerfile.marketing` | Public pages only |

## Setup Instructions

### Step 1: Get Required API Keys

1. **Supabase**
   - Go to: https://supabase.com/dashboard
   - Project Settings → API
   - Copy: `Project URL`, `anon public`, `service_role secret`

2. **Stripe** (for payments)
   - Go to: https://dashboard.stripe.com/apikeys
   - Copy: `Secret key` (sk_live_...)
   - Webhooks → Add endpoint → Copy `whsec_...`

3. **SendGrid** (for email)
   - Go to: https://app.sendgrid.com/settings/api_keys
   - Create API key with Mail Send permissions

4. **Anthropic** (for PARiS AI)
   - Go to: https://console.anthropic.com/
   - Copy: API key

### Step 2: Configure Secrets in Northflank

#### Option A: Manual (Dashboard)

1. Login to Northflank
2. Select your project
3. Go to each service → Secrets
4. Add the following secrets:

**LMS Service (all required):**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
SENDGRID_API_KEY=SG...
RESEND_API_KEY=re_...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
ADMIN_API_KEY=<generate-random-key>
ADMIN_EMAIL=elevate4humanityedu@gmail.com
```

**Admin Service (all required):**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG...
RESEND_API_KEY=re_...
NEXT_PUBLIC_ADMIN_URL=https://admin.elevateforhumanity.org
ADMIN_API_KEY=<generate-random-key>
ADMIN_EMAIL=elevate4humanityedu@gmail.com
```

**Marketing Service (same keys as LMS):**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG...
RESEND_API_KEY=re_...
NEXT_PUBLIC_SITE_URL=https://www.elevateforhumanity.org
NEXT_PUBLIC_ADMIN_URL=https://admin.elevateforhumanity.org
```

#### Option B: Import from JSON

Use the secrets template files:
- `northflank/lms-secrets.json`
- `northflank/admin-secrets.json`
- `northflank/marketing-secrets.json`

### Step 3: Run Database Migrations

1. Go to Supabase Dashboard → SQL Editor
2. Run: `supabase/migrations/pending/20260713000001_critical_tables.sql`

### Step 4: Trigger Builds

1. Push to main branch OR
2. Manually trigger build in Northflank dashboard

### Step 5: Verify Deployment

```bash
# Check LMS health
curl https://work-1-xxx.prod-runtime.all-hands.dev/api/health

# Check Admin health
curl https://work-2-xxx.prod-runtime.all-hands.dev/api/health
```

## Files

| File | Purpose |
|------|---------|
| `lms-secrets.json` | Template for LMS service secrets |
| `admin-secrets.json` | Template for Admin service secrets |
| `marketing-secrets.json` | Template for Marketing service secrets |
| `northflank_config.json` | Original config for combined service |
| `northflank_config_v2.json` | Config for LMS service |
| `northflank_admin.json` | Config for Admin service |
| `northflank_marketing.json` | Config for Marketing service |

## Troubleshooting

### Build fails with missing env vars
- Ensure secrets are set BEFORE triggering build
- Build args must be set in service configuration

### Health check failing
- Check logs in Northflank dashboard
- Verify secrets are correctly set
- Check Supabase connection

### Database errors
- Run pending migrations
- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Check RLS policies
