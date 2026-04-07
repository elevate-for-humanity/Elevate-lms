import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import WebhookHealthDashboard from './WebhookHealthDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Webhook Health | Elevate For Humanity',
  description: 'Monitor webhook ingestion health across all providers.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/system/webhooks',
  },
};

export default async function WebhookHealthPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(\'/login\');

  const adminDb = createAdminClient();
  if (adminDb) {
    const { data: profile } = await adminDb
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      redirect('/admin');
    }
  }

  return <WebhookHealthDashboard />;
}
