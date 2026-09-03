# Tenant Isolation (STEP 4)

Multi-tenant isolation for the Elevate LMS platform.

## Architecture

```
Request → Middleware → Route Handler → Database (RLS)
              ↓              ↓
         Injects         Uses tenant
         headers         context
```

## Usage

### Server Components / API Routes

```typescript
import { getTenantContext, TenantContextError } from '@/lib/tenant';

export async function GET() {
  try {
    const { tenantId, userId, role } = await getTenantContext();

    // Query with tenant_id filter
    const { data } = await supabase.from('profiles').select('*').eq('tenant_id', tenantId);
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
  }
}
```

### Safe Variant (returns null instead of throwing)

```typescript
import { getTenantContextSafe } from '@/lib/tenant';

const context = await getTenantContextSafe();
if (!context) {
  // Handle missing tenant
}
```

## Files

| File                  | Purpose                                |
| --------------------- | -------------------------------------- |
| `getTenantContext.ts` | Extract tenant from authenticated user |
| `requireTenant.ts`    | Extract tenant from request headers    |
| `index.ts`            | Public exports                         |

## Database

RLS policies use `get_current_tenant_id()` function:

```sql
CREATE POLICY "tenant_isolation"
  ON some_table FOR SELECT
  USING (tenant_id = get_current_tenant_id());
```

## Migration

See `supabase/migrations/20260119_tenant_isolation_rls.sql`
