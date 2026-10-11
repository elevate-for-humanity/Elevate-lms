import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { deriveInterviewTriggers, PARIS_SECTIONS } from '@/lib/tax-software/paris-interview';
export async function GET(req: NextRequest) {
  const s = await createClient(); const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('returnId');
  if (!id) return NextResponse.json({ error: 'returnId is required' }, { status: 400 });
  const { data, error } = await s.from('tax_returns').select('id,tax_year,filing_status,status,return_json,updated_at').eq('id', id).eq('created_by_user_id', user.id).eq('service_type', 'self_file').maybeSingle();
  if (error) return NextResponse.json({ error: 'Unable to load return' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Return not found' }, { status: 404 });
  const { data: w2, error: w2Error } = await s.from('tax_w2_income').select('id,employer_name,wages,federal_withholding').eq('tax_return_id', id);
  if (w2Error) return NextResponse.json({ error: 'Unable to load W-2 records' }, { status: 500 });
  return NextResponse.json({ taxReturn: data, session: data.return_json?.interview ?? null, w2: w2 ?? [] });
}
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api'); if (limited) return limited;
  const s = await createClient(); const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b || typeof b.returnId !== 'string' || !b.answers || typeof b.answers !== 'object' || Array.isArray(b.answers)) return NextResponse.json({ error: 'Return and answers are required' }, { status: 400 });
  const { data: r, error: readError } = await s.from('tax_returns').select('id,return_json,updated_at').eq('id', b.returnId).eq('created_by_user_id', user.id).eq('service_type', 'self_file').maybeSingle();
  if (readError) return NextResponse.json({ error: 'Unable to load return' }, { status: 500 });
  if (!r) return NextResponse.json({ error: 'Return not found' }, { status: 404 });
  const session = { answers: b.answers, activeTriggers: deriveInterviewTriggers(b.answers), completedSections: (Array.isArray(b.completedSections) ? b.completedSections : []).filter((v: any) => PARIS_SECTIONS.includes(v)), updatedAt: new Date().toISOString() };
  const { data, error } = await s.from('tax_returns').update({ return_json: { ...r.return_json, interview: session }, updated_at: session.updatedAt }).eq('id', r.id).eq('created_by_user_id', user.id).eq('service_type', 'self_file').eq('updated_at', r.updated_at).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Unable to save interview' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'The return changed. Reload before saving.' }, { status: 409 });
  return NextResponse.json({ success: true, session });
}
