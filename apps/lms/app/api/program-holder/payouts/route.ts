import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { ensureProgramHolderPayoutAccount, syncProgramHolderPayoutAccount } from '@/lib/program-holder/payout-account';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getStripe, stripeCall } from '@/lib/stripe/client';

export const dynamic = 'force-dynamic';
const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, '');
async function holderContext() { const ctx = await requireProgramHolder(); return ctx.mode === 'holder' ? ctx : null; }

export async function GET() {
  const ctx = await holderContext();
  if (!ctx) return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const { data } = await ctx.db.from('program_holder_payouts').select('stripe_account_id').eq('user_id', ctx.user.id).maybeSingle();
  if (!data?.stripe_account_id) return NextResponse.json({ accountId: null, transfersEnabled: false, payoutsEnabled: false, verificationStatus: 'not_started' });
  try { return NextResponse.json(await syncProgramHolderPayoutAccount(ctx, data.stripe_account_id)); }
  catch { return NextResponse.json({ error: 'Payout status is temporarily unavailable.' }, { status: 503 }); }
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'payment');
  if (limited) return limited;
  const ctx = await holderContext();
  if (!ctx) return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const { action } = (await request.json().catch(() => ({}))) as { action?: string };
  try {
    const accountId = await ensureProgramHolderPayoutAccount(ctx);
    await hydrateProcessEnv();
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: 'Stripe payout processing is unavailable.' }, { status: 503 });
    if (action === 'dashboard') {
      const ready = await syncProgramHolderPayoutAccount(ctx, accountId);
      if (!ready.transfersEnabled || !ready.payoutsEnabled) return NextResponse.json({ error: 'Complete payout verification before accessing funds.' }, { status: 409 });
      const login = await stripeCall(() => stripe.accounts.createLoginLink(accountId));
      return NextResponse.json({ url: login.url });
    }
    if (action !== 'onboard') return NextResponse.json({ error: 'Unsupported payout action.' }, { status: 400 });
    const link = await stripeCall(() => stripe.v2.core.accountLinks.create({ account: accountId, use_case: { type: 'account_onboarding', account_onboarding: { configurations: ['recipient'], collection_options: { fields: 'eventually_due', future_requirements: 'include' }, refresh_url: `${appUrl()}/program-holder/payouts?onboarding=refresh`, return_url: `${appUrl()}/program-holder/payouts?onboarding=returned` } } }));
    return NextResponse.json({ url: link.url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to start payout onboarding.' }, { status: 500 });
  }
}

