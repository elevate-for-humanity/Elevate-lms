import { getUploadedW9Status } from '@/lib/program-holder/document-review';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { configureProgramHolderPayoutAccount, getProgramHolderPayoutAccount, payoutProviderUrl, saveProgramHolderPayPalRecipient } from '@/lib/program-holder/payout-account';
import { getProgramHolderPaymentReadiness } from '@/lib/program-holder/onboarding-readiness';

export const dynamic = 'force-dynamic';
const privateHeaders = { 'Cache-Control': 'private, no-store' };
async function context() {
  const ctx = await requireProgramHolder();
  return ctx.mode === 'holder' ? ctx : null;
}
export async function GET() {
  const ctx = await context();
  if (!ctx) return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403, headers: privateHeaders });
  try {
    const account = await getProgramHolderPayoutAccount(ctx);
    const uploadedW9 = await getUploadedW9Status(ctx.db, ctx.user.id);
    // Banking setup remains accessible while compliance is being completed.
    // A failed readiness lookup must still block payment release.
    const onboarding = await getProgramHolderPaymentReadiness(ctx.db, ctx.holderId).catch(() => ({ ready: false, missing: ['Payment requirements could not be verified. Retry before requesting a payment.'] }));
    return NextResponse.json({ ...account, uploadedW9, onboardingReady: onboarding.ready, missingRequirements: onboarding.missing }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: 'Payout setup could not load. Please retry.' }, { status: 503, headers: privateHeaders });
  }
}
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'payment');
  if (limited) return limited;
  const ctx = await context();
  if (!ctx) return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (body.provider && !['paypal','quickbooks'].includes(body.provider)) return NextResponse.json({ error: 'Choose QuickBooks or PayPal.' }, { status: 400 });
  try {
    if (body.action === 'save_paypal') {
      if (body.confirm !== true) return NextResponse.json({ error: 'Confirm that this PayPal email belongs to you.' }, { status: 400 });
      return NextResponse.json(await saveProgramHolderPayPalRecipient(ctx, String(body.email || '')), { headers: privateHeaders });
    }
    if (body.action === 'request_quickbooks') {
      await configureProgramHolderPayoutAccount(ctx, 'quickbooks');
      const { error } = await ctx.db.from('staff_notifications').insert({
        type: 'program_holder_banking_setup', title: 'QuickBooks contractor invitation requested',
        message: 'A Program Holder requested an Intuit contractor invitation to enter W-9 and banking details securely. Open the holder banking review to complete setup.',
        severity: 'action_required', metadata: { program_holder_id: ctx.holderId, user_id: ctx.user.id, provider: 'quickbooks' },
      });
      if (error) throw new Error('The request could not be delivered to Elevate. Please retry.');
      return NextResponse.json({ ok: true, message: 'Elevate has been asked to issue your personal QuickBooks invitation. No banking verification or payment has been recorded.' });
    }
    if (!['configure','onboard','dashboard'].includes(body.action)) return NextResponse.json({ error: 'Unsupported payout action.' }, { status: 400 });
    const account = await getProgramHolderPayoutAccount(ctx);
    const provider = body.provider || (account.provider === 'paypal' ? 'paypal' : 'quickbooks');
    if (account.provider !== provider && (account.payoutsEnabled || account.transfersEnabled)) return NextResponse.json({ error: 'Contact Elevate to change a verified payout provider.' }, { status: 409 });
    if (body.action === 'configure') return NextResponse.json(await configureProgramHolderPayoutAccount(ctx, provider));
    const url = await payoutProviderUrl(provider, body.action, ctx);
    if (!url) return NextResponse.json({ error: 'Your personal QuickBooks invitation has not been attached yet. Request it from this page.' }, { status: 503 });
    if (account.provider !== provider) await configureProgramHolderPayoutAccount(ctx, provider);
    return NextResponse.json({ url }, { headers: privateHeaders });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Unable to configure payouts.' }, { status: 503 });
  }
}
