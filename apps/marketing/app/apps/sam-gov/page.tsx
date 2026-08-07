import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SamGovApp } from './SamGovApp';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { logger } from '@/lib/logger';
import { syncPaidAppSubscription } from '@/lib/apps/sync-paid-app-subscription';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SAM.gov Assistant | Elevate Apps',
  description: 'Federal contractor registration and compliance management.',
};

export default async function SamGovPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apps/sam-gov&message=login-required');

  const { data: storedSubscription } = await supabase
    .from('user_app_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('app_slug', 'sam-gov')
    .maybeSingle();

  if (!storedSubscription) redirect('/apps/sam-gov/start-trial');
  const subscription = await syncPaidAppSubscription(storedSubscription);

  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    if (new Date(subscription.trial_ends_at) < new Date()) redirect('/store/apps/sam-gov?expired=true&message=trial-expired');
  }
  if (subscription.status !== 'trial' && subscription.status !== 'active') {
    redirect(`/store/apps/sam-gov?status=${subscription.status}&message=subscription-inactive`);
  }

  let trialDaysRemaining = 0;
  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    trialDaysRemaining = Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000));
  }

  const { data: entities, error: entitiesError } = await supabase
    .from('sam_entities').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
  if (entitiesError) logger.error('Error fetching entities:', entitiesError);

  const entityIds = entities?.map((e) => e.id) || [];
  let documents: any[] = [];
  let alerts: any[] = [];
  if (entityIds.length > 0) {
    const [{ data: docs }, { data: alertData }] = await Promise.all([
      supabase.from('sam_documents').select('*').in('entity_id', entityIds).order('uploaded_at', { ascending: false }),
      supabase.from('sam_alerts').select('*').in('entity_id', entityIds).eq('is_read', false).order('created_at', { ascending: false }).limit(20),
    ]);
    documents = docs || [];
    alerts = alertData || [];
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b"><div className="max-w-6xl mx-auto px-4 py-3"><Breadcrumbs items={[{ label: 'Apps', href: '/apps' }, { label: 'SAM.gov' }]} /></div></div>
      <SamGovApp user={user} subscription={subscription} entities={entities || []} documents={documents} alerts={alerts} trialDaysRemaining={trialDaysRemaining} />
    </div>
  );
}
