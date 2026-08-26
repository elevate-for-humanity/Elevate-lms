import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GrantsApp } from './GrantsApp';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { syncPaidAppSubscription } from '@/lib/apps/sync-paid-app-subscription';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Grants Discovery | Elevate Apps',
  description: 'Find and manage federal, state, and foundation grants.',
};

type GrantsSetupContext = {
  organization?: string;
  purpose?: string;
  amount?: string;
  geography?: string;
};

function cleanSetupValue(value: string | string[] | undefined, max = 500): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const cleaned = Array.from(raw.trim())
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('')
    .slice(0, max);
  return cleaned || undefined;
}

export default async function GrantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const setupContext: GrantsSetupContext | null =
    params.setup === 'guided'
      ? {
          organization: cleanSetupValue(params.organization),
          purpose: cleanSetupValue(params.purpose),
          amount: cleanSetupValue(params.amount, 100),
          geography: cleanSetupValue(params.geography),
        }
      : null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const carried = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      const first = Array.isArray(value) ? value[0] : value;
      if (first) carried.set(key, first);
    });
    redirect(`/login?redirect=${encodeURIComponent(`/apps/grants?${carried.toString()}`)}&message=login-required`);
  }

  const { data: storedSubscription } = await supabase
    .from('user_app_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('app_slug', 'grants')
    .maybeSingle();

  if (!storedSubscription) {
    const trial = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      const first = Array.isArray(value) ? value[0] : value;
      if (first) trial.set(key, first);
    });
    redirect(`/apps/grants/start-trial${trial.toString() ? `?${trial.toString()}` : ''}`);
  }
  const subscription = await syncPaidAppSubscription(storedSubscription);

  if (subscription.status !== 'trial' && subscription.status !== 'active') {
    redirect(subscription.upgrade_url || `/store/apps/grants?reason=${encodeURIComponent(subscription.access_reason || subscription.status || 'subscription-required')}`);
  }

  let trialDaysRemaining = 0;
  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    trialDaysRemaining = Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000));
  }

  const [{ data: opportunities }, { data: savedGrants }, { data: applications }] = await Promise.all([
    supabase.from('grant_opportunities').select('*').eq('opportunity_status', 'open').order('deadline', { ascending: true }).limit(50),
    supabase.from('user_saved_grants').select('*, grant:grant_opportunities(*)').eq('user_id', user.id),
    supabase.from('grant_applications').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b"><div className="max-w-6xl mx-auto px-4 py-3"><Breadcrumbs items={[{ label: 'Apps', href: '/platform' }, { label: 'Grants' }]} /></div></div>
      <GrantsApp user={user} subscription={subscription} opportunities={opportunities || []} savedGrants={savedGrants || []} applications={applications || []} trialDaysRemaining={trialDaysRemaining} setupContext={setupContext} />
    </div>
  );
}
