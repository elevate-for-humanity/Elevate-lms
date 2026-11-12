# 🚀 Elevate for Humanity - Production Setup Guide

This guide walks you through setting up Elevate LMS for production deployment.

---

## 1. Environment Variables

Copy the template and fill in all values:

```bash
cp .env.production.example .env.production
```

### Required Variables

| Variable | Where to Get | Purpose |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | Admin database access |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys | Payment processing |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys | Client-side payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks | Payment notifications |
| `ANTHROPIC_API_KEY` | Anthropic Console → API Keys | PARIS AI commands |
| `RESEND_API_KEY` | Resend.com → API Keys | Email delivery |
| `PEXELS_API_KEY` | Pexels.com → API | Stock photo search |

### Northflank Setup

In Northflank, create a secret group called `elevate-production-env` with:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `NEXT_PUBLIC_SITE_URL=https://www.elevateforhumanity.org`
5. All other `NEXT_PUBLIC_*` variables

---

## 2. Database Setup

### Run Migrations

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-key

# Run migrations
npx tsx scripts/migrate/run-migrations.ts
```

### Verify Tables Created

1. Go to Supabase Dashboard → Table Editor
2. Verify these tables exist:
   - `ai_agents`
   - `agent_activities`
   - `agent_memories`
   - `media_items`
   - `media_collections`
   - `brand_assets`

---

## 3. Stripe Configuration

### Create Products

1. Go to Stripe Dashboard → Products
2. Create products for:
   - Starter License
   - Pro License
   - Enterprise License
   - Testing Center
   - Dev Studio
   - Workflow Studio
   - BNPL Payment Plans

### Get Price IDs

1. Copy each product's Price ID
2. Add to environment:
   ```
   STRIPE_PRICE_STARTER_LICENSE=price_xxx
   STRIPE_PRICE_PRO_LICENSE=price_xxx
   STRIPE_PRICE_ENTERPRISE_LICENSE=price_xxx
   ```

### Setup Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://www.elevateforhumanity.org/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.paid`
   - `invoice.payment_failed`

---

## 4. AI Setup

### Claude (Anthropic)

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create API Key
3. Add to environment:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
   ```

### Pexels (Stock Photos)

1. Go to [Pexels API](https://www.pexels.com/api/)
2. Get your API key
3. Add to environment:
   ```
   PEXELS_API_KEY=...
   ```

---

## 5. Email Setup

### Option A: Resend (Recommended)

1. Go to [Resend.com](https://resend.com/)
2. Add domain `elevateforhumanity.org`
3. Create API key
4. Verify DNS records
5. Add to environment:
   ```
   RESEND_API_KEY=re_...
   ```

### Option B: SendGrid

1. Go to [SendGrid](https://sendgrid.com/)
2. Add domain / verify sender
3. Create API key
4. Add to environment:
   ```
   SENDGRID_API_KEY=SG....
   ```

---

## 6. Northflank Deployment

### Services Required

1. **elevate-lms** - Main marketing website
2. **elevate-admin** - Admin dashboard
3. **elevate-lms-db** - Supabase (external)

### Build Settings

```dockerfile
# Dockerfile.northflank-lms
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
CMD ["pnpm", "start"]
```

### Environment Groups

Create these secret groups in Northflank:

1. **elevate-production-env** - Required at build time
2. **platform_secrets** - Stripe, email, AI keys
3. **app_secrets** - Application-specific secrets

---

## 7. Verify Deployment

### Health Checks

```bash
# Main site
curl https://www.elevateforhumanity.org/health

# Admin
curl https://admin.elevateforhumanity.org/health

# API
curl https://api.elevateforhumanity.org/health
```

### Test Endpoints

```bash
# Test Stripe webhook
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test AI
curl -X POST https://api.elevateforhumanity.org/api/paris/commands \
  -H "Content-Type: application/json" \
  -d '{"command": "Hire a recruiter agent"}'

# Test media search
curl "https://api.elevateforhumanity.org/api/paris/media?query=students"
```

---

## 8. Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations run successfully
- [ ] Stripe products and webhooks configured
- [ ] Email domain verified (Resend/SendGrid)
- [ ] AI API keys working
- [ ] Pexels API connected
- [ ] Northflank build successful
- [ ] Health checks passing
- [ ] SSL certificates active
- [ ] CDN configured
- [ ] Monitoring set up

---

## Troubleshooting

### Database Connection Failed

```
Error: Could not connect to Supabase
```

Check:
- `NEXT_PUBLIC_SUPABASE_URL` is correct
- `SUPABASE_SERVICE_ROLE_KEY` is valid
- IP whitelist (if any) includes Northflank IPs

### Stripe Webhook Failed

```
Error: No signatures found matching the expected signature
```

Check:
- `STRIPE_WEBHOOK_SECRET` matches dashboard
- Webhook endpoint URL is correct
- Using correct endpoint path

### AI Not Working

```
Error: ANTHROPIC_API_KEY not configured
```

Check:
- `ANTHROPIC_API_KEY` is set
- Key has not expired
- Model name is correct

### Email Not Sending

```
Error: Failed to deliver email
```

Check:
- Resend/SendGrid API key is valid
- Domain is verified
- DNS records are correct

---

## Support

For issues, check:
1. Northflank logs
2. Supabase logs
3. Stripe Dashboard events
4. Resend/SendGrid analytics
