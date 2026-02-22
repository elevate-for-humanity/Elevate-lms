import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createAdminClient } from '@/lib/supabase/admin';
import { auditLog } from '@/lib/auditLog';
import { updateTenantLicense } from '@/lib/licenseGuard';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { name, state, plan = 'starter', branding } = body;

    if (!name || !state) {
      return NextResponse.json(
        { error: 'name and state are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await db
      .from('tenants')
      .insert({
        name,
        state: state.toUpperCase(),
        branding: branding || {},
        enabled: true,
      })
      .select()
      .single();

    if (tenantError) {
      return NextResponse.json({ error: 'Tenant creation failed' }, { status: 400 });
    }

    // Create license
    const license = await updateTenantLicense(tenant.id, plan);

    if (!license) {
      return NextResponse.json(
        { error: 'Failed to create license' },
        { status: 500 }
      );
    }

    // Log tenant creation
    await auditLog({
      actor_user_id: req.headers.get('x-user-id') || undefined,
      actor_role: 'admin',
      action: 'CREATE',
      entity: 'employer',
      entity_id: tenant.id,
      after: tenant,
      req,
      metadata: { tenant_type: 'new', plan },
    });

    return NextResponse.json({
      success: true,
      tenant,
      license,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = createAdminClient();

    const { data, error }: any = await db
      .from('tenants')
      .select('*, tenant_licenses(*)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    return NextResponse.json({ tenants: data || [] });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
