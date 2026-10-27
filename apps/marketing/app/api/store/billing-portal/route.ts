import { NextResponse } from 'next/server';
import { LMS_HOST } from '@/lib/routing/portal-map';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveTenantIdForUser } from '@/lib/platform/resolve-tenant-for-user';
import { resolveBillingOrganizationId } from '@/lib/platform/organization-features';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const tenantId = await resolveTenantIdForUser(user.id);
  if (!tenantId) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  const db = await requireAdminClient();
  const organizationId = await resolveBillingOrganizationId(tenantId, db);
  if (!organizationId) return NextResponse.json({ error: 'Billing organization not found' }, { status: 404 });

  const { data: subscription, error } = await db
    .from('organization_subscriptions')
    .select('billing_provider,provider_customer_id,provider_subscription_id,status')
    .eq('organization_id', organizationId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Billing account could not be loaded' }, { status: 500 });
  if (!subscription) return NextResponse.json({ error: 'No billing subscription exists yet.' }, { status: 409 });

  if (subscription.billing_provider === 'quickbooks') {
    return NextResponse.json({ url: `${LMS_HOST}/billing`, provider: 'quickbooks' });
  }
  if (subscription.billing_provider === 'paypal') {
    return NextResponse.json({ url: `${LMS_HOST}/billing`, provider: 'paypal' });
  }
  return NextResponse.json({ url: `${LMS_HOST}/billing`, provider: subscription.billing_provider || 'elevate' });
}
