import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { STANDARD_DEDUCTION_2026 } from '@/lib/tax-software/calculation/ty2026-base-1040';
export async function GET() {
  const s = await createClient(); const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await s.from('tax_returns').select('id,tax_year,filing_status,status').eq('created_by_user_id', user.id).eq('service_type', 'self_file').order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Unable to load returns' }, { status: 500 });
  return NextResponse.json({ returns: data ?? [] });
}
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api'); if (limited) return limited;
  const s = await createClient(); const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b || b.taxYear !== 2026 || !Object.prototype.hasOwnProperty.call(STANDARD_DEDUCTION_2026, b.filingStatus)) return NextResponse.json({ error: 'Select tax year 2026 and a valid filing status' }, { status: 400 });
  const { data, error } = await s.from('tax_returns').insert({ created_by_user_id: user.id, tax_year: b.taxYear, filing_status: b.filingStatus, service_type: 'self_file', status: 'in_progress', return_json: {} }).select('id').single();
  if (error) return NextResponse.json({ error: 'Unable to start return' }, { status: 500 });
  return NextResponse.json({ success: true, returnId: data.id }, { status: 201 });
}
