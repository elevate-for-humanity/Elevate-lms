/**
 * POST /api/admin/credentials — create a credential in the registry
 * GET  /api/admin/credentials — list all credentials (with optional stack filter)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { mapCredentialRow, type RawCredentialRow } from '@/lib/domain';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = createAdminClient();
  const { data: p } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!p || !['admin','super_admin','org_admin','staff'].includes(p.role)) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const stack = searchParams.get('stack');
  const issuerType = searchParams.get('issuer_type');

  const db = createAdminClient();
  let q = db.from('credential_registry').select('*').eq('is_active', true).order('credential_stack').order('name');
  if (stack) q = q.eq('credential_stack', stack);
  if (issuerType) q = q.eq('issuer_type', issuerType);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  return NextResponse.json({ credentials: (data ?? []).map((r) => mapCredentialRow(r as RawCredentialRow)) });
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 422 });
  if (!body?.issuing_authority?.trim()) return NextResponse.json({ error: 'issuing_authority is required' }, { status: 422 });
  if (!['elevate_issued','elevate_proctored','partner_delivered'].includes(body.issuer_type)) {
    return NextResponse.json({ error: 'invalid issuer_type' }, { status: 422 });
  }

  // Enforce: if proctor_authority = elevate, set protected in metadata
  const metadata = {
    ...(body.metadata ?? {}),
    protected: body.proctor_authority === 'elevate',
    credential_owner: body.proctor_authority === 'elevate' ? 'elevate' : (body.issuing_authority ?? ''),
  };

  const db = createAdminClient();
  const { data, error } = await db
    .from('credential_registry')
    .insert({ ...body, metadata, created_by: user.id })
    .select()
    .single();

  if (error) {
    logger.error('POST credential error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  logger.info('Credential created', { name: body.name, issuer_type: body.issuer_type, userId: user.id });
  return NextResponse.json({ credential: mapCredentialRow(data as RawCredentialRow) }, { status: 201 });
}
