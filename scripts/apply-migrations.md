# Applying Database Migrations

## Required Migrations

The following migrations need to be applied to complete the reference implementation:

1. `001_barber_hvac_reference.sql` - Core tables and RLS policies
2. `20260201_complete_canonical_tables.sql` - Additional tables (roles, user_roles, funding_sources, evaluations, document_verifications)

## How to Apply

### Option 1: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of each migration file
4. Execute the SQL

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

### Option 3: Direct psql

```bash
# Connect to your database
psql "postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres"

# Run migration
\i supabase/migrations/001_barber_hvac_reference.sql
\i supabase/migrations/20260201_complete_canonical_tables.sql
```

## Verify Migration Success

After applying migrations, verify with:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;

-- Check policies exist
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

## Expected Tables After Migration

- profiles
- roles
- user_roles
- programs
- intakes
- applications
- cohorts
- enrollments
- partner_organizations
- partner_sites
- apprentice_assignments
- attendance_hours
- evaluations
- documents
- document_requirements
- document_verifications
- funding_sources
- program_funding_links
- audit_logs
