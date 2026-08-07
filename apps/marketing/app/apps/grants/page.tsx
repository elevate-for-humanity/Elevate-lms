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

export default async function GrantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apps/grants&message=login-required');

  const { data: storedSubscription } = await supabase
    .from('user_app_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('app_slug', 'grants')
    .maybeSingle();

  if (!storedSubscription) redirect('/apps/grants/start-trial');
  const subscription = await syncPaidAppSubscription(storedSubscription);

  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    if (new Date(subscription.trial_ends_at) < new Date()) redirect('/store/apps/grants?expired=true');
  }
  if (subscription.status !== 'trial' && subscription.status !== 'active') {
    redirect(`/store/apps/grants?status=${subscription.status}`);
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
      <div className="bg-white border-b"><div className="max-w-6xl mx-auto px-4 py-3"><Breadcrumbs items={[{ label: 'Apps', href: '/apps' }, { label: 'Grants' }]} /></div></div>
      <GrantsApp user={user} subscription={subscription} opportunities={opportunities || []} savedGrants={savedGrants || []} applications={applications || []} trialDaysRemaining={trialDaysRemaining} />
    </div>
  );
}
