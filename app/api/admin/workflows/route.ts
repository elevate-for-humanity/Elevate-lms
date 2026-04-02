import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authGuards';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  await requireAdmin();
  const db = createAdminClient();
  const { data, error } = await db.from('workflows').select('*').order('updated_at', { ascending: false });
  if (error) return safeDbError(error, 'Failed to fetch workflows');
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  await requireAdmin();
  const db = createAdminClient();
  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  const { data, error } = await db
    .from('workflows')
    .insert({
      name: body.name,
      workflow_key: body.workflow_key ?? null,
      category: body.category ?? 'operations',
      status: body.status ?? 'inactive',
      metadata: body.metadata ?? {},
    })
    .select()
    .single();
  if (error) return safeDbError(error, 'Failed to create workflow');
  return NextResponse.json({ data }, { status: 201 });
}
