import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { prepareSSNForStorage } from '@/lib/security/ssn';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface SaveTaxReturnBody {
  taxReturn: Record<string, unknown>;
  currentStep: number;
}

/**
 * Strip full SSNs from the tax return payload before persisting.
 * Replaces each SSN with { ssn_last4, ssn_hash } so the draft
 * never contains plaintext SSNs at rest.
 */
function sanitizeTaxReturnForStorage(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };

  // Taxpayer SSN
  if (typeof sanitized.ssn === 'string' && sanitized.ssn.replace(/\D/g, '').length === 9) {
    const { ssn_hash, ssn_last4 } = prepareSSNForStorage(sanitized.ssn as string);
    sanitized.ssn_hash = ssn_hash;
    sanitized.ssn_last4 = ssn_last4;
    delete sanitized.ssn;
  }

  // Spouse SSN
  if (typeof sanitized.spouseSSN === 'string' && (sanitized.spouseSSN as string).replace(/\D/g, '').length === 9) {
    const { ssn_hash, ssn_last4 } = prepareSSNForStorage(sanitized.spouseSSN as string);
    sanitized.spouse_ssn_hash = ssn_hash;
    sanitized.spouse_ssn_last4 = ssn_last4;
    delete sanitized.spouseSSN;
  }

  // Dependent SSNs
  if (Array.isArray(sanitized.dependents)) {
    sanitized.dependents = (sanitized.dependents as Record<string, unknown>[]).map((dep) => {
      if (typeof dep.ssn === 'string' && (dep.ssn as string).replace(/\D/g, '').length === 9) {
        const { ssn_hash, ssn_last4 } = prepareSSNForStorage(dep.ssn as string);
        const { ssn: _removed, ...rest } = dep;
        return { ...rest, ssn_hash, ssn_last4 };
      }
      return dep;
    });
  }

  return sanitized;
}

async function _POST(request: NextRequest) {
  try {
  // Auth required — Supersonic client data is PII
  const serverSupabase = await createServerClient();
  const { data: { user: authUser }, error: authErr } = await serverSupabase.auth.getUser();
  if (authErr || !authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { taxReturn, currentStep }: SaveTaxReturnBody = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Strip plaintext SSNs — store only hashes + last-4
    const safeReturnData = sanitizeTaxReturnForStorage(taxReturn);

    // Save progress to database
    const { error } = await supabase
      .from('tax_return_drafts')
      .upsert({
        email: taxReturn.email,
        tax_year: 2024,
        current_step: currentStep,
        return_data: safeReturnData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'email,tax_year'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Progress saved successfully',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save tax return' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/supersonic-fast-cash/save-tax-return', _POST);
