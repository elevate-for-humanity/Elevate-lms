import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { taxJson } from '@/lib/tax-software/server/response';
import {
  scheduleCBusinessSchema,
  scheduleCToRow,
} from '@/lib/tax-software/calculation/schedule-c-2026';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const idSchema = z.string().uuid();
const payload = z
  .object({
    returnId: idSchema,
    businessId: idSchema.optional(),
    expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
    business: scheduleCBusinessSchema,
  })
  .strict();
export async function GET(req: NextRequest) {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) return taxJson({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('returnId');
  if (!idSchema.safeParse(id).success)
    return taxJson({ error: 'A return is required' }, { status: 400 });
  const { data: r, error } = await s
    .from('tax_returns')
    .select('id')
    .eq('id', id)
    .eq('created_by_user_id', user.id)
    .eq('service_type', 'self_file')
    .maybeSingle();
  if (error) return taxJson({ error: 'Unable to load return' }, { status: 500 });
  if (!r) return taxJson({ error: 'Return not found' }, { status: 404 });
  const rows = await s
    .from('tax_schedule_c')
    .select('*')
    .eq('tax_return_id', r.id)
    .order('created_at', { ascending: true });
  if (rows.error) return taxJson({ error: 'Unable to load business records' }, { status: 500 });
  return taxJson({ businesses: rows.data ?? [] });
}
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) return taxJson({ error: 'Unauthorized' }, { status: 401 });
  const parsed = payload.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return taxJson(
      { error: parsed.error.issues[0]?.message ?? 'Check the business worksheet' },
      { status: 400 },
    );
  const b = parsed.data;
  if (b.businessId && !b.expectedUpdatedAt)
    return taxJson({ error: 'Reload the business record before saving' }, { status: 400 });
  const { data: r, error } = await s
    .from('tax_returns')
    .select('id,tax_year,filing_status,return_json,updated_at')
    .eq('id', b.returnId)
    .eq('created_by_user_id', user.id)
    .eq('service_type', 'self_file')
    .maybeSingle();
  if (error) return taxJson({ error: 'Unable to load return' }, { status: 500 });
  if (!r) return taxJson({ error: 'Return not found' }, { status: 404 });
  if (Number(r.tax_year) !== 2026)
    return taxJson({ error: 'This worksheet is for tax year 2026' }, { status: 400 });
  if (b.business.owner === 'spouse' && r.filing_status !== 'married_joint')
    return taxJson({ error: 'Spouse business income requires a joint return' }, { status: 400 });
  const row = { ...scheduleCToRow(b.business), updated_at: new Date().toISOString() };
  const write = b.businessId
    ? s
        .from('tax_schedule_c')
        .update(row)
        .eq('id', b.businessId)
        .eq('tax_return_id', r.id)
        .eq('updated_at', b.expectedUpdatedAt!)
    : s.from('tax_schedule_c').insert({ ...row, tax_return_id: r.id });
  const { data: saved, error: writeError } = await write.select('id,updated_at').maybeSingle();
  if (writeError)
    return taxJson({ error: 'Unable to save the business worksheet' }, { status: 500 });
  if (!saved)
    return taxJson({ error: 'This business changed. Reload before saving.' }, { status: 409 });
  const json = { ...r.return_json };
  delete json.calculation;
  const invalidate = await s
    .from('tax_returns')
    .update({ return_json: json, updated_at: new Date().toISOString() })
    .eq('id', r.id)
    .eq('created_by_user_id', user.id)
    .eq('service_type', 'self_file')
    .eq('updated_at', r.updated_at)
    .select('id')
    .maybeSingle();
  if (invalidate.error || !invalidate.data)
    return taxJson(
      {
        error: 'Business saved. Reload and recalculate the changed return before signing.',
        businessSaved: true,
      },
      { status: 409 },
    );
  return taxJson({ success: true, businessId: saved.id, updatedAt: saved.updated_at });
}
export async function DELETE(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) return taxJson({ error: 'Unauthorized' }, { status: 401 });
  const parsed = z
    .object({
      returnId: idSchema,
      businessId: idSchema,
      expectedUpdatedAt: z.string().datetime({ offset: true }),
    })
    .strict()
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return taxJson({ error: 'Reload the business record before removing it' }, { status: 400 });
  const b = parsed.data;
  const { data: r, error } = await s
    .from('tax_returns')
    .select('id')
    .eq('id', b.returnId)
    .eq('created_by_user_id', user.id)
    .eq('service_type', 'self_file')
    .maybeSingle();
  if (error) return taxJson({ error: 'Unable to load return' }, { status: 500 });
  if (!r) return taxJson({ error: 'Return not found' }, { status: 404 });
  const removed = await s
    .from('tax_schedule_c')
    .delete()
    .eq('id', b.businessId)
    .eq('tax_return_id', r.id)
    .eq('updated_at', b.expectedUpdatedAt)
    .select('id')
    .maybeSingle();
  if (removed.error) return taxJson({ error: 'Unable to remove business' }, { status: 500 });
  if (!removed.data)
    return taxJson({ error: 'Business changed. Reload before removing it.' }, { status: 409 });
  return taxJson({ success: true, recalculateRequired: true });
}
