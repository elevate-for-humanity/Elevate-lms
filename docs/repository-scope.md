# Repository Scope

This document defines what is and is not included in this public repository.

## What Is Included

### Application Code
- Full Next.js application source (`app/`, `components/`, `lib/`)
- All 1,439 pages and 1,020 API routes
- All 857 React components
- All 732 library modules (auth, enrollment, compliance, payments, AI, LMS)
- All 225 SQL migration files
- All 7 Netlify serverless functions
- Configuration files (`next.config.ts`, `tailwind.config.ts`, `netlify.toml`, etc.)

### Documentation
- Platform architecture overview
- Access model and licensing terms
- Compliance posture summary
- Repository scope (this document)
- Security policy
- Contributing guidelines
- Support channels

### Static Assets
- 1,197 static images (workforce photography, program images, UI assets)
- Public fonts and icons

### Data
- Program catalog data (`data/`, `lib/programs/`)
- Team data (`data/team.ts`)
- Course definitions with lesson-level content (5 fully built courses)

## What Is Not Included

### Secrets and Credentials
- `.env.local` — production environment variables
- Supabase service role key
- Stripe secret keys and webhook secrets
- OpenAI API key
- Resend API key
- Any other API credentials

These are managed in the Netlify dashboard and are never committed to source.

### Live Data
- Student records, PII, enrollment data
- Payment transaction history
- Audit logs from production
- Agency reporting data
- Employer contract documents

### Proprietary Assets
- Full video library (737 MP4 files — hosted on Supabase Storage and CDN)
- AI prompt libraries and fine-tuning data
- Proprietary assessment content
- Partnership agreement templates (internal versions)

### Infrastructure Configuration
- Supabase project configuration and RLS policies (applied via migrations, but live config is separate)
- Netlify environment configuration
- DNS and domain configuration
- CDN configuration

## What This Means for Deployment

This repository is **not a deployable copy of the production system**. To run a functional instance you need:

1. A Supabase project with all migrations applied and RLS policies configured
2. A Stripe account with products, prices, and webhooks configured
3. A Resend account with sending domain verified
4. An OpenAI API key
5. A Netlify project with all environment variables set
6. The video asset library (available under managed access or enterprise license)

The codebase is structured so that missing environment variables fail loudly at startup — there is no silent degradation.

## Relationship to Production

The production system at [elevateforhumanity.org](https://www.elevateforhumanity.org) runs from this codebase with:

- All environment variables configured
- Full video and media library
- Live Supabase database with student, enrollment, and compliance data
- Active Stripe integration
- Netlify deployment pipeline (auto-deploy on push to `main`)

Changes to this repository deploy to production automatically. The public repository and the production system are the same codebase.
