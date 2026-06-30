import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { redirect } from 'next/navigation';
import NotificationPreferencesForm from './NotificationPreferencesForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Notification Settings | Program Holder',
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/settings/notifications',
  },
};

export default async function ProgramHolderNotificationSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/program-holder/settings/notifications');
  }

  // Get program holder record via profiles.program_holder_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('program_holder_id')
    .eq('id', user.id)
    .maybeSingle();

  const holderId = profile?.program_holder_id;
  if (!holderId) redirect('/program-holder/onboarding');

  const { data: programHolder } = await supabase
    .from('program_holders')
    .select('id, organization_name')
    .eq('id', holderId)
    .maybeSingle();

  if (!programHolder) redirect('/program-holder/onboarding');

  // Fetch notification preference columns from the user's profile row (PK = id)
  const { data: preferences } = await supabase
    .from('profiles')
    .select('email_enabled, sms_enabled, phone_e164, sms_consent, sms_opt_out')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[{ label: 'Program Holder', href: '/program-holder' }, { label: 'Settings' }]}
        />
      </div>
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Notification Settings</h1>
          <p className="text-black">
            Manage how you receive notifications about student enrollments and updates.
          </p>
        </div>

        <NotificationPreferencesForm
          userId={user.id}
          initialPreferences={preferences || {}}
        />
      </div>
    </div>
  );
}
