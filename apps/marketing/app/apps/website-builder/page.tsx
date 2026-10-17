import Link from 'next/link';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WebsiteBuilderApp } from './WebsiteBuilderApp';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { syncIndividualAppSubscription } from '@/lib/apps/sync-subscription';
import { startAppTrial } from '@/lib/trial/start-app-trial';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Website Builder | Elevate Apps',
  description: 'Create, edit, preview, and publish AI-built websites.',
  robots: { index: false, follow: false },
};

function interviewPending(config: unknown) {
  const meta = config && typeof config === 'object' && (config as any).meta && typeof (config as any).meta === 'object'
    ? (config as any).meta
    : {};
  return meta.parisInterviewCompleted === false;
}

export default async function WebsiteBuilderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apps/website-builder&message=login-required');

  let access = await getWebsiteBuilderAccess(user.id, supabase);
  if (!access.allowed && access.reason === 'subscription_required') {
    const trial = await startAppTrial(user.id, 'website-builder', supabase);
    if (trial.status === 'error') redirect('/store/apps/website-builder?reason=trial-start-failed');
    access = await getWebsiteBuilderAccess(user.id, supabase);
  }
  if (!access.allowed) {
    redirect(access.upgradeUrl || `/store/apps/website-builder?reason=${encodeURIComponent(access.reason || 'subscription-required')}`);
  }

  const subscription = access.isAdmin
    ? { status: access.status, plan: access.plan, trial_ends_at: null }
    : await syncIndividualAppSubscription(user.id, 'website-builder', supabase);
  if (!subscription) redirect('/store/apps/website-builder?reason=subscription-unavailable');

  let trialDaysRemaining = 0;
  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    trialDaysRemaining = Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  const { data: rawWebsites } = await supabase
    .from('user_websites')
    .select('id, site_name, subdomain, is_published, updated_at, site_config')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  // Workspace trials intentionally contain an internal placeholder row so the
  // organization and future site share one identity. It is not a customer site
  // until PARIS completes the interview, so do not let it suppress onboarding.
  const websites = (rawWebsites || [])
    .filter((site) => !interviewPending(site.site_config))
    .map(({ site_config: _siteConfig, ...site }) => site);

  const usage = access.isAdmin ? null : await supabase.from('user_app_credit_wallets')
    .select('balance').eq('user_id', user.id).eq('app_slug', 'website-builder').maybeSingle();
  const credits = usage?.error ? null : Number(usage?.data?.balance ?? 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Store', href: '/store/apps' }, { label: 'Website Builder' }]} />
        </div>
      </div>
      {!access.isAdmin && (
        <aside className="mx-auto max-w-6xl px-4 py-4" aria-label="Processing allowance">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            <p className="font-bold">
              {credits === null
                ? 'Credit balance temporarily unavailable'
                : `${credits.toLocaleString()} processing credits remaining`}
            </p>
            <p className="mt-1">
              A website draft or imported site uses 60 credits. A PARIS edit uses 8 credits.
              Processing attempts use credits, including attempts that cannot produce a valid draft.
            </p>
            <p className="mt-1">
              Paid monthly allowances replace unused credits after renewal. Generation stops when
              credits run out; there are no automatic overage charges.
            </p>
            <Link
              href="/store/apps/website-builder"
              className="mt-2 inline-block font-semibold text-brand-red-700 underline"
            >
              Review plans and allowances
            </Link>
          </div>
        </aside>
      )}
      <WebsiteBuilderApp user={user} subscription={subscription} websites={websites} trialDaysRemaining={trialDaysRemaining} />
    </div>
  );
}
