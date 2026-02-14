# Staging Environment

Internal documentation for the dedicated staging environment.

## Overview

A separate Supabase project exists for staging/testing purposes. This environment is isolated from production and should be used for:

- Testing database migrations before production deployment
- QA testing of new features
- Integration testing with third-party services
- Load testing (with synthetic data only)

## Configuration

### Environment Variables

The following environment variables are used for staging:

```
NEXT_PUBLIC_SUPABASE_URL_STAGING=<staging-project-url>
SUPABASE_SERVICE_ROLE_KEY_STAGING=<staging-service-key>
```

These should be set in:
- Local `.env.local` for development
- Netlify environment variables for staging deployments
- CI/CD pipeline secrets

### Switching Environments

To run the application against staging:

```bash
# Option 1: Use staging env file
cp .env.staging .env.local
pnpm dev

# Option 2: Override at runtime
NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL_STAGING \
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY_STAGING \
pnpm dev
```

## What's Included

The staging environment has:

- Separate PostgreSQL database
- Separate Supabase Auth instance
- Separate Storage buckets
- Separate Edge Functions

## What's NOT Included

- Production data (never copy production data to staging)
- Real user accounts
- Production API keys for third-party services

## Data Policy

**Never copy production data to staging.**

Use synthetic/seed data only:
```bash
pnpm run seed:staging
```

## Deployment

Staging deployments are triggered:
- Automatically on PR creation (preview deployments)
- Manually via Netlify dashboard
- Via CI/CD on `staging` branch pushes

## Access

Staging environment access is limited to:
- Development team
- QA team
- Authorized contractors

Contact the platform team for access credentials.

## Maintenance

The staging database is reset weekly (Sundays at midnight UTC) to ensure a clean testing environment. Notify the team if you need data preserved longer.

---

*Last updated: January 24, 2026*
