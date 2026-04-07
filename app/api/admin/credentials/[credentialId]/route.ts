/**
 * PATCH /api/admin/credentials/[credentialId] — update a credential
 * DELETE /api/admin/credentials/[credentialId] — soft-delete (is_active = false)
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ credentialId: string }> }
) {
  const { credentialId } = await params;
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const db = createAdminClient();

  // Pre-read: verify credential exists before updating
  const { data: existing, error: fetchError } = await db
    .from('credential_registry')
    .select('id')
    .eq('id', credentialId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }

  // Re-derive protected flag if proctor_authority changed
  if (body.proctor_authority !== undefined) {
    body.metadata = {
      ...(body.metadata ?? {}),
      protected: body.proctor_authority === 'elevate',
      credential_owner: body.proctor_authority === 'elevate' ? 'elevate' : (body.issuing_authority ?? ''),
    };
  }

  const { data, error } = await db
    .from('credential_registry')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', credentialId)
    .select()
    .single();

  if (error) {
    logger.error('PATCH credential error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ credential: mapCredentialRow(data as RawCredentialRow) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ credentialId: string }> }
) {
  const { credentialId } = await params;
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();

  // Pre-read: verify credential exists before soft-deleting
  const { data: existing, error: fetchError } = await db
    .from('credential_registry')
    .select('id, is_active')
    .eq('id', credentialId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }

  const { error } = await db
    .from('credential_registry')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', credentialId);

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  logger.info('Credential deactivated', { credentialId, userId: user.id });
  return NextResponse.json({ ok: true });
}
