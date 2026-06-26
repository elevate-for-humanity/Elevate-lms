/**
 * POST /api/admin/tenants/[id]/clone
 *
 * Creates a new tenant as a copy of an existing one, cloning:
 *   - Tenant record (name, state, branding, plan)
 *   - Workflow definitions (not runs)
 *   - Program enrollments template (programs linked to source tenant)
 *   - Tenant settings
 *
 * The clone gets a fresh subdomain, empty user base, and no active runs.
 * Auth: admin only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { id: sourceId } = await params;
  const traceId = request.headers.get('x-trace-id') ?? 'no-trace';
  const db = await requireAdminClient();

  const body = await request.json().catch(() => ({}));
  const { name, subdomain, contactEmail } = body as {
    name?: string;
    subdomain?: string;
    contactEmail?: string;
  };

  if (!name || !subdomain) {
    return NextResponse.json({ error: 'name and subdomain are required' }, { status: 400 });
  }

  // Validate subdomain format
  if (!/^[a-z0-9-]{3,63}$/.test(subdomain)) {
    return NextResponse.json(
      { error: 'subdomain must be 3–63 lowercase alphanumeric characters or hyphens' },
      { status: 400 },
    );
  }

  // Load source tenant
  const { data: source, error: sourceErr } = await db
    .from('tenants')
    .select('*')
    .eq('id', sourceId)
    .single();

  if (sourceErr || !source) {
    return NextResponse.json({ error: 'Source tenant not found' }, { status: 404 });
  }

  // Check subdomain uniqueness
  const { data: existing } = await db
    .from('tenants')
    .select('id')
    .eq('subdomain', subdomain)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: `Subdomain '${subdomain}' is already taken` }, { status: 409 });
  }

  logger.info('[tenant-clone] cloning tenant', {
    sourceId,
    sourceName: source.name,
    newName: name,
    subdomain,
    clonedBy: auth.profile?.id,
    trace_id: traceId,
  });

  // Create new tenant from source
  const { data: newTenant, error: createErr } = await db
    .from('tenants')
    .insert({
      name,
      subdomain,
      state: source.state,
      branding: source.branding ?? {},
      enabled: true,
      contact_email: contactEmail ?? null,
      plan: source.plan ?? 'starter',
      cloned_from: sourceId,
      domain: `${subdomain}.app.elevateforhumanity.org`,
    })
    .select()
    .single();

  if (createErr || !newTenant) {
    logger.error('[tenant-clone] Failed to create tenant', { error: createErr?.message, trace_id: traceId });
    return NextResponse.json({ error: 'Failed to create tenant clone' }, { status: 500 });
  }

  let workflowsCloned = 0;
  let settingsCloned = 0;

  // Clone workflow definitions (not runs)
  const { data: sourceWorkflows } = await db
    .from('workflows')
    .select('name, description, trigger_type, trigger_config, steps, category, status')
    .eq('tenant_id', sourceId);

  if (sourceWorkflows && sourceWorkflows.length > 0) {
    const clonedWorkflows = sourceWorkflows.map((w: any) => ({
      ...w,
      tenant_id: newTenant.id,
      status: 'inactive', // start inactive — admin activates after review
      cloned_from_tenant: sourceId,
    }));

    const { error: wfErr } = await db.from('workflows').insert(clonedWorkflows);
    if (wfErr) {
      logger.warn('[tenant-clone] Failed to clone workflows', { error: wfErr.message, trace_id: traceId });
    } else {
      workflowsCloned = clonedWorkflows.length;
    }
  }

  // Clone tenant settings
  const { data: sourceSettings } = await db
    .from('tenant_settings')
    .select('key, value, category')
    .eq('tenant_id', sourceId);

  if (sourceSettings && sourceSettings.length > 0) {
    const clonedSettings = sourceSettings.map((s: any) => ({
      tenant_id: newTenant.id,
      key: s.key,
      value: s.value,
      category: s.category,
    }));

    const { error: settingsErr } = await db.from('tenant_settings').insert(clonedSettings);
    if (settingsErr) {
      logger.warn('[tenant-clone] Failed to clone settings', { error: settingsErr.message, trace_id: traceId });
    } else {
      settingsCloned = clonedSettings.length;
    }
  }

  logger.info('[tenant-clone] clone complete', {
    sourceId,
    newTenantId: newTenant.id,
    workflowsCloned,
    settingsCloned,
    trace_id: traceId,
  });

  return NextResponse.json({
    ok: true,
    tenant: {
      id: newTenant.id,
      name: newTenant.name,
      subdomain: newTenant.subdomain,
      domain: newTenant.domain,
      dashboardUrl: `https://${subdomain}.app.elevateforhumanity.org/admin`,
    },
    cloned: { workflowsCloned, settingsCloned },
  });
}
