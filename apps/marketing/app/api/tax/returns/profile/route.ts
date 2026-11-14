import { taxJson } from '@/lib/tax-software/server/response';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { taxPrivateProfileSchema } from '@/lib/tax-software/security/profile-schema';
import { getSecrets } from '@/lib/secrets';
import { sealTaxPrivateFields } from '@/lib/tax-software/security/encryption';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) return taxJson({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null),
    parsed = taxPrivateProfileSchema.safeParse(body?.privateFields);
  if (typeof body?.returnId !== 'string' || !parsed.success)
    return taxJson({ error: 'Check the taxpayer, signature and refund fields.' }, { status: 400 });
  const { data: r, error } = await s
    .from('tax_returns')
    .select('id,filing_status,return_json,updated_at')
    .eq('id', body.returnId)
    .eq('created_by_user_id', user.id)
    .eq('service_type', 'self_file')
    .maybeSingle();
  if (error) return taxJson({ error: 'Unable to load return' }, { status: 500 });
  if (!r) return taxJson({ error: 'Return not found' }, { status: 404 });
  if (
    r.filing_status === 'married_joint' &&
    (!parsed.data.profile.spouse || !parsed.data.signature.spousePin)
  )
    return taxJson(
      { error: 'Include spouse details and signature for a joint return.' },
      { status: 400 },
    );
  if (!r.return_json?.calculation?.calculationDigest || !r.return_json?.calculation?.sourceDigest)
    return taxJson(
      { error: 'Calculate and review your return before authorizing the signature.' },
      { status: 422 },
    );
  let encrypted: string;
  try {
    const keys = await getSecrets(['TAX_DATA_ENCRYPTION_KEY', 'SSN_ENCRYPTION_KEY']);
    encrypted = sealTaxPrivateFields(
      {
        ...parsed.data,
        authorizedCalculationDigest: r.return_json.calculation.calculationDigest,
        authorizedSourceDigest: r.return_json.calculation.sourceDigest,
      },
      user.id,
      r.id,
      keys.TAX_DATA_ENCRYPTION_KEY ?? keys.SSN_ENCRYPTION_KEY,
    );
  } catch {
    return taxJson(
      { error: 'Secure taxpayer storage is unavailable. Your private information was not saved.' },
      { status: 503 },
    );
  }
  const { data: saved, error: writeError } = await s
    .from('tax_returns')
    .update({
      return_json: {
        ...r.return_json,
        privateFieldsEncrypted: encrypted,
        privateProfileComplete: true,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', r.id)
    .eq('created_by_user_id', user.id)
    .eq('service_type', 'self_file')
    .eq('updated_at', r.updated_at)
    .select('id')
    .maybeSingle();
  if (writeError) return taxJson({ error: 'Unable to save taxpayer details' }, { status: 500 });
  if (!saved)
    return taxJson({ error: 'The return changed. Reload before saving.' }, { status: 409 });
  return taxJson({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
