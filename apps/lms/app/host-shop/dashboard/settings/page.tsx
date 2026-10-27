import { Metadata } from 'next';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';
import PartnerSettingsForm from './PartnerSettingsForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Settings | Host Shop Portal',
  description: 'Manage the selected Host Shop profile and notification preferences.',
};

export default async function PartnerSettingsPage() {
  // Resolve the same canonical Host Shop context used by the rest of the
  // workspace. This preserves owner access through partner_users and lets a
  // platform administrator inspect the explicitly selected shop without an
  // unrelated partner membership capturing the request.
  const { user, db, partner } = await requireCurrentHostShopPartner();
  const orgId = partner.id;

  const { data: org } = orgId
      ? await db
        .from('partners')
        .select(
          'name, city, state, address_line1, owner_name, supervisor_name, contact_name, contact_email, contact_phone, phone, notification_preferences',
        )
        .eq('id', orgId)
        .maybeSingle()
    : { data: null };

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  const initialData = {
    orgId,
    orgName: org?.name ?? '',
    address: org?.address_line1 ?? '',
    city: org?.city ?? '',
    state: org?.state ?? '',
    contactName: org?.contact_name ?? org?.owner_name ?? org?.supervisor_name ?? profile?.full_name ?? '',
    contactEmail: org?.contact_email ?? profile?.email ?? user.email ?? '',
    contactPhone: org?.contact_phone ?? org?.phone ?? '',
    emailNotifications: org?.notification_preferences?.email ?? true,
    weeklyDigest: org?.notification_preferences?.weekly_digest ?? true,
    outcomeAlerts: org?.notification_preferences?.outcome_alerts ?? true,
    referralConfirmations: org?.notification_preferences?.referral_confirmations ?? true,
  };

  return (
    <div>
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden rounded-xl mb-6 -mx-4 sm:-mx-6 lg:-mx-8">
        <Image
          src="/images/pages/partner-page-13.jpg"
          alt="Partner settings"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>
      <div className="mb-6">
        <Breadcrumbs
          items={[{ label: 'Host Shop', href: '/host-shop/dashboard' }, { label: 'Settings' }]}
        />
      </div>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Host Shop Settings</h1>
            <p className="text-slate-700">Manage your organization profile and preferences</p>
          </div>
        </div>
        <PartnerSettingsForm initialData={initialData} />
      </div>
    </div>
  );
}
