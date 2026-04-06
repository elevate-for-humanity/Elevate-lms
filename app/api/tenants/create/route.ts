import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { auditLog } from '@/lib/auditLog';
import { updateTenantLicense } from '@/lib/licenseGuard';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['admin', 'super_admin'];

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, db: null, error: 'Unauthorized' as const };

  const db = createAdminClient();
  if (!db) return { user: null, db: null, error: 'Service unavailable' as const };

  const { data: profile } = await db
    .from('profiles').select('role').eq('id', user.id).single();

  if (!profile || !ADMIN_ROLES.includes(profile.role ?? '')) {
    return { user: null, db: null, error: 'Forbidden' as const };
  }
  return { user, db, error: null };
}

export async function POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const { user, db, error: authError } = await requireSuperAdmin();
  if (authError || !user || !db) {
    return NextResponse.json({ error: authError }, { status: authError === 'Unauthorized' ? 401 : 403 });
  }

  try {
    const body = await req.json();
    const { name, state, plan = 'starter', branding } = body;

    if (!name || !state) {
      return NextResponse.json({ error: 'name and state are required' }, { status: 400 });
    }

    const { data: tenant, error: tenantError } = await db
      .from('tenants')
      .insert({ name, state: state.toUpperCase(), branding: branding || {}, enabled: true })
      .select()
      .single();

    if (tenantError) {
      logger.error('[tenants/create] insert failed', tenantError);
      return NextResponse.json({ error: 'Tenant creation failed' }, { status: 400 });
    }

    const license = await updateTenantLicense(tenant.id, plan);
    if (!license) {
      return NextResponse.json({ error: 'Failed to create license' }, { status: 500 });
    }

    await auditLog({
      actor_user_id: user.id,
      actor_role: 'admin',
      action: 'CREATE',
      entity: 'employer',
      entity_id: tenant.id,
      after: tenant,
      req,
      metadata: { tenant_type: 'new', plan },
    });

    return NextResponse.json({ success: true, tenant, license });
  } catch (err: unknown) {
    logger.error('[tenants/create] unexpected error', err instanceof Error ? err : undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const { user, db, error: authError } = await requireSuperAdmin();
  if (authError || !user || !db) {
    return NextResponse.json({ error: authError }, { status: authError === 'Unauthorized' ? 401 : 403 });
  }

  try {
    const { data, error } = await db
      .from('tenants')
      .select('*, tenant_licenses(*)')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[tenants/create] select failed', error);
      return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
    }

    return NextResponse.json({ tenants: data ?? [] });
  } catch (err: unknown) {
    logger.error('[tenants/create] unexpected error', err instanceof Error ? err : undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
