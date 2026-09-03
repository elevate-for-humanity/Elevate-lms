import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getRequiredAgreements } from '@/lib/legal/requiredAgreements';
import { recordAgreementAcceptance } from '@/lib/legal/recordAgreementAcceptance';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { agreement_type, document_version } = await req.json();

    if (!agreement_type || !document_version) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Get user profile for role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role,full_name')
      .eq('id', user.id)
      .maybeSingle();

    const allowed = getRequiredAgreements(profile?.role || 'student').find(
      (item) => item.type === agreement_type && item.version === document_version,
    );
    if (!allowed || !user.email) return NextResponse.json({ error: 'Agreement is not required for this account' }, { status: 400 });
    const result = await recordAgreementAcceptance({
      supabase,
      userId: user.id,
      userEmail: user.email,
      userRole: profile?.role || 'student',
      agreementType: allowed.type,
      documentVersion: allowed.version,
      signerName: profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0],
      signerEmail: user.email,
      signatureMethod: 'checkbox',
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      context: 'learner_portal',
    });
    if (!result.success) return NextResponse.json({ error: result.error || 'Failed to save agreement' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error('Accept agreement failed', err instanceof Error ? err : undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
