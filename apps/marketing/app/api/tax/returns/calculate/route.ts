import { taxReturnSourceDigest } from '@/lib/tax-software/security/return-digest';
import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  STANDARD_DEDUCTION_2026,
  type FilingStatus,
} from '@/lib/tax-software/calculation/ty2026-base-1040';
import { calculateFederal1040_2026 } from '@/lib/tax-software/calculation/federal-1040-2026';
import { prepareStoredFederalReturn2026 } from '@/lib/tax-software/calculation/financial-inputs';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const returnId = body?.returnId;
  if (typeof returnId !== 'string' || !returnId.trim())
    return NextResponse.json({ error: 'returnId is required' }, { status: 400 });
  const { data: r, error: returnError } = await supabase
    .from('tax_returns')
    .select('id,created_by_user_id,filing_status,tax_year,return_json')
    .eq('id', returnId)
    .eq('created_by_user_id', user.id)
    .eq('service_type', 'self_file')
    .maybeSingle();
  if (returnError)
    return NextResponse.json({ error: 'Unable to load tax return' }, { status: 500 });
  if (!r) return NextResponse.json({ error: 'Return not found' }, { status: 404 });
  if (Number(r.tax_year) !== 2026)
    return NextResponse.json(
      { error: 'This calculation engine is for tax year 2026' },
      { status: 400 },
    );
  if (!Object.prototype.hasOwnProperty.call(STANDARD_DEDUCTION_2026, r.filing_status))
    return NextResponse.json(
      { error: 'Select a supported filing status before calculating' },
      { status: 400 },
    );
  const sources = await Promise.all([
    supabase.from('tax_w2_income').select('*').eq('tax_return_id', returnId),
    supabase
      .from('tax_1099_income')
      .select('form_type,amount,federal_withholding')
      .eq('tax_return_id', returnId),
    supabase.from('tax_schedule_c').select('net_profit').eq('tax_return_id', returnId),
    supabase
      .from('tax_itemized_deductions')
      .select('total_itemized')
      .eq('tax_return_id', returnId)
      .maybeSingle(),
  ]);
  if (sources.some((source) => source.error))
    return NextResponse.json({ error: 'Unable to load all calculation inputs' }, { status: 500 });
  const [{ data: w2 }, { data: i1099 }, { data: sc }, { data: itemized }] = sources;
  const validAmount = (value: unknown) =>
    value !== null &&
    value !== undefined &&
    String(value).trim() !== '' &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0;
  if (
    (w2 || []).some(
      (row) => !validAmount(row.wages) || !validAmount(row.federal_withholding ?? 0),
    ) ||
    (i1099 || []).some(
      (row) => !validAmount(row.amount) || !validAmount(row.federal_withholding ?? 0),
    )
  ) {
    return NextResponse.json(
      { error: 'Confirm valid, nonnegative income and withholding amounts before calculating.' },
      { status: 422 },
    );
  }
  let result: ReturnType<typeof calculateFederal1040_2026>;
  try {
    result = prepareStoredFederalReturn2026({
      filingStatus: r.filing_status as FilingStatus,
      extra: r.return_json?.federalInputs,
      w2: w2 ?? [],
      income1099: i1099 ?? [],
      scheduleC: sc ?? [],
      itemized: itemized ?? null,
    }).calculation;
  } catch {
    return NextResponse.json(
      { error: 'Check the saved income, dividend and deduction amounts before calculating.' },
      { status: 422 },
    );
  }
  const estimateMetadata = {
    sourceDigest: taxReturnSourceDigest({
      filingStatus: r.filing_status,
      supportingDocuments: r.return_json?.irsSupportingDocuments ?? {},
      extra: r.return_json?.federalInputs ?? {},
      w2: w2 ?? [],
      income1099: i1099 ?? [],
      scheduleC: sc ?? [],
      itemized: itemized ?? null,
    }),
    calculationVersion: 'ty2026-federal-1040-v3',
    calculationDigest: createHash('sha256').update(JSON.stringify(result)).digest('hex'),
    scope: 'federal_1040_draft',
    filingReady: false,
    reviewRequired: [
      'Confirm all required forms, credit eligibility and signature information before filing.',
    ],
    excludedCalculations: ['state returns'],
  };
  const { error: calculationError } = await supabase.from('tax_calculations').insert({
    user_id: user.id,
    tax_year: 2026,
    filing_status: r.filing_status,
    total_income: result.totalIncome,
    adjusted_gross_income: result.adjustedGrossIncome,
    taxable_income: result.taxableIncome,
    federal_tax: result.incomeTax,
    total_tax: result.totalTax,
    federal_withholding: result.federalWithholding,
    estimated_refund: result.refundAmount,
    is_refund: result.refundAmount > 0,
    calculation_data: { ...result, returnId, ...estimateMetadata },
  });
  if (calculationError)
    return NextResponse.json({ error: 'Unable to save calculation' }, { status: 500 });
  const { data: savedReturn, error: saveError } = await supabase
    .from('tax_returns')
    .update({
      return_json: {
        ...r.return_json,
        calculation: { ...result, ...estimateMetadata },
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', returnId)
    .eq('created_by_user_id', user.id)
    .eq('service_type', 'self_file')
    .select('id')
    .maybeSingle();
  if (saveError || !savedReturn)
    return NextResponse.json({ error: 'Unable to save calculated return' }, { status: 500 });
  return NextResponse.json(
    { success: true, result, ...estimateMetadata },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
