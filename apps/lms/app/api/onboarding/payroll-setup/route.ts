import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await parseBody<Record<string, any>>(request);
    const {
      payoutMethod,
      taxIdUploaded,
      bankName,
      accountType,
      routingNumber,
      accountNumber,
      w9FileUrl,
      role,
      paymentType,
      rate,
    } = body;

    if (!payoutMethod) {
      return NextResponse.json({ error: 'payoutMethod is required' }, { status: 400 });
    }

    const db = await requireAdminClient();

    const { data: existing } = await db
      .from('payroll_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const profileData: Record<string, any> = {
      user_id: user.id,
      payout_method: payoutMethod,
      tax_id_uploaded: taxIdUploaded ?? false,
      status: 'PENDING',
      direct_deposit_enabled: payoutMethod === 'DIRECT_DEPOSIT',
    };

    if (bankName)       profileData.bank_name = bankName;
    if (accountType)    profileData.account_type = accountType;
    if (routingNumber)  profileData.routing_number = routingNumber;
    if (accountNumber)  profileData.account_number_encrypted = accountNumber;
    if (w9FileUrl)      { profileData.w9_file_url = w9FileUrl; profileData.w9_uploaded_at = new Date().toISOString(); }
    if (paymentType)    profileData.payment_type = paymentType;
    if (rate)           profileData.rate = parseFloat(rate);
    if (role)           profileData.role = role;

    if (existing?.id) {
      await db.from('payroll_profiles').update(profileData).eq('id', existing.id);
    } else {
      await db.from('payroll_profiles').insert(profileData);
    }

    // Write w9_submissions row if a W-9 was uploaded
    if (w9FileUrl) {
      const { data: ph } = await db
        .from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      await db.from('w9_submissions').upsert(
        { user_id: user.id, file_url: w9FileUrl, legal_name: ph?.full_name ?? null,
          submitted_at: new Date().toISOString(), verified: false },
        { onConflict: 'user_id', ignoreDuplicates: false },
      ).then(()=>null, ()=>null);
    }

    await db.from('audit_logs').insert({
      user_id: user.id,
      action: 'payroll_setup_submitted',
      entity_type: 'payroll_profiles',
      metadata: { payoutMethod, taxIdUploaded, bankName, paymentType },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    }).then(()=>null, ()=>null);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/onboarding/payroll-setup', _POST);
