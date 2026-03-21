import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import PartnerSettingsForm from './PartnerSettingsForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Settings | Partner Portal',
  description: 'Manage your organization profile and preferences.',
  robots: { index: false, follow: false },
};

export default async function PartnerSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/partner/settings');

  const db = createAdminClient() || supabase;

  const { data: partnerUser } = await db
    .from('partner_users')
    .select('partner_id')
    .eq('user_id', user.id)
    .single();

  const orgId = partnerUser?.partner_id ?? null;

  const { data: org } = orgId
    ? await db
        .from('partners')
        .select('name, city, state, address, contact_name, contact_email, contact_phone, notification_preferences')
        .eq('id', orgId)
        .single()
    : { data: null };

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const initialData = {
    orgId,
    orgName:               org?.name              ?? '',
    address:               org?.address            ?? '',
    city:                  org?.city               ?? '',
    state:                 org?.state              ?? '',
    contactName:           org?.contact_name       ?? profile?.full_name ?? '',
    contactEmail:          org?.contact_email      ?? profile?.email     ?? user.email ?? '',
    contactPhone:          org?.contact_phone      ?? '',
    emailNotifications:    org?.notification_preferences?.email                 ?? true,
    weeklyDigest:          org?.notification_preferences?.weekly_digest          ?? true,
    outcomeAlerts:         org?.notification_preferences?.outcome_alerts         ?? true,
    referralConfirmations: org?.notification_preferences?.referral_confirmations ?? true,
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/partner-page-13.jpg" alt="Partner settings" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner-portal' }, { label: 'Settings' }]} />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partner Settings</h1>
            <p className="text-gray-600">Manage your organization profile and preferences</p>
          </div>
          <Link href="/partner-portal" className="text-brand-blue-600 hover:text-brand-blue-700">
            ← Back to Portal
          </Link>
        </div>
        <PartnerSettingsForm initialData={initialData} />
      </div>
    </div>
  );
}
