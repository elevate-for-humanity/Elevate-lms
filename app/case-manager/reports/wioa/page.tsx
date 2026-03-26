import { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import WIOAExportButton from './_components/WIOAExportButton';

export const metadata: Metadata = {
  title: 'WIOA Outcomes Report | Case Manager',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function WIOAReportPage() {
  const { user } = await requireRole(['case_manager', 'admin', 'super_admin', 'staff']);

  const supabase = await createClient();
  const admin    = createAdminClient();
  const db       = admin || supabase;

  // Get assigned application IDs
  const { data: assignments } = await supabase
    .from('case_manager_assignments')
    .select('application_id')
    .eq('case_manager_id', user.id);

  const applicationIds = (assignments ?? []).map((a: any) => a.application_id as string);

  // Get emails from applications
  let participantEmails: string[] = [];
  if (applicationIds.length > 0) {
    const { data: apps } = await supabase
      .from('applications')
      .select('email')
      .in('id', applicationIds);
    participantEmails = (apps ?? []).map((a: any) => a.email).filter(Boolean);
  }

  // Get user IDs from profiles
  let participantUserIds: string[] = [];
  if (participantEmails.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .in('email', participantEmails);
    participantUserIds = (profiles ?? []).map((p: any) => p.id);
  }

  // Fetch WIOA participants for these users
  let wioaRows: any[] = [];
  if (participantUserIds.length > 0) {
    const { data } = await supabase
      .from('wioa_participants')
      .select(`
        id, user_id, first_name, last_name, email,
        wioa_program, eligibility_status, eligibility_determined_date,
        employment_status_at_entry, highest_education_level,
        is_veteran, has_disability, is_low_income,
        is_dislocated_worker, is_youth, is_ex_offender,
        created_at
      `)
      .in('user_id', participantUserIds)
      .order('last_name', { ascending: true });
    wioaRows = data ?? [];
  }

  // Fetch outcome records for these participants
  const wioaIds = wioaRows.map((w) => w.id);
  const outcomesByParticipant: Record<string, any> = {};

  if (wioaIds.length > 0) {
    const { data: outcomes } = await supabase
      .from('wioa_participant_records')
      .select(`
        participant_id,
        program_entry_date, program_exit_date,
        employed_q2_after_exit, employed_q4_after_exit,
        median_earnings_q2, credential_attained, measurable_skill_gain,
        reporting_period_start, reporting_period_end
      `)
      .in('participant_id', wioaIds)
      .order('reporting_period_end', { ascending: false });

    // Keep most recent record per participant
    for (const o of outcomes ?? []) {
      if (!outcomesByParticipant[o.participant_id]) {
        outcomesByParticipant[o.participant_id] = o;
      }
    }
  }

  // Fetch verified placements for these users
  const placementsByUser: Record<string, any> = {};
  if (participantUserIds.length > 0) {
    const { data: placements } = await supabase
      .from('placement_records')
      .select('learner_id, employer_name, job_title, hourly_wage, start_date, status')
      .in('learner_id', participantUserIds)
      .eq('status', 'verified')
      .order('start_date', { ascending: false });

    for (const p of placements ?? []) {
      if (!placementsByUser[p.learner_id]) {
        placementsByUser[p.learner_id] = p;
      }
    }
  }

  // Summary metrics
  const total          = wioaRows.length;
  const employed       = wioaRows.filter((w) => !!placementsByUser[w.user_id]).length;
  const credentialed   = Object.values(outcomesByParticipant).filter((o: any) => o.credential_attained).length;
  const skillGain      = Object.values(outcomesByParticipant).filter((o: any) => o.measurable_skill_gain).length;
  const q2Employed     = Object.values(outcomesByParticipant).filter((o: any) => o.employed_q2_after_exit).length;

  const eligBadge = (status: string) => {
    if (status === 'eligible')    return 'bg-green-100 text-green-800';
    if (status === 'pending')     return 'bg-yellow-100 text-yellow-800';
    if (status === 'ineligible')  return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/case-manager/dashboard" className="hover:underline">Dashboard</Link>
          <span className="mx-1">/</span>
          <span>WIOA Outcomes Report</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WIOA Outcomes Report</h1>
            <p className="text-sm text-gray-500 mt-1">
              {total} participant{total !== 1 ? 's' : ''} · Performance period outcomes
            </p>
          </div>
          <WIOAExportButton caseManagerId={user.id} />
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-8">
          {[
            { label: 'Participants',      value: total },
            { label: 'Employed',          value: employed },
            { label: 'Q2 Employed',       value: q2Employed },
            { label: 'Credentials',       value: credentialed },
            { label: 'Skill Gains',       value: skillGain },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {wioaRows.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-500">No WIOA participants found for your assigned caseload.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Participant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Eligibility</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Entry Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Barriers</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Entry Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Exit Date</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Q2 Emp.</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Q4 Emp.</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Credential</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Skill Gain</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Q2 Earnings</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Placement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wioaRows.map((w) => {
                  const outcome   = outcomesByParticipant[w.id];
                  const placement = placementsByUser[w.user_id];
                  const barriers  = [
                    w.is_veteran        && 'Veteran',
                    w.has_disability    && 'Disability',
                    w.is_low_income     && 'Low income',
                    w.is_dislocated_worker && 'Dislocated',
                    w.is_youth          && 'Youth',
                    w.is_ex_offender    && 'Ex-offender',
                  ].filter(Boolean).join(', ') || '—';

                  return (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        <Link
                          href={`/case-manager/participants`}
                          className="hover:underline text-brand-blue-600"
                        >
                          {w.first_name} {w.last_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{w.wioa_program ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${eligBadge(w.eligibility_status ?? '')}`}>
                          {w.eligibility_status ?? 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{w.employment_status_at_entry ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs max-w-[160px] truncate" title={barriers}>{barriers}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {outcome?.program_entry_date ? new Date(outcome.program_entry_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {outcome?.program_exit_date ? new Date(outcome.program_exit_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">{outcome ? (outcome.employed_q2_after_exit ? '✅' : '❌') : '—'}</td>
                      <td className="px-4 py-3 text-center">{outcome ? (outcome.employed_q4_after_exit ? '✅' : '❌') : '—'}</td>
                      <td className="px-4 py-3 text-center">{outcome ? (outcome.credential_attained ? '✅' : '❌') : '—'}</td>
                      <td className="px-4 py-3 text-center">{outcome ? (outcome.measurable_skill_gain ? '✅' : '❌') : '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                        {outcome?.median_earnings_q2 ? `$${Number(outcome.median_earnings_q2).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {placement ? `${placement.employer_name ?? ''}${placement.hourly_wage ? ` · $${placement.hourly_wage}/hr` : ''}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
