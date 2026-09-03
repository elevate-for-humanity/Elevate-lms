import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import StaffSettingsForm from './StaffSettingsForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Settings | Staff Portal',
  description: 'Manage your organization profile and preferences.',
};

export default async function StaffSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/staff/settings');

  const { data: staffUser } = await supabase
    .from('staff_users')
    .select('staff_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!staffUser) redirect('/unauthorized');

  const orgId = staffUser?.staff_id ?? null;

  const { data: org } = orgId
    ? await supabase
        .from('staffs')
        .select(
          'name, city, state, address, contact_name, contact_email, contact_phone, notification_preferences',
        )
        .eq('id', orgId)
        .maybeSingle()
    : { data: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  const initialData = {
    orgId,
    orgName: org?.name ?? '',
    address: org?.address ?? '',
    city: org?.city ?? '',
    state: org?.state ?? '',
    contactName: org?.contact_name ?? profile?.full_name ?? '',
    contactEmail: org?.contact_email ?? profile?.email ?? user.email ?? '',
    contactPhone: org?.contact_phone ?? '',
    emailNotifications: org?.notification_preferences?.email ?? true,
    weeklyDigest: org?.notification_preferences?.weekly_digest ?? true,
    outcomeAlerts: org?.notification_preferences?.outcome_alerts ?? true,
    referralConfirmations: org?.notification_preferences?.referral_confirmations ?? true,
  };

  return (
    <div>
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden rounded-xl mb-6 -mx-4 sm:-mx-6 lg:-mx-8">
        <Image
          src="/images/pages/staff-page-13.jpg"
          alt="Staff settings"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>
      <div className="mb-6">
        <Breadcrumbs
          items={[{ label: 'Staff', href: '/staff/attendance' }, { label: 'Settings' }]}
        />
      </div>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Staff Settings</h1>
            <p className="text-slate-700">Manage your organization profile and preferences</p>
          </div>
        </div>
        <StaffSettingsForm initialData={initialData} />
      </div>
    </div>
  );
}
