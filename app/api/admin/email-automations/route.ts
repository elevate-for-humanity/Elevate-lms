import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  try { await apiRequireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const db = await getAdminClient();
  const { data, error } = await db.from('email_automations').select('*').order('updated_at', { ascending: false });
  if (error) return safeDbError(error, 'Failed to fetch automations');
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  try { await apiRequireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const db = await getAdminClient();
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.trigger_type) {
    return NextResponse.json({ error: 'name and trigger_type are required' }, { status: 400 });
  }
  const { data, error } = await db
    .from('email_automations')
    .insert({
      name: body.name,
      slug: body.slug ?? null,
      trigger_type: body.trigger_type,
      audience_type: body.audience_type ?? 'mixed',
      is_active: Boolean(body.is_active),
      provider: body.provider ?? 'sendgrid',
      metadata: body.metadata ?? {},
    })
    .select()
    .single();
  if (error) return safeDbError(error, 'Failed to create automation');
  return NextResponse.json({ data }, { status: 201 });
}
