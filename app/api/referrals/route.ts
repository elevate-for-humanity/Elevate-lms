
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { apiAuthGuard } from '@/lib/authGuards';
import { logger } from '@/lib/logger';
import {
  createReferralCode,
  getReferralCodeByCode,
  getUserReferralCodes,
  trackReferral,
  completeReferral,
  getUserReferrals,
  applyForAffiliate,
  getAffiliateStats,
  processAffiliatePayout,
  getAffiliateLeaderboard,
  applyReferralDiscount,
} from '@/lib/referrals';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'validate':
        const code = searchParams.get('code');
        if (!code) {
          return NextResponse.json({ error: 'code required' }, { status: 400 });
        }
        const referralCode = await getReferralCodeByCode(code);
        return NextResponse.json({
          valid: !!referralCode,
          code: referralCode,
        });

      case 'my-codes':
        const authResult = await apiAuthGuard({ requireAuth: true });
        if (!authResult.authorized) {
          return NextResponse.json(
            { error: authResult.error },
            { status: 401 }
          );
        }
        const codes = await getUserReferralCodes(authResult.user.id);
        return NextResponse.json({ codes });

      case 'my-referrals':
        const authResult2 = await apiAuthGuard({ requireAuth: true });
        if (!authResult2.authorized) {
          return NextResponse.json(
            { error: authResult2.error },
            { status: 401 }
          );
        }
        const status = searchParams.get('status') as any;
        const referrals = await getUserReferrals(authResult2.user.id, status);
        return NextResponse.json({ referrals });

      case 'stats':
        const authResult3 = await apiAuthGuard({ requireAuth: true });
        if (!authResult3.authorized) {
          return NextResponse.json(
            { error: authResult3.error },
            { status: 401 }
          );
        }
        const stats = await getAffiliateStats(authResult3.user.id);
        return NextResponse.json({ stats });

      case 'leaderboard':
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const leaderboard = await getAffiliateLeaderboard(limit);
        return NextResponse.json({ leaderboard });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) { 
    logger.error('Referrals GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;
    const body = await parseBody<Record<string, any>>(request);
    const { action } = body;

    switch (action) {
      case 'create-code':
        const { type, customCode, discountPercentage, commissionPercentage } =
          body;
        const code = await createReferralCode(user.id, type, {
          customCode,
          discountPercentage,
          commissionPercentage,
        });
        return NextResponse.json({ success: true, code });

      case 'track':
        const { referralCode } = body;
        if (!referralCode) {
          return NextResponse.json(
            { error: 'referralCode required' },
            { status: 400 }
          );
        }
        const referral = await trackReferral(referralCode, user.id);
        return NextResponse.json({ success: true, referral });

      case 'apply-affiliate':
        const { website, socialMedia, audience, reason } = body;
        await applyForAffiliate(user.id, {
          website,
          socialMedia,
          audience,
          reason,
        });
        return NextResponse.json({ success: true });

      case 'request-payout':
        const { amount, paymentMethod, paymentDetails } = body;
        if (!amount || !paymentMethod) {
          return NextResponse.json(
            { error: 'amount and paymentMethod required' },
            { status: 400 }
          );
        }
        await processAffiliatePayout(
          user.id,
          amount,
          paymentMethod,
          paymentDetails
        );
        return NextResponse.json({ success: true });

      case 'calculate-discount':
        const { code: discountCode, originalAmount } = body;
        if (!discountCode || !originalAmount) {
          return NextResponse.json(
            { error: 'code and originalAmount required' },
            { status: 400 }
          );
        }
        const discount = await applyReferralDiscount(
          discountCode,
          originalAmount
        );
        return NextResponse.json({ discount });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) { 
    logger.error('Referrals POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/referrals', _GET);
export const POST = withApiAudit('/api/referrals', _POST);
