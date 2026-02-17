# Database Seed Files

## Master Seed File

**Use this file for all database seeding:**
- `000_master_seed.sql` - Complete production seed data

This file contains:
- 27 DOL-approved programs
- Program categories and details
- Pricing and funding information
- Job titles and salary ranges
- All production-ready data

## Usage

### With Supabase CLI
```bash
supabase db reset
# Seeds are automatically applied
```

### With psql
```bash
psql $DATABASE_URL -f supabase/seeds/000_master_seed.sql
```

### With Node.js
```typescript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(url, key);
const sql = fs.readFileSync('supabase/seeds/000_master_seed.sql', 'utf-8');
// Execute SQL...
```

## Archived Seed Files

All other seed files have been moved to `archive/` folder:
- These are legacy files from development
- They may contain duplicate or outdated data
- **Do not use these files** - use `000_master_seed.sql` instead

## Migration-Based Seeds

Some seed data is included in migrations:
- `20260101_seed_eps_lessons.sql` - SupersonicFastCash tax training lessons
- These are applied automatically with migrations

## Data Sources

The master seed file contains:
- **Programs:** 27 WIOA-approved training programs
- **Categories:** Healthcare, Technology, Skilled Trades, Beauty & Wellness
- **Certifications:** Industry-standard certifications for each program
- **Salary Data:** Average salary ranges from DOL data
- **Job Outlook:** Employment growth projections

## Updating Seed Data

To update seed data:
1. Edit `000_master_seed.sql`
2. Test on development database
3. Commit changes
4. Apply to production

**Do not create new seed files** - update the master file instead.

## Troubleshooting

### Duplicate Key Errors
```sql
-- Clear existing data first
TRUNCATE programs CASCADE;
-- Then run seed file
```

### Foreign Key Violations
- Ensure migrations are applied first
- Check that referenced tables exist
- Verify foreign key constraints

### Permission Errors
- Use service role key for seeding
- Ensure RLS policies allow inserts
- Check table permissions

## Production Deployment

For production deployments:
1. Apply all migrations first
2. Run master seed file
3. Verify data with queries
4. Test application functionality

```bash
# Complete setup
supabase db reset
supabase db push
psql $DATABASE_URL -f supabase/seeds/000_master_seed.sql
```
