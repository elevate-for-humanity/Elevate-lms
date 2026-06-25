import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError, safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProgramSubmitBody = {
  program_id?: string;
  tenant_id?: string;
  notes?: string;
};

type ProfileTenant = { tenant_id?: string | null };
type ProviderProgram = {
  id: string;
  title?: string | null;
  slug?: string | null;
  tenant_id?: string | null;
  status?: string | null;
  is_published?: boolean | null;
  updated_at?: string | null;
};

const SUBMIT_ROLES = new Set([
  'provider_admin',
  'admin',
  'admin',
  'admin',
  'staff',
  'org_admin',
]);

function resolveTenantId({
  role,
  bodyTenantId,
  profileTenantId,
  programTenantId,
}: {
  role?: string | null;
  bodyTenantId?: string;
  profileTenantId?: string | null;
  programTenantId?: string | null;
}): { tenantId?: string; error?: NextResponse } {
  if (role === 'provider_admin') {
    if (!profileTenantId) {
      return { error: safeError('Provider admin profile is missing tenant_id', 403) };
    }
    if (bodyTenantId && bodyTenantId !== profileTenantId) {
      return { error: safeError('Provider admins can only submit programs for their tenant', 403) };
    }
    if (!programTenantId || programTenantId !== profileTenantId) {
      return { error: safeError('Program does not belong to the provider tenant', 403) };
    }
    return { tenantId: profileTenantId };
  }

  const tenantId = bodyTenantId ?? programTenantId ?? profileTenantId ?? undefined;
  if (!tenantId) return { error: safeError('tenant_id is required for program submission', 400) };
  if (programTenantId && programTenantId !== tenantId) {
    return { error: safeError('Program does not belong to the requested tenant', 403) };
  }
  return { tenantId };
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  if (!auth.role || !SUBMIT_ROLES.has(auth.role)) {
    return safeError('Forbidden', 403);
  }

  const body = (await request.json().catch(() => null)) as ProgramSubmitBody | null;
  if (!body?.program_id) return safeError('program_id is required', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  try {
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('tenant_id')
      .eq('id', auth.id)
      .maybeSingle();
    if (profileError) return safeDbError(profileError, 'Provider program submit profile lookup failed');

    const { data: program, error: programError } = await db
      .from('programs')
      .select('id, title, slug, tenant_id, status, is_published, updated_at')
      .eq('id', body.program_id)
      .maybeSingle();
    if (programError) return safeDbError(programError, 'Provider program submit lookup failed');
    if (!program) return safeError('Program not found', 404);

    const tenantResolution = resolveTenantId({
      role: auth.role,
      bodyTenantId: body.tenant_id,
      profileTenantId: (profile as ProfileTenant | null)?.tenant_id,
      programTenantId: (program as ProviderProgram).tenant_id,
    });
    if (tenantResolution.error) return tenantResolution.error;
    const requestedTenantId = tenantResolution.tenantId!;

    const { data: existing, error: existingError } = await db
      .from('provider_program_approvals')
      .select('id, status')
      .eq('tenant_id', requestedTenantId)
      .eq('program_id', body.program_id)
      .maybeSingle();
    if (existingError) return safeDbError(existingError, 'Provider program approval lookup failed');
    if ((existing as { status?: string } | null)?.status === 'approved') {
      return safeError('Program is already approved', 409);
    }

    const payload = {
      tenant_id: requestedTenantId,
      program_id: body.program_id,
      status: 'submitted',
      submitted_by: auth.id,
      submitted_at: new Date().toISOString(),
      review_notes: body.notes ?? null,
      reviewed_by: null,
      reviewed_at: null,
      program_snapshot: program,
      updated_at: new Date().toISOString(),
    };

    const { data: approval, error: upsertError } = await db
      .from('provider_program_approvals')
      .upsert(payload, { onConflict: 'tenant_id,program_id' })
      .select('id, status, tenant_id, program_id, submitted_at')
      .maybeSingle();
    if (upsertError) return safeDbError(upsertError, 'Provider program submission failed');

    return NextResponse.json({ ok: true, approval }, { status: existing ? 200 : 201 });
  } catch (error) {
    return safeInternalError(error, 'Provider program submission failed');
  }
}
