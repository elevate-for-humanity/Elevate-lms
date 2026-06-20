import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const ALLOWED_ACTIONS = ['approve', 'suspend', 'reject', 'activate'] as const;
type Action = typeof ALLOWED_ACTIONS[number];

const STATUS_MAP: Record<Action, string> = {
  approve: 'approved',
  activate: 'active',
  suspend: 'suspended',
  reject: 'rejected',
};

export async function POST(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const action = params.action as Action;
  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = await requireAdminClient();
  const { error } = await db
    .from('marketplace_creators')
    .update({ status: STATUS_MAP[action], updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, status: STATUS_MAP[action] });
}
