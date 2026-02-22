import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    // Check if already signed
    const { data: existing } = await supabase
      .from('mou_signatures')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'MOU already signed', signature_id: existing.id }, { status: 409 });
    }

    // Store signature
    const { data: signature, error: sigError } = await supabase
      .from('mou_signatures')
      .insert({
        user_id: user.id,
        signer_name: signerName,
        signer_title: signerTitle,
        signature_data_url: signatureDataUrl,
        signed_at: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
      .select('id')
      .single();

    if (sigError) {
      logger.error('MOU signature storage failed', sigError);
      return NextResponse.json({ error: 'Failed to record signature' }, { status: 500 });
    }

    // Update program holder onboarding status
    await supabase
      .from('profiles')
      .update({ mou_signed: true, mou_signed_at: new Date().toISOString() })
      .eq('id', user.id);

    return NextResponse.json({ success: true, signature_id: signature.id });
  } catch (error) {
    logger.error('MOU signing error', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
