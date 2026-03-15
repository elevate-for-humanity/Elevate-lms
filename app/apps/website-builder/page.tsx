import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { WebsiteBuilderApp } from './WebsiteBuilderApp';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Website Builder | Elevate Apps',
  description: 'Build professional training provider websites.',
};

export default async function WebsiteBuilderPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  if (!supabase) {
    redirect('/error?message=service-unavailable');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/apps/website-builder&message=login-required');
  }

  const { data: subscription } = await db
    .from('user_app_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('app_slug', 'website-builder')
    .maybeSingle();

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
    redirect(`/store/apps/website-builder?status=${subscription.status}`);
  }

  let trialDaysRemaining = 0;
  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at);
    trialDaysRemaining = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  // Fetch user's websites
  const { data: websites } = await db
    .from('user_websites')
    .select('*, pages:website_pages(count)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apps', href: '/apps' }, { label: 'Website Builder' }]} />
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
