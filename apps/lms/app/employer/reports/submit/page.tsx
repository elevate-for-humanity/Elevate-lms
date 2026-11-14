import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import ReportSubmitClient from './ReportSubmitClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Submit WIOA Report | Employer Portal',
  description: 'Submit workforce outcome metrics and compliance data for your reporting period.',
};

export default async function EmployerReportSubmitPage() {
  const { user, profile } = await requireRole(['employer', 'admin', 'staff']);
  const db = await requireAdminClient();
  const profileData = profile as typeof profile & { employer_id?: string | null; company_name?: string | null };
  const employerKey = profileData.employer_id || user.id;

  const [{ count: participantsServed }, { count: completions }, { count: placements }, employerRes] = await Promise.all([
    db.from('applications').select('*', { head: true, count: 'exact' }).eq('employer_id', employerKey),
    db.from('applications').select('*', { head: true, count: 'exact' }).eq('employer_id', employerKey).eq('status', 'completed'),
    db.from('job_placements').select('*', { head: true, count: 'exact' }).eq('employer_id', employerKey).eq('status', 'placed'),
    db.from('employers').select('company_name,business_name').eq('id', employerKey).maybeSingle(),
  ]);

  const companyName = employerRes.data?.company_name || employerRes.data?.business_name || profileData.company_name || profile.full_name || 'Your Organization';

  return (
    <ReportSubmitClient
      companyName={companyName}
      defaults={{
        participantsServed: participantsServed || 0,
        completions: completions || 0,
        placements: placements || 0,
      }}
    />
  );
}
