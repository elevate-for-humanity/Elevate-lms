# Current Architecture Report

Generated: 2026-02-01

## Authentication Architecture

### Auth Provider
- **Supabase Auth** via `@supabase/ssr` package
- Server-side client: `lib/supabase/server.ts` using `createServerClient`
- Browser client: `lib/supabase/client.ts`
- Admin client: `lib/supabase/admin.ts` (service role key)

### Auth Flow
1. User authenticates via Supabase Auth (email/password, OAuth)
2. Session stored in cookies (managed by `@supabase/ssr`)
3. Server components call `createClient()` to get authenticated client
4. RLS policies enforce data access based on `auth.uid()`

### Auth Utilities (`lib/auth.ts`)
```typescript
// Key functions:
getSession()           // Get current session
getCurrentUser()       // Get user + profile
getUserRole()          // Get role from profiles table
requireAuth()          // Redirect to /login if not authenticated
requireRole(roles)     // Redirect to /unauthorized if wrong role
requireApiAuth()       // Throw APIAuthError for API routes
```

### Demo Mode
- `DEMO_MODE=true` or `NODE_ENV=development` enables mock session
- Returns admin role for all auth checks
- Allows testing without real authentication

---

## Role System

### Roles Stored In
- **Primary**: `profiles.role` column (TEXT)
- **Extended**: `user_roles` table (many-to-many with `roles` table)

### Defined Roles
| Role | Description | Access Level |
|------|-------------|--------------|
| `student` | Enrolled learner | Own data only |
| `instructor` | Teaches cohorts | Assigned cohorts + students |
| `partner` | Partner org rep | Own org's sites + apprentices |
| `employer` | Job placement partner | Limited |
| `program_owner` | Program manager | Program-scoped |
| `delegate` | Case manager | Assigned students |
| `program_holder` | Legacy role | Program-scoped |
| `admin` | System admin | Full access |
| `super_admin` | Super admin | Full access |
| `hr_admin` | HR management | HR features |
| `marketing_admin` | Marketing | Marketing features |

### RBAC Implementation (`lib/rbac.ts`)
```typescript
// Key functions:
getCurrentUserWithRole()  // Get user + profile with role
requireAdmin(roles)       // Require admin-level role
requireRole(roles)        // Require any of specified roles
hasRole(roles)            // Boolean check
requireRoleLevel(minRole) // Hierarchy-based check
```

### Role Hierarchy
```typescript
const ROLE_HIERARCHY = {
  admin: 100,
  hr_admin: 80,
  marketing_admin: 80,
  manager: 60,
  provider_admin: 50,
  delegate: 40,
  student: 20,
};
```

---

## CRUD Patterns

### API Routes (Route Handlers)
Location: `app/api/*/route.ts`

**Pattern:**
```typescript
export async function POST(req: Request) {
  // 1. Rate limiting
  const rateLimitResult = rateLimit(`key:${identifier}`, RATE_LIMITS.X);
  if (!rateLimitResult.ok) return 429;
  
  // 2. Parse body
  const body = await req.json();
  
  // 3. Validate required fields
  if (!body.field) return 400;
  
  // 4. Get Supabase client (admin or user)
  const supabase = createAdminClient(); // or await createClient()
  
  // 5. Auth check (for protected routes)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 401;
  
  // 6. Role check
  const { data: profile } = await supabase.from('profiles')...
  if (profile?.role !== 'admin') return 403;
  
  // 7. Database operation
  const { data, error } = await supabase.from('table').insert(...);
  
  // 8. Return response
  return NextResponse.json({ ok: true, data });
}
```

### Server Actions
Location: `lib/actions/*.ts`

**Pattern:**
```typescript
'use server';

export async function createThing(formData: FormData) {
  const supabase = await createClient();
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  // Database operation
  const { data, error } = await supabase.from('things').insert(...);
  
  // Revalidate cache
  revalidatePath('/things');
  
  return { success: true, data };
}
```

### Direct Supabase Queries (Server Components)
**Pattern:**
```typescript
export default async function Page() {
  const supabase = await createClient();
  
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });
  
  return <ItemList items={items} />;
}
```

---

## Data Access Patterns

### Public Data (No Auth)
- Programs catalog
- Public pages
- Contact/inquiry forms (create only)

### User-Scoped Data (RLS)
- Applications: `user_id = auth.uid()` or `email = user.email`
- Enrollments: `user_id = auth.uid()`
- Documents: `user_id = auth.uid()`
- Progress: via enrollment ownership

### Role-Scoped Data (RLS + App Logic)
- Instructors: Assigned cohorts + their students
- Partners: Own organization's sites + apprentices
- Delegates: Assigned students

### Admin Data (Admin Role Check)
- All tables via admin policies
- Audit logs (read only)
- System configuration

---

## RLS Policy Patterns

### Standard User Policy
```sql
CREATE POLICY "users_read_own" ON table
FOR SELECT TO authenticated
USING (user_id = auth.uid());
```

### Admin Full Access
```sql
CREATE POLICY "admin_all" ON table
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

### Instructor Cohort Access
```sql
CREATE POLICY "instructor_read_cohort" ON table
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cohorts
    WHERE cohorts.id = table.cohort_id
    AND cohorts.instructor_id = auth.uid()
  )
);
```

### Partner Organization Access
```sql
CREATE POLICY "partner_read_own_org" ON table
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN partner_organizations po ON p.partner_org_id = po.id
    WHERE p.id = auth.uid()
    AND po.id = table.partner_id
  )
);
```

---

## Key Tables

### Core Identity
- `profiles` - User profiles (extends auth.users)
- `roles` - Role definitions
- `user_roles` - User-role assignments

### Programs & Enrollment
- `programs` - Program catalog
- `applications` - Student applications
- `enrollments` - Active enrollments
- `cohorts` - Program cohorts

### Apprenticeship
- `partner_organizations` - Employer/training partners
- `partner_sites` - Physical locations
- `apprentice_assignments` - Student-site assignments
- `attendance_hours` - Hour logging

### Documents & Compliance
- `documents` - Uploaded files
- `document_requirements` - Required docs per program
- `document_verifications` - Verification records

### Audit
- `audit_logs` - All privileged actions

---

## Identified Issues

### 1. Multiple Application Tables
- `applications` (generic)
- `student_applications`
- `partner_applications`
- `employer_applications`

**Recommendation**: Consolidate to single `applications` table with `type` column.

### 2. Role Storage Inconsistency
- `profiles.role` (single role, TEXT)
- `user_roles` table (multiple roles)

**Recommendation**: Use `user_roles` as source of truth, deprecate `profiles.role`.

### 3. Program Data Sources
- `config/programs.json` (JSON file)
- `lib/programs-data.ts` (TypeScript)
- `programs` table (database)

**Recommendation**: Database is source of truth. JSON/TS files for static fallback only.

### 4. Enrollment Foreign Keys
- Some enrollments use `student_id` (references profiles)
- Some use `user_id` (references auth.users)

**Recommendation**: Standardize on `user_id` referencing `profiles.id`.
