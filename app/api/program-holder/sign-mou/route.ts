import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { signatureDataUrl, signerName, signerTitle } = await request.json();

    if (!signatureDataUrl || !signerName || !signerTitle) {
      return NextResponse.json({ error: 'Signature, name, and title are required' }, { status: 400 });
    }

    // Check if already signed — keyed on signer_name + program_holder row
    const admin = await getAdminClient();
    const { data: holderRow } = await admin
      .from('program_holders')
      .select('id, mou_signed')
      .eq('user_id', user.id)
      .maybeSingle();

    if (holderRow?.mou_signed) {
      return NextResponse.json({ error: 'MOU already signed' }, { status: 409 });
    }

    // Store signature — use live schema columns only
    const { data: signature, error: sigError } = await supabase
      .from('mou_signatures')
      .insert({
        signer_name: signerName,
        signer_title: signerTitle,
        signature_data: signatureDataUrl,   // live column name
        signed_at: new Date().toISOString(),
        agreed_at: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        mou_version: '2025-01',
      })
      .select('id')
      .single();

    if (sigError) {
      logger.error('MOU signature storage failed', sigError);
      return NextResponse.json({ error: 'Failed to record signature' }, { status: 500 });
    }

    const now = new Date().toISOString();

    // Update program_holders — canonical MOU state lives here
    if (admin) {
      await admin
        .from('program_holders')
        .update({
          mou_signed: true,
          mou_signed_at: now,
          mou_status: 'holder_signed',
          status: 'active',
        })
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true, signature_id: signature.id });
  } catch (error) {
    logger.error('MOU signing error', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/program-holder/sign-mou', _POST);
