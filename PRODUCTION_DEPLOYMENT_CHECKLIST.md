# 🚀 PRODUCTION DEPLOYMENT CHECKLIST

## CRITICAL: Environment Configuration Required

### Supabase Setup (MUST HAVE)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Database URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Client key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Admin key

### Stripe Setup
- [ ] `STRIPE_SECRET_KEY` - API key
- [ ] `STRIPE_WEBHOOK_SECRET` - Webhook signature
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Public key

### Email Setup
- [ ] `SENDGRID_API_KEY` - Email API
- [ ] `RESEND_API_KEY` - Backup email

### AI Setup
- [ ] `ANTHROPIC_API_KEY` - Claude (PARIS)
- [ ] `GROQ_API_KEY` - Zora chat

### Other
- [ ] `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` - Bot protection
- [ ] `NEXT_PUBLIC_SITE_URL` - Production URL
- [ ] `NEXT_PUBLIC_ADMIN_URL` - Admin URL

---

## Database Migrations (MUST RUN)

### Critical Tables (Pending)
```bash
supabase/migrations/pending/20260713000001_critical_tables.sql
```

Tables to create:
- ai_conversations
- digital_binders
- binder_documents
- certifications
- credentials
- licenses
- grades
- communications
- leads
- conversations
- announcements
- blog_posts
- campaigns
- events
- coupons
- cohort_sessions
- notification_outbox
- enrollment_status_history

---

## Northflank Deployment

### Step 1: Configure Secrets
1. Login to Northflank dashboard
2. Add secrets to each service:
   - LMS Service
   - Admin Service  
   - Marketing Service

### Step 2: Trigger Build
1. Push to main branch
2. Northflank auto-builds
3. Verify containers start

### Step 3: Verify Health
```bash
curl https://work-1-nyjiwegwzcshwwjd.prod-runtime.all-hands.dev/api/health
curl https://work-2-nyjiwegwzcshwwjd.prod-runtime.all-hands.dev/api/health
```

---

## Verification Tests

### 1. Apply Flow
```bash
curl -X POST "https://work-1-xxx.prod-runtime.all-hands.dev/api/apply" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@fake.com",
    "phone":"3175551234",
    "program":"barber"
  }'
```

Expected: 200 OK, email sent

### 2. Database Write
```bash
# Check applications table
curl "https://work-1-xxx.prod-runtime.all-hands.dev/api/admin/applications"
```

### 3. Stripe Webhook
```bash
# Send test webhook
stripe trigger payment_intent.succeeded
```

### 4. Email
```bash
# Check SendGrid logs
# Verify email received
```

---

## Post-Deployment Validation

### Public Site
- [ ] Homepage loads
- [ ] Navigation works
- [ ] Images render
- [ ] Forms submit

### Admin
- [ ] Login works
- [ ] Dashboard loads
- [ ] Applications visible
- [ ] Can approve application

### Student Portal
- [ ] Login works
- [ ] Courses display
- [ ] Progress tracking works

### Payment Flow
- [ ] Checkout creates Stripe session
- [ ] Payment succeeds
- [ ] Webhook fires
- [ ] Enrollment created

### Notifications
- [ ] Email sends
- [ ] Dashboard notifications appear

---

## Rollback Plan

If issues occur:
1. Revert to previous commit
2. Northflank auto-deploys
3. Verify site restored

---

## Contacts

- **Engineering Lead:** [Name]
- **DevOps:** [Name]
- **Northflank Support:** support@northflank.com
- **Supabase Support:** support@supabase.io
- **Stripe Support:** support@stripe.com

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering Lead | | | |
| Product Owner | | | |
| DevOps | | | |
| QA Lead | | | |
