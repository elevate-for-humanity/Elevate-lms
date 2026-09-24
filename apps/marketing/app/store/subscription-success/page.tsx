import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle, ArrowRight, CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveTenantIdForUser } from '@/lib/platform/resolve-tenant-for-user';
import { resolveBillingOrganizationId } from '@/lib/platform/organization-features';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Subscription Status | Elevate Store', robots: { index: false, follow: false } };

export default async function SubscriptionSuccessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) redirect('/login?redirect=/store/subscription-success');

  const tenantId = await resolveTenantIdForUser(user.id);
  const admin = await requireAdminClient();
  const organizationId = tenantId ? await resolveBillingOrganizationId(tenantId, admin) : null;
  const { data: subscription } = organizationId
    ? await admin.from('organization_subscriptions')
        .select('status,billing_provider,provider_subscription_id,current_period_end,subscription_plans(name,slug)')
        .eq('organization_id', organizationId).maybeSingle()
    : { data: null };

  const active = subscription?.status === 'active' || subscription?.status === 'trialing';
  if (!active) return <Pending />;

  const planJoin:any = subscription.subscription_plans;
  const plan = Array.isArray(planJoin) ? planJoin[0] : planJoin;
  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"><CheckCircle className="h-8 w-8 text-green-700" /></div>
        <h1 className="text-center text-3xl font-black text-slate-950">Subscription active</h1>
        <p className="mt-3 text-center text-slate-600">Elevate confirmed your {plan?.name || 'platform'} subscription from the current billing system and activated the workspace entitlements.</p>
        <div className="mt-8 rounded-xl bg-slate-50 p-5 text-sm text-slate-700"><div className="flex items-center gap-2 font-semibold text-slate-900"><CreditCard className="h-4 w-4" /> Billing provider</div><p className="mt-2 font-semibold capitalize">{subscription.billing_provider || 'Elevate'}</p></div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <a href="https://app.elevateforhumanity.org/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-bold text-white">Open Platform <ArrowRight className="h-4 w-4" /></a>
          <Link href="/billing" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold">Billing</Link>
          <Link href="/store/apps" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold">Store</Link>
        </div>
      </div>
    </main>
  );
}

function Pending() {
  return <main className="min-h-[65vh] bg-slate-50 px-4 py-16"><div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-black">Payment received — activation pending</h1><p className="mt-3 text-slate-600">The billing webhook activates access automatically after the payment is confirmed. Refresh shortly or open Billing to review the invoice.</p><Link href="/billing" className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white">Open Billing</Link></div></main>;
}
