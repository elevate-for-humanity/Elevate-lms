# Setup Guide

**Platform:** Elevate for Humanity Workforce Marketplace  
**Version:** 2.0.0  
**Last Updated:** January 4, 2026

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Third-Party Services](#third-party-services)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js:** 20.11.1 or higher (< 25)
- **Package Manager:** pnpm (recommended), npm, or yarn
- **Git:** Latest version
- **Code Editor:** VS Code (recommended)

### Required Accounts

- **Supabase:** Database and authentication
- **Stripe:** Payment processing
- **Resend:** Email delivery
- **Netlify:** Deployment (optional for local dev)

### System Requirements

- **OS:** macOS, Linux, or Windows (WSL2 recommended)
- **RAM:** 8GB minimum, 16GB recommended
- **Disk Space:** 5GB free space

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/elevateforhumanity/Elevate-lms.git
cd Elevate-lms
```

### 2. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

### 3. Set Up Environment Variables

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local  # or use your preferred editor
```

### 4. Run Database Migrations

```bash
# Run all migrations
pnpm db:migrate

# Seed database with sample data (optional)
pnpm db:seed
```

### 5. Start Development Server

```bash
pnpm dev
```

Visit: http://localhost:3000

---

## Detailed Setup

### Step 1: Install Node.js

#### macOS (using Homebrew)

```bash
brew install node@20
```

#### Linux (using nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

#### Windows

Download from: https://nodejs.org/

### Step 2: Install pnpm

```bash
npm install -g pnpm
```

Verify installation:

```bash
pnpm --version
```

### Step 3: Clone and Install

```bash
# Clone repository
git clone https://github.com/elevateforhumanity/Elevate-lms.git
cd Elevate-lms

# Install dependencies
pnpm install
```

### Step 4: Configure Git Hooks

```bash
# Install Husky for pre-commit hooks
pnpm prepare
```

This sets up:

- Pre-commit linting
- Pre-commit formatting
- Commit message validation

---

## Environment Configuration

### Environment Files

The project uses different environment files for different purposes:

- `.env.example` - Template with all required variables
- `.env.local` - Local development (not committed)
- `.env.production` - Production (managed by Netlify)

### Required Environment Variables

Create `.env.local` with the following variables:

```env
# ============================================
# DATABASE & AUTHENTICATION
# ============================================

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database Connection (optional - for direct access)
POSTGRES_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
POSTGRES_PASSWORD=your_postgres_password

# ============================================
# AUTHENTICATION
# ============================================

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ============================================
# PAYMENTS
# ============================================

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Affirm Configuration (optional)
AFFIRM_PUBLIC_KEY=your_affirm_public_key
AFFIRM_PRIVATE_KEY=your_affirm_private_key

# ============================================
# EMAIL
# ============================================

# Resend Configuration
RESEND_API_KEY=re_your_resend_api_key

# SendGrid Configuration (optional)
SENDGRID_API_KEY=SG.your_sendgrid_api_key

# ============================================
# AI & INTEGRATIONS
# ============================================

# OpenAI Configuration (optional)
OPENAI_API_KEY=sk-your_openai_api_key

# ============================================
# MONITORING
# ============================================

# Sentry Configuration (optional)
SENTRY_DSN=https://your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# ============================================
# FEATURE FLAGS
# ============================================

# Enable/disable features
NEXT_PUBLIC_ENABLE_AI_TUTOR=true
NEXT_PUBLIC_ENABLE_LIVE_CLASSES=true
NEXT_PUBLIC_ENABLE_GAMIFICATION=true
```

### Getting API Keys

#### Supabase

1. Go to https://app.supabase.com
2. Create a new project
3. Go to Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

#### Stripe

1. Go to https://dashboard.stripe.com
2. Get your API keys from Developers → API keys
3. For webhooks:
   - Go to Developers → Webhooks
   - Add endpoint: `http://localhost:3000/api/stripe/webhook`
   - Copy webhook signing secret

#### Resend

1. Go to https://resend.com
2. Create account and verify domain
3. Go to API Keys
4. Create new API key

#### OpenAI (Optional)

1. Go to https://platform.openai.com
2. Create API key
3. Add billing information

### Generating Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Database Setup

### Option 1: Using Supabase Cloud (Recommended)

#### 1. Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details
4. Wait for project to be created (~2 minutes)

#### 2. Run Migrations

```bash
# Set environment variables first
export NEXT_PUBLIC_SUPABASE_URL=your_url
export SUPABASE_SERVICE_ROLE_KEY=your_key

# Run migrations
pnpm db:migrate
```

#### 3. Seed Database (Optional)

```bash
pnpm db:seed
```

This creates:

- Sample courses
- Test users
- Demo programs
- Sample enrollments

### Option 2: Using Local Supabase

#### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Linux/Windows
npm install -g supabase
```

#### 2. Initialize Supabase

```bash
supabase init
supabase start
```

#### 3. Link to Project

```bash
supabase link --project-ref your-project-ref
```

#### 4. Run Migrations

```bash
supabase db push
```

### Manual Database Setup

If you prefer to run migrations manually:

1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in order from `supabase/migrations/`
3. Start with `001_initial_schema.sql`
4. Continue through all numbered migrations

### Verify Database Setup

```bash
# Check database connection
pnpm db:check

# Expected output:
# ✅ Database connected
# ✅ All tables exist
# ✅ RLS policies active
```

---

## Third-Party Services

### Stripe Setup

#### 1. Create Stripe Account

- Go to https://dashboard.stripe.com
- Complete account setup
- Verify business details

#### 2. Configure Products

Create products in Stripe Dashboard:

- Individual Tax Prep: $89
- Business Tax Returns: $299
- Bookkeeping: $199/month
- Audit Protection: $49/year

#### 3. Set Up Webhooks

1. Go to Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.failed`
   - `charge.refunded`

#### 4. Test Mode

Use test mode for development:

- Test cards: https://stripe.com/docs/testing
- Test webhook: Use Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Resend Setup

#### 1. Create Account

- Go to https://resend.com
- Sign up and verify email

#### 2. Verify Domain

1. Go to Domains
2. Add your domain
3. Add DNS records:
   - SPF record
   - DKIM record
   - DMARC record (optional)

#### 3. Create API Key

1. Go to API Keys
2. Create new key
3. Copy to `.env.local`

#### 4. Test Email

```bash
# Test email sending
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>Test email from Elevate</p>"
  }'
```

### Sentry Setup (Optional)

#### 1. Create Sentry Project

1. Go to https://sentry.io
2. Create new project
3. Select Next.js
4. Copy DSN

#### 2. Configure Sentry

```bash
# Install Sentry wizard
npx @sentry/wizard@latest -i nextjs
```

#### 3. Add Environment Variables

```env
SENTRY_DSN=https://your_sentry_dsn
SENTRY_AUTH_TOKEN=your_auth_token
```

---

## Development Workflow

### Starting Development

```bash
# Start dev server
pnpm dev

# Start with specific port
pnpm dev -- -p 3001

# Start with turbo mode
pnpm dev --turbo
```

### Code Quality

```bash
# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Check TypeScript
pnpm typecheck

# Format code
pnpm format

# Check formatting
pnpm format:check
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Generate coverage report
pnpm test:coverage
```

### Building

```bash
# Build for production
pnpm build

# Analyze bundle size
pnpm build && pnpm analyze

# Build and start production server
pnpm build && pnpm start
```

### Database Operations

```bash
# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Check database status
pnpm db:check

# Reset database (⚠️ destructive)
pnpm db:reset
```

---

## Troubleshooting

### Common Issues

#### Issue: "Module not found"

**Solution:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
```

#### Issue: "Port 3000 already in use"

**Solution:**

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev -- -p 3001
```

#### Issue: "Database connection failed"

**Solution:**

1. Check environment variables
2. Verify Supabase project is running
3. Check network connection
4. Verify API keys are correct

```bash
# Test database connection
curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/ \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

#### Issue: "Build fails with memory error"

**Solution:**

```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=8192"
pnpm build
```

#### Issue: "Stripe webhook not working locally"

**Solution:**

```bash
# Use Stripe CLI to forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy webhook signing secret to .env.local
```

#### Issue: "Email not sending"

**Solution:**

1. Verify Resend API key
2. Check domain verification
3. Check email logs in Resend dashboard
4. Verify sender email is verified

```bash
# Test Resend API
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@yourdomain.com","to":"test@example.com","subject":"Test","html":"Test"}'
```

### Debug Mode

Enable debug logging:

```env
# Add to .env.local
DEBUG=true
LOG_LEVEL=debug
```

View logs:

```bash
# Development logs
pnpm dev

# Production logs (Netlify)
netlify logs
```

### Getting Help

1. **Check Documentation:** Review docs in `/docs` directory
2. **Search Issues:** https://github.com/elevateforhumanity/Elevate-lms/issues
3. **Create Issue:** If problem persists, create new issue
4. **Contact Support:** support@www.elevateforhumanity.org

---

## Next Steps

After setup is complete:

1. **Explore the Platform**
   - Visit http://localhost:3000
   - Create test account
   - Browse courses
   - Test enrollment flow

2. **Read Documentation**
   - `docs/ARCHITECTURE.md` - System architecture
   - `docs/API_DOCUMENTATION.md` - API reference
   - `docs/USER_FLOWS.md` - User journeys

3. **Start Development**
   - Create feature branch
   - Make changes
   - Run tests
   - Submit pull request

4. **Deploy to Production**
   - See `docs/DEPLOYMENT.md`
   - Configure Netlify
   - Set environment variables
   - Deploy

---

## Additional Resources

### Documentation

- [Architecture](./ARCHITECTURE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [User Flows](./USER_FLOWS.md)
- [Contributing](./CONTRIBUTING.md)

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Community

- GitHub Issues: https://github.com/elevateforhumanity/Elevate-lms/issues
- Website: https://www.elevateforhumanity.org
- Email: support@www.elevateforhumanity.org

---

**Document Version:** 1.0  
**Last Updated:** January 4, 2026  
**Maintained By:** Engineering Team
