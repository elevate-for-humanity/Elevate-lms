import { taxJson } from '@/lib/tax-software/server/response';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { federalInputSchema } from '@/lib/tax-software/calculation/input-schema';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) return taxJson({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null),
    parsed = federalInputSchema.safeParse(body?.inputs);
  if (typeof body?.returnId !== 'string' || !parsed.success)
    return taxJson({ error: 'Check the income, deduction and payment fields.' }, { status: 400 });
  const { data: r, error } = await s
    .from('tax_returns')
    .select('id,return_json,updated_at')
    .eq('id', body.returnId)
    .eq('created_by_user_id', user.id)
    .eq('service_type', 'self_file')
    .maybeSingle();
  if (error) return taxJson({ error: 'Unable to load return' }, { status: 500 });
  if (!r) return taxJson({ error: 'Return not found' }, { status: 404 });
  const json = { ...r.return_json, federalInputs: parsed.data };
  delete json.calculation;
  const { data: saved, error: writeError } = await s
    .from('tax_returns')
    .update({ return_json: json, updated_at: new Date().toISOString() })
    .eq('id', r.id)
    .eq('created_by_user_id', user.id)
    .eq('service_type', 'self_file')
    .eq('updated_at', r.updated_at)
    .select('id')
    .maybeSingle();
  if (writeError) return taxJson({ error: 'Unable to save federal forms' }, { status: 500 });
  if (!saved)
    return taxJson({ error: 'The return changed. Reload before saving.' }, { status: 409 });
  return taxJson(
    { success: true, inputs: parsed.data },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
