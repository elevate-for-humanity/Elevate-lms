import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('hr_employees')
    .select('id, pay_rate_cents, pay_type, effective_date')
    .eq('id', params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { pay_rate_cents, pay_type, effective_date } = await request.json();
  if (!pay_rate_cents) return NextResponse.json({ error: 'pay_rate_cents required' }, { status: 400 });

  const db = await requireAdminClient();
  const { error } = await db
    .from('hr_employees')
    .update({
      pay_rate_cents,
      pay_type: pay_type ?? 'hourly',
      effective_date: effective_date ?? new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
