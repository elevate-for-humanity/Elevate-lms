import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripe, stripeCall } from '@/lib/stripe/client';
import { resolveTenantIdForUser } from '@/lib/platform/resolve-tenant-for-user';
import { hydrateProcessEnv } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

async function authContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id || !user.email) return null;

  const tenantId = await resolveTenantIdForUser(user.id);
  if (!tenantId) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  return { user, tenantId, organizationId: profile?.organization_id ?? null };
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await authContext();
  if (!auth) return NextResponse.json({ error: 'Authentication and workspace required.' }, { status: 401 });

  await hydrateProcessEnv().catch(() => undefined);
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ configured: false, status: 'unavailable' }, { status: 503 });

  const db = await requireAdminClient();
  const { data: paymentAccount } = await db
    .from('organization_payment_accounts')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .maybeSingle();

  if (!paymentAccount?.stripe_account_id) {
    return NextResponse.json({ configured: true, connected: false, status: 'not_started' });
  }

  try {
    const account = await stripeCall(() => stripe.accounts.retrieve(paymentAccount.stripe_account_id));
    const status = account.charges_enabled && account.payouts_enabled
      ? 'active'
      : account.details_submitted ? 'restricted' : 'onboarding';

    await db.from('organization_payment_accounts').update({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      status,
      requirements: account.requirements ?? {},
      updated_at: new Date().toISOString(),
    }).eq('id', paymentAccount.id);

    return NextResponse.json({
      configured: true,
      connected: true,
      accountId: account.id,
      status,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: {
        currentlyDue: account.requirements?.currently_due ?? [],
        eventuallyDue: account.requirements?.eventually_due ?? [],
        disabledReason: account.requirements?.disabled_reason ?? null,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Could not verify the connected Stripe account.' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await authContext();
  if (!auth) return NextResponse.json({ error: 'Authentication and workspace required.' }, { status: 401 });

  await hydrateProcessEnv().catch(() => undefined);
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Stripe is unavailable.' }, { status: 503 });

  const db = await requireAdminClient();
  let { data: paymentAccount } = await db
    .from('organization_payment_accounts')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .maybeSingle();

  let accountId = paymentAccount?.stripe_account_id ?? null;
  if (!accountId) {
    try {
      const account = await stripeCall(() => stripe.accounts.create({
        type: 'express',
        email: auth.user.email!,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          url: SITE,
          product_description: 'Products, memberships, services, courses, and community access sold through an Elevate workspace.',
        },
        metadata: {
          tenant_id: auth.tenantId,
          organization_id: auth.organizationId ?? '',
          owner_user_id: auth.user.id,
        },
      }));
      accountId = account.id;

      const { data: inserted, error } = await db
        .from('organization_payment_accounts')
        .insert({
          tenant_id: auth.tenantId,
          organization_id: auth.organizationId,
          stripe_account_id: account.id,
          account_type: 'express',
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          status: 'onboarding',
          requirements: account.requirements ?? {},
          created_by: auth.user.id,
        })
        .select('*')
        .single();
      if (error) throw error;
      paymentAccount = inserted;
    } catch {
      return NextResponse.json({ error: 'Could not create the connected Stripe account.' }, { status: 502 });
    }
  }

  if (!accountId) return NextResponse.json({ error: 'Connected account could not be resolved.' }, { status: 500 });

  try {
    const accountLink = await stripeCall(() => stripe.accountLinks.create({
      account: accountId!,
      type: 'account_onboarding',
      refresh_url: `${SITE}/account/payments?connect=refresh`,
      return_url: `${SITE}/account/payments?connect=complete`,
      collection_options: { fields: 'eventually_due' },
    }));

    if (paymentAccount?.id) {
      await db.from('organization_payment_accounts').update({
        status: 'onboarding',
        updated_at: new Date().toISOString(),
      }).eq('id', paymentAccount.id);
    }

    return NextResponse.json({ url: accountLink.url, accountId });
  } catch {
    return NextResponse.json({ error: 'Could not create Stripe onboarding link.' }, { status: 502 });
  }
}
