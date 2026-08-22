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

type SamSetupContext = {
  entity?: string;
  status?: string;
  goal?: string;
  team?: string;
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

export default async function SamGovPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const setupContext: SamSetupContext | null =
    params.setup === 'guided'
      ? {
          entity: cleanSetupValue(params.entity),
          status: cleanSetupValue(params.status, 100),
          goal: cleanSetupValue(params.goal),
          team: cleanSetupValue(params.team, 100),
        }
      : null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const redirectTarget = new URLSearchParams();
    redirectTarget.set('redirect', `/apps/sam-gov?${new URLSearchParams(
      Object.entries(params).flatMap(([key, value]) => {
        const first = Array.isArray(value) ? value[0] : value;
        return first ? [[key, first] as [string, string]] : [];
      }),
    ).toString()}`);
    redirectTarget.set('message', 'login-required');
    redirect(`/login?${redirectTarget.toString()}`);
  }

  const { data: storedSubscription } = await supabase
    .from('user_app_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('app_slug', 'sam-gov')
    .maybeSingle();

  if (!storedSubscription) {
    const trial = new URL('/apps/sam-gov/start-trial', 'https://www.elevateforhumanity.org');
    Object.entries(params).forEach(([key, value]) => {
      const first = Array.isArray(value) ? value[0] : value;
      if (first) trial.searchParams.set(key, first);
    });
    redirect(`${trial.pathname}${trial.search}`);
  }
  const subscription = await syncPaidAppSubscription(storedSubscription);

  if (subscription.status !== 'trial' && subscription.status !== 'active') {
    redirect(subscription.upgrade_url || `/store/apps/sam-gov?reason=${encodeURIComponent(subscription.access_reason || subscription.status || 'subscription-required')}`);
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
      <SamGovApp user={user} subscription={subscription} entities={entities || []} documents={documents} alerts={alerts} trialDaysRemaining={trialDaysRemaining} setupContext={setupContext} />
    </div>
  );
}
