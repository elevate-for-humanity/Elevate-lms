import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WebsiteImportClient from './WebsiteImportClient';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Import Existing Website | Elevate Website Builder',
  description: 'Import a public website into Elevate Website Builder, review the AI-generated configuration, and continue editing before publishing.',
  robots: { index: false, follow: false },
};

export default async function WebsiteImportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const returnUrl = 'https://store.elevateforhumanity.org/apps/website-builder/import';
    redirect(`https://app.elevateforhumanity.org/login?redirect=${encodeURIComponent(returnUrl)}`);
  }

  const access = await getWebsiteBuilderAccess(user.id, supabase);
  if (access.isAdmin) return <WebsiteImportClient />;

  const { data: subscription } = await supabase
    .from('user_app_subscriptions')
    .select('plan, status, trial_ends_at')
    .eq('user_id', user.id)
    .eq('app_slug', 'website-builder')
    .maybeSingle();

  if (!subscription || !['trial', 'active'].includes(subscription.status || '')) {
    redirect('/apps/website-builder/start-trial');
  }
  if (subscription.status === 'trial' && subscription.trial_ends_at && new Date(subscription.trial_ends_at).getTime() < Date.now()) {
    redirect('/store/apps/website-builder?trial=expired');
  }

  return <WebsiteImportClient />;
}
