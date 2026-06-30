import { Metadata } from 'next';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import ProgramHolderSettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/program-holder/settings' },
  title: 'Program Settings',
  description: 'Configure your program holder account settings.',
  robots: { index: false, follow: false },
};

export default async function ProgramSettingsPage() {
  const { db, user, holderId } = await requireProgramHolder();

  const [{ data: profile }, { data: holder }] = await Promise.all([
    db.from('profiles').select('organization, email').eq('id', user.id).maybeSingle(),
    holderId
      ? db
          .from('program_holders')
          .select('organization_name, notify_enrollments, notify_weekly_reports')
          .eq('id', holderId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <ProgramHolderSettingsForm
      organization={profile?.organization || holder?.organization_name || ''}
      email={profile?.email || user.email || ''}
      notifyEnrollments={holder?.notify_enrollments ?? true}
      notifyWeeklyReports={holder?.notify_weekly_reports ?? true}
    />
  );
}
