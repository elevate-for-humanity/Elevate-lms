import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SamGovApp } from './SamGovApp';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SAM.gov Assistant | Elevate Apps',
  description: 'Federal contractor registration and compliance management.',
};

export default async function SamGovPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  // Must have database connection
  if (!supabase) {
    redirect('/error?message=service-unavailable');
  }

  // Must be logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/apps/sam-gov&message=login-required');
  }

  // Check subscription status
  const { data: subscription } = await db
    .from('user_app_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('app_slug', 'sam-gov')
    .maybeSingle();

  // No subscription - redirect to start trial
  if (!subscription) {
    redirect('/apps/sam-gov/start-trial');
  }

  // Check trial expiration
  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at);
    if (trialEnd < new Date()) {
      redirect('/store/apps/sam-gov?expired=true&message=trial-expired');
    }
  }

  // Check if subscription is active
  if (subscription.status !== 'trial' && subscription.status !== 'active') {
    redirect(`/store/apps/sam-gov?status=${subscription.status}&message=subscription-inactive`);
  }

  // Calculate trial days remaining
  let trialDaysRemaining = 0;
  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at);
    trialDaysRemaining = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  // Fetch user's SAM entities from database
  const { data: entities, error: entitiesError } = await db
    .from('sam_entities')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (entitiesError) {
    console.error('Error fetching entities:', entitiesError);
  }

  // Fetch documents for all entities
  const entityIds = entities?.map(e => e.id) || [];
  let documents: any[] = [];
  if (entityIds.length > 0) {
    const { data: docs } = await db
      .from('sam_documents')
      .select('*')
      .in('entity_id', entityIds)
      .order('uploaded_at', { ascending: false });
    documents = docs || [];
  }

  // Fetch alerts
  let alerts: any[] = [];
  if (entityIds.length > 0) {
    const { data: alertData } = await db
      .from('sam_alerts')
      .select('*')
      .in('entity_id', entityIds)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20);
    alerts = alertData || [];
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apps', href: '/apps' }, { label: 'SAM.gov' }]} />
        </div>
      </div>
    <SamGovApp
      user={user}
      subscription={subscription}
      entities={entities || []}
      documents={documents}
      alerts={alerts}
      trialDaysRemaining={trialDaysRemaining}
    />
    </div>
  );
}
