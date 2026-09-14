import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import {
  configureProgramHolderPayoutAccount,
  getProgramHolderPayoutAccount,
  payoutProviderUrl,
} from '@/lib/program-holder/payout-account';
import { getProgramHolderPaymentReadiness } from '@/lib/program-holder/onboarding-readiness';

export const dynamic = 'force-dynamic';

async function context() {
  const ctx = await requireProgramHolder();
  return ctx.mode === 'holder' ? ctx : null;
}

export async function GET() {
  const ctx = await context();
  if (!ctx) {
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  }

  const [account, onboarding] = await Promise.all([
    getProgramHolderPayoutAccount(ctx),
    getProgramHolderPaymentReadiness(ctx.db, ctx.holderId),
  ]);

  return NextResponse.json({
    ...account,
    onboardingReady: onboarding.ready,
    missingRequirements: onboarding.missing,
  });
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'payment');
  if (limited) return limited;

  const ctx = await context();
  if (!ctx) {
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { action?: string };

  try {
    if (body.action === 'configure') {
      return NextResponse.json(await configureProgramHolderPayoutAccount(ctx));
    }

    if (body.action !== 'onboard' && body.action !== 'dashboard') {
      return NextResponse.json({ error: 'Unsupported payout action.' }, { status: 400 });
    }

    const account = await getProgramHolderPayoutAccount(ctx);
    if (!account.provider) {
      await configureProgramHolderPayoutAccount(ctx);
    }

    const url = await payoutProviderUrl(body.action);
    if (!url) {
      return NextResponse.json(
        {
          error:
            'Your QuickBooks banking invitation is being prepared. Elevate will send the secure setup link.',
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ url });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : 'Unable to configure QuickBooks payouts.' },
      { status: 500 },
    );
  }
}
