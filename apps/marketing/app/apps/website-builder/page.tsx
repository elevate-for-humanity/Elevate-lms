import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WebsiteBuilderApp } from './WebsiteBuilderApp';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { syncIndividualAppSubscription } from '@/lib/apps/sync-subscription';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Website Builder | Elevate Apps',
  description: 'Create, edit, preview, and publish training-provider websites.',
  robots: { index: false, follow: false },
};

export default async function WebsiteBuilderPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/apps/website-builder&message=login-required');
  }

  const subscription = await syncIndividualAppSubscription(user.id, 'website-builder', supabase);

  if (!subscription) {
    redirect('/apps/website-builder/start-trial');
  }

  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at);
    if (trialEnd < new Date()) {
      redirect('/store/apps/website-builder?expired=true');
    }
  }

  if (subscription.status !== 'trial' && subscription.status !== 'active') {
    redirect(`/store/apps/website-builder?status=${encodeURIComponent(subscription.status || 'inactive')}`);
  }

  let trialDaysRemaining = 0;
  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at);
    trialDaysRemaining = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  const { data: websites } = await supabase
    .from('user_websites')
    .select('*, pages:website_pages(count)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Store', href: '/store/apps' }, { label: 'Website Builder' }]} />
        </div>
      </div>
      <WebsiteBuilderApp
        user={user}
        subscription={subscription}
        websites={websites || []}
        trialDaysRemaining={trialDaysRemaining}
      />
    </div>
  );
}
