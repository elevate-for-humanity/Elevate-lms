import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import ReportSubmitClient from './ReportSubmitClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Submit WIOA Report | Employer Portal',
  description: 'Submit workforce outcome metrics and compliance data for your reporting period.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer/reports/submit' },
};

export default async function EmployerReportSubmitPage() {
  const { user, profile } = await requireRole(['employer', 'admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  const employerKey = (profile as any)?.employer_id || user.id;

  const [{ count: participantsServed }, { count: completions }, { count: placements }] = await Promise.all([
    db.from('applications').select('*', { head: true, count: 'exact' }).eq('employer_id', employerKey),
    db.from('applications').select('*', { head: true, count: 'exact' }).eq('employer_id', employerKey).eq('status', 'completed'),
    db.from('job_placements').select('*', { head: true, count: 'exact' }).eq('employer_id', employerKey).eq('status', 'placed'),
  ]);

  return (
    <ReportSubmitClient
      companyName={profile.company_name || 'Your Organization'}
      defaults={{
        participantsServed: participantsServed || 0,
        completions: completions || 0,
        placements: placements || 0,
      }}
    />
  );
}
