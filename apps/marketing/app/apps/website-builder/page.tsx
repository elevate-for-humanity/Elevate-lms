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

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Store', href: '/store/apps' }, { label: 'Website Builder' }]} />
        </div>
      </div>
      <WebsiteBuilderApp user={user} subscription={subscription} websites={websites} trialDaysRemaining={trialDaysRemaining} />
    </div>
  );
}
