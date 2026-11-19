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

### Optional footer presentation

Subscriber configs can set `footer.showLogo: true` to reuse the saved
`branding.logoImage`, and `footer.layout: 'columns'` to place the brand beside
saved page-link groups and the optional saved business contact column. Omitted
settings retain the existing text brand and stacked footer. No logo is invented.

`footer.socialLinks` accepts up to six `{ label, url, icon? }` entries. Optional
icons are `facebook`, `linkedin`, `youtube`, `instagram` and `link`; a label
remains required for accessible naming. Omit the icon to show a text link. Labels must have
1–80 characters; URLs must be absolute HTTPS URLs without credentials, whitespace
or control characters, and no longer than 2,048 characters. The structure editor
supports adding, removing, saving and reopening these settings. Generation only
retains exact profile URLs present in subscriber-supplied answers or a brief;
imports and manual edits are validated before normalization and persistence.
External social actions are suppressed in read-only saved-version previews.
These settings do not create legal, authentication, calendar or checkout routes.
