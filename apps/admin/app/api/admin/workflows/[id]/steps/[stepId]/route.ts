import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> },
) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { stepId } = await params;
  const db = await requireAdminClient();
  const { error } = await db.from('workflow_steps').delete().eq('id', stepId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> },
) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { stepId } = await params;
  const body = await request.json();
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('workflow_steps')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', stepId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ step: data });
}
