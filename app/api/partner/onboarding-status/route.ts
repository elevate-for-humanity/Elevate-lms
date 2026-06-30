import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getHostShopOnboardingPaths, resolveHostShopProgram } from '@/lib/partners/host-shop-onboarding';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ completed: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { data: partnerUser, error: partnerError } = await supabase
      .from('partner_users')
      .select(
        'partner_id, partners(id, name, shop_name, partner_type, program_type, programs, onboarding_completed, mou_signed, documents_verified, status, approval_status)',
      )
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    const partner = partnerUser?.partners as unknown as Record<string, unknown> | null | undefined;
    if (partnerError || !partner) {
      return NextResponse.json({
        completed: false,
        step: 'not_started',
        message: 'No partner profile found',
      });
    }

    const program = resolveHostShopProgram(partner);
    const paths = getHostShopOnboardingPaths(program);
    const mouSigned = partner.mou_signed === true;
    const onboardingCompleted = partner.onboarding_completed === true;
    const documentsVerified = partner.documents_verified === true;
    const isCompleted = onboardingCompleted && documentsVerified && partner.status === 'active';

    const step = !mouSigned
      ? 'mou'
      : !onboardingCompleted
        ? 'forms'
        : !documentsVerified
          ? 'documents'
          : 'complete';

    return NextResponse.json({
      completed: isCompleted,
      step,
      shopName: partner.shop_name || partner.name,
      status: partner.status,
      approvalStatus: partner.approval_status,
      mouSigned,
      onboardingCompleted,
      documentsVerified,
      paths,
    });
  } catch (error) {
    logger.error('Error checking onboarding status:', error);
    return NextResponse.json({ completed: false, error: 'Server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/partner/onboarding-status', _GET);
