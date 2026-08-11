import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { resolveTenantIdForUser } from '@/lib/platform/resolve-tenant-for-user';
import { resolveBillingOrganizationId } from '@/lib/platform/organization-features';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RETURN_URL = 'https://www.elevateforhumanity.org/store/plans';

export async function POST() {
  await hydrateProcessEnv().catch(() => undefined);

  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const tenantId = await resolveTenantIdForUser(user.id);
  if (!tenantId) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const db = await requireAdminClient();
  const organizationId = await resolveBillingOrganizationId(tenantId, db);
  if (!organizationId) {
    return NextResponse.json({ error: 'Billing organization not found' }, { status: 404 });
  }

  const { data: subscription, error } = await db
    .from('organization_subscriptions')
    .select('stripe_customer_id,stripe_subscription_id,status')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Billing account could not be loaded' }, { status: 500 });
  }
  if (!subscription?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe billing account exists yet.' }, { status: 409 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Billing service unavailable' }, { status: 503 });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: RETURN_URL,
  });

  return NextResponse.json({ url: portal.url });
}
