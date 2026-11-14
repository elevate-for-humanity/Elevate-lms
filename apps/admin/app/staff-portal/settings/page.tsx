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
    .from('profiles')
    .select('id, role, company_name, address, city, state, full_name, email, phone, notification_preferences')
    .eq('id', user.id)
    .maybeSingle();

  if (!staffUser || !['staff', 'admin', 'super_admin'].includes(staffUser.role ?? '')) redirect('/unauthorized');

  const orgId = staffUser.id;

  const initialData = {
    orgId,
    orgName: staffUser.company_name ?? '',
    address: staffUser.address ?? '',
    city: staffUser.city ?? '',
    state: staffUser.state ?? '',
    contactName: staffUser.full_name ?? '',
    contactEmail: staffUser.email ?? user.email ?? '',
    contactPhone: staffUser.phone ?? '',
    emailNotifications: (staffUser.notification_preferences as any)?.email ?? true,
    weeklyDigest: (staffUser.notification_preferences as any)?.weekly_digest ?? true,
    outcomeAlerts: (staffUser.notification_preferences as any)?.outcome_alerts ?? true,
    referralConfirmations: (staffUser.notification_preferences as any)?.referral_confirmations ?? true,
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
