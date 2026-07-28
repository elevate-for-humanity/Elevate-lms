# Northflank Runtime Secrets

## Required Runtime Secrets (not build args)

These secrets must be configured as **runtime environment variables** in Northflank, NOT as build arguments:

### Admin Service
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Auth secret for JWT
- `SSN_SALT` - Random salt for SSN hashing (generate with: `openssl rand -hex 32`)
- `NEXT_PUBLIC_SITE_URL` - https://www.elevateforhumanity.org
- `NEXT_PUBLIC_ADMIN_URL` - https://admin.elevateforhumanity.org
- `NEXT_PUBLIC_APP_URL` - https://app.elevateforhumanity.org
- `NEXT_PUBLIC_SUPABASE_URL` - https://xxx.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

### Marketing Service
- Same Supabase variables
- `NEXT_PUBLIC_SITE_URL` - https://www.elevateforhumanity.org
- `DATABASE_URL` - PostgreSQL connection string (if used)

### LMS Service  
- Same Supabase variables
- `NEXT_PUBLIC_SITE_URL` - https://www.elevateforhumanity.org
- `DATABASE_URL` - PostgreSQL connection string

## Generate SSN_SALT
```bash
openssl rand -hex 32
```
