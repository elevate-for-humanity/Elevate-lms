import { taxReturnSourceDigest } from '@/lib/tax-software/security/return-digest';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { taxJson } from '@/lib/tax-software/server/response';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { createClient } from '@/lib/supabase/server';
import { getSecrets } from '@/lib/secrets';
import { getClientIp } from '@/lib/api/get-client-ip';
import { openTaxPrivateFields } from '@/lib/tax-software/security/encryption';
import type { TaxPrivateProfile } from '@/lib/tax-software/security/profile-schema';
import { prepareStoredFederalReturn2026 } from '@/lib/tax-software/calculation/financial-inputs';
import type { FilingStatus } from '@/lib/tax-software/calculation/ty2026-base-1040';
import { mapFederalReturn2026 } from '@/lib/tax-software/mef/return-xml';
import { serializeMefReturn2026 } from '@/lib/tax-software/mef/serialize-return';
import { validateLocalMefRules } from '@/lib/tax-software/mef/business-rules';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) return taxJson({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('returnId');
  if (!id) return taxJson({ error: 'returnId is required' }, { status: 400 });
  const { data: r, error } = await s
    .from('tax_returns')
    .select('id,tax_year,filing_status,return_json')
    .eq('id', id)
    .eq('created_by_user_id', user.id)
    .eq('service_type', 'self_file')
    .maybeSingle();
  if (error) return taxJson({ error: 'Unable to load return' }, { status: 500 });
  if (!r) return taxJson({ error: 'Return not found' }, { status: 404 });
  if (Number(r.tax_year) !== 2026)
    return taxJson({ error: 'Select a tax year 2026 return.' }, { status: 400 });
  if (!r.return_json?.privateFieldsEncrypted)
    return taxJson(
      { error: 'Save taxpayer details and signature before exporting.' },
      { status: 422 },
    );
  const keys = await getSecrets([
    'IRS_SOFTWARE_ID',
    'IRS_EFIN',
    'TAX_DATA_ENCRYPTION_KEY',
    'SSN_ENCRYPTION_KEY',
  ]);
  if (!keys.IRS_SOFTWARE_ID || !keys.IRS_EFIN)
    return taxJson(
      { error: 'Configure the IRS-issued Software ID and EFIN before generating a filing export.' },
      { status: 503 },
    );
  let privateFields: TaxPrivateProfile & {
    authorizedCalculationDigest: string;
    authorizedSourceDigest: string;
  };
  try {
    privateFields = openTaxPrivateFields(
      r.return_json.privateFieldsEncrypted,
      user.id,
      r.id,
      keys.TAX_DATA_ENCRYPTION_KEY ?? keys.SSN_ENCRYPTION_KEY,
    );
  } catch {
    return taxJson({ error: 'Unable to open secure taxpayer details.' }, { status: 503 });
  }
  const sources = await Promise.all([
    s.from('tax_w2_income').select('*').eq('tax_return_id', id),
    s
      .from('tax_1099_income')
      .select('form_type,amount,federal_withholding')
      .eq('tax_return_id', id),
    s.from('tax_schedule_c').select('net_profit').eq('tax_return_id', id),
    s
      .from('tax_itemized_deductions')
      .select('total_itemized')
      .eq('tax_return_id', id)
      .maybeSingle(),
  ]);
  if (sources.some((v) => v.error))
    return taxJson({ error: 'Unable to load all return documents.' }, { status: 500 });
  const [w2, income, sc, itemized] = sources;
  try {
    const sourceDigest = taxReturnSourceDigest({
      filingStatus: r.filing_status,
      supportingDocuments: r.return_json?.irsSupportingDocuments ?? {},
      extra: r.return_json?.federalInputs ?? {},
      w2: w2.data ?? [],
      income1099: income.data ?? [],
      scheduleC: sc.data ?? [],
      itemized: itemized.data ?? null,
    });
    const prepared = prepareStoredFederalReturn2026({
      filingStatus: r.filing_status as FilingStatus,
      extra: r.return_json.federalInputs,
      w2: w2.data ?? [],
      income1099: income.data ?? [],
      scheduleC: sc.data ?? [],
      itemized: itemized.data,
    });
    const digest = createHash('sha256').update(JSON.stringify(prepared.calculation)).digest('hex');
    if (
      digest !== privateFields.authorizedCalculationDigest ||
      sourceDigest !== privateFields.authorizedSourceDigest
    )
      return taxJson(
        {
          error:
            'Your return changed after signature authorization. Review the calculation and sign again.',
        },
        { status: 409 },
      );
    const ip = getClientIp(req);
    if (!isIP(ip))
      return taxJson(
        { error: 'Unable to capture the filing connection address. Try again from your browser.' },
        { status: 422 },
      );
    const mapped = mapFederalReturn2026({
      profile: privateFields.profile,
      financial: prepared.financial,
      w2: (w2.data ?? []).map((w) => ({
        owner: w.income_owner === 'spouse' ? 'spouse' : 'primary',
        wages: Number(w.wages),
        federalWithholding: Number(w.federal_withholding ?? 0),
        socialSecurityWages: Number(w.social_security_wages ?? w.wages),
        socialSecurityTax: Number(w.social_security_tax ?? 0),
        medicareWages: Number(w.medicare_wages ?? w.wages),
        medicareTaxWithheld: Number(w.medicare_tax ?? 0),
        employerEin: w.employer_ein,
        employerName: w.employer_name,
        employerAddress: {
          line1: w.employer_address_street ?? '',
          city: w.employer_address_city ?? '',
          state: w.employer_address_state ?? '',
          zip: w.employer_address_zip ?? '',
        },
      })),
      configuration: {
        softwareId: keys.IRS_SOFTWARE_ID,
        efin: keys.IRS_EFIN,
        createdAt: new Date().toISOString(),
        publicIp: ip,
        ...privateFields.signature,
      },
      refundAllocations: privateFields.refundAllocations,
      additionalIrsDocuments: r.return_json.irsSupportingDocuments ?? {},
    });
    const checks = validateLocalMefRules(mapped.irsFields);
    if (checks.issues.length)
      return taxJson(
        { error: 'Review the return before export.', issues: checks.issues },
        { status: 422 },
      );
    const xml = serializeMefReturn2026(mapped.irsFields);
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': 'attachment; filename="federal-return-2026.xml"',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Tax-Transmission-Status': 'not-submitted',
      },
    });
  } catch {
    return taxJson(
      {
        error:
          'Complete and review taxpayer details, wage addresses and supporting forms before exporting.',
      },
      { status: 422 },
    );
  }
}
