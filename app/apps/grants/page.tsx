import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GrantsApp } from './GrantsApp';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Grants Discovery | Elevate Apps',
  description: 'Find and manage federal, state, and foundation grants.',
};

export default async function GrantsPage() {
  const supabase = await createClient();
  

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/apps/grants&message=login-required');
  }

  // Check subscription
  const { data: subscription } = await supabase
    .from('user_app_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('app_slug', 'grants')
    .maybeSingle();

  if (!subscription) {
    redirect('/apps/grants/start-trial');
  }

  // Check trial expiration
  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at);
    if (trialEnd < new Date()) {
      redirect('/store/apps/grants?expired=true');
    }
  }

  if (subscription.status !== 'trial' && subscription.status !== 'active') {
    redirect(`/store/apps/grants?status=${subscription.status}`);
  }

  let trialDaysRemaining = 0;
  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at);
    trialDaysRemaining = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  // Fetch grant opportunities from database
  const { data: opportunities } = await supabase
    .from('grant_opportunities')
    .select('*')
    .eq('opportunity_status', 'open')
    .order('deadline', { ascending: true })
    .limit(50);

  // Fetch user's saved grants
  const { data: savedGrants } = await supabase
    .from('user_saved_grants')
    .select('*, grant:grant_opportunities(*)')
    .eq('user_id', user.id);

  // Fetch user's applications
  const { data: applications } = await supabase
    .from('grant_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apps', href: '/apps' }, { label: 'Grants' }]} />
        </div>
      </div>
    <GrantsApp
      user={user}
      subscription={subscription}
      opportunities={opportunities || []}
      savedGrants={savedGrants || []}
      applications={applications || []}
      trialDaysRemaining={trialDaysRemaining}
    />
    </div>
  );
}
