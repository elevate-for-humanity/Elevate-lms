import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  if (![...(auth.effectiveRoles || []), auth.role].some(role => role === 'admin' || role === 'super_admin')) return NextResponse.json({ error: 'Payroll administrator access required.' }, { status: 403 });
  const db = await requireAdminClient();
  const { data, error } = await db.from('payroll_runs').select('id,pay_period_start,pay_period_end,pay_date,status,employee_count,total_gross,total_net,total_taxes').order('pay_date', { ascending: false }).limit(1000);
  if (error) return NextResponse.json({ error: 'Payroll records could not be exported.' }, { status: 503 });
  const columns = ['id','pay_period_start','pay_period_end','pay_date','status','employee_count','total_gross','total_net','total_taxes'];
  const cell = (value: unknown) => { const text = String(value ?? ''); return `"${(/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`; };
  const csv = [columns.join(','), ...(data || []).map(row => columns.map(key => cell((row as Record<string, unknown>)[key])).join(','))].join('\r\n');
  return new Response(csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="payroll-runs-latest-1000.csv"', 'cache-control': 'private, no-store' } });
}
