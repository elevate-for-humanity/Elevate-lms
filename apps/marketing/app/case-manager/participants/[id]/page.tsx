import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import AddPlacementForm from './_components/AddPlacementForm';

export const metadata: Metadata = {
  title: 'Participant Detail | Case Manager',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ParticipantDetailPage({ params }: Props) {
  const { id } = await params;
  const { user } = await requireRole(['case_manager', 'admin', 'staff']);

  const supabase = await createClient();
  const admin = await requireAdminClient();
  const db = admin || supabase;

  // Verify this application is assigned to this case manager (or user is admin)
  const { data: assignment } = await supabase
    .from('case_manager_assignments')
    .select('application_id')
    .eq('application_id', id)
    .eq('case_manager_id', user.id)
    .maybeSingle();

  // Admins can view any participant
  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = ['admin', 'staff'].includes(profileData?.role ?? '');

  if (!assignment && !isAdmin) notFound();

  // Fetch application
  const { data: app } = await supabase
    .from('applications')
    .select('id, first_name, last_name, email, phone, program_interest, status, created_at, notes')
    .eq('id', id)
    .maybeSingle();

  if (!app) notFound();

  // Look up profile by email
  const { data: learnerProfile } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, city, state, date_of_birth')
    .eq('email', app.email)
    .maybeSingle();

  const learnerId = learnerProfile?.id ?? null;

  // Enrollments
  const { data: enrollments } = learnerId
    ? await supabase
        .from('program_enrollments')
        .select(
          'id, status, progress_percent, funding_source, enrolled_at, programs:program_id(name, title)',
        )
        .eq('user_id', learnerId)
        .order('enrolled_at', { ascending: false })
    : { data: [] };

  // Credentials
  const { data: credentials } = learnerId
    ? await supabase
        .from('credentials')
        .select('id, credential_name, credential_type, issued_date, expiry_date, status')
        .eq('user_id', learnerId)
        .order('issued_date', { ascending: false })
    : { data: [] };

  // Placements
  const { data: placements } = learnerId
    ? await supabase
        .from('placement_records')
        .select(
          'id, employer_name, job_title, employment_type, hourly_wage, start_date, status, verified_at',
        )
        .eq('learner_id', learnerId)
        .order('created_at', { ascending: false })
    : { data: [] };

  // WIOA record
  const { data: wioa } = learnerId
    ? await supabase
        .from('wioa_participants')
        .select('id, wioa_program, eligibility_status, enrollment_date, exit_date, exit_reason')
        .eq('user_id', learnerId)
        .maybeSingle()
    : { data: null };

  const statusBadge = (status: string) => {
    if (status === 'verified' || status === 'active' || status === 'approved')
      return 'bg-brand-green-100 text-brand-green-800';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (status === 'rejected' || status === 'lost') return 'bg-red-100 text-red-800';
    return 'bg-slate-100 text-slate-900';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-700 mb-4">
          <Link href="/case-manager/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <span className="mx-1">/</span>
          <Link href="/case-manager/participants" className="hover:underline">
            Participants
          </Link>
          <span className="mx-1">/</span>
          <span>
            {app.first_name} {app.last_name}
          </span>
        </nav>

        <h1 className="text-2xl font-bold text-slate-900">
          {app.first_name} {app.last_name}
        </h1>
        <p className="text-sm text-slate-700 mt-1">
          {app.email} {app.phone ? `· ${app.phone}` : ''}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enrollments */}
            <Section title="Enrollments">
              {!enrollments?.length ? (
                <p className="text-sm text-slate-700">No enrollments found.</p>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">
                        Program
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">
                        Progress
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">
                        Funding
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrollments.map((e: any) => (
                      <tr key={e.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {(e.programs as any)?.title || (e.programs as any)?.name || '—'}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(e.status)}`}
                          >
                            {e.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-900">{e.progress_percent ?? 0}%</td>
                        <td className="px-3 py-2 text-slate-700">{e.funding_source ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            {/* Placements */}
            <Section title="Employment Placements">
              {!placements?.length ? (
                <p className="text-sm text-slate-700 mb-4">No placements recorded.</p>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-sm mb-4">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">
                        Employer
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">
                        Title
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">
                        Wage
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {placements.map((p: any) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {p.employer_name ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-900">{p.job_title ?? '—'}</td>
                        <td className="px-3 py-2 text-slate-700">{p.employment_type ?? '—'}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {p.hourly_wage ? `$${p.hourly_wage}/hr` : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(p.status)}`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {learnerId && <AddPlacementForm learnerId={learnerId} caseManagerId={user.id} />}
            </Section>

            {/* Credentials */}
            <Section title="Credentials">
              {!credentials?.length ? (
                <p className="text-sm text-slate-700">No credentials on record.</p>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">
                        Credential
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">
                        Issued
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">
                        Expires
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {credentials.map((c: any) => (
                      <tr key={c.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {c.credential_name}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{c.credential_type ?? '—'}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {c.issued_date ? new Date(c.issued_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(c.status ?? 'active')}`}
                          >
                            {c.status ?? 'active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
          </div>

          {/* Right column — sidebar */}
          <div className="space-y-4">
            {/* Application info */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Application
              </h3>
              <dl className="space-y-2 text-sm">
                <Row label="Status" value={app.status ?? '—'} />
                <Row label="Program" value={app.program_interest ?? '—'} />
                <Row label="Applied" value={new Date(app.created_at).toLocaleDateString()} />
                {app.notes && <Row label="Notes" value={app.notes} />}
              </dl>
            </div>

            {/* WIOA */}
            {wioa && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  WIOA
                </h3>
                <dl className="space-y-2 text-sm">
                  <Row label="Program" value={wioa.wioa_program ?? '—'} />
                  <Row label="Eligibility" value={wioa.eligibility_status ?? '—'} />
                  <Row
                    label="Enrolled"
                    value={
                      wioa.enrollment_date
                        ? new Date(wioa.enrollment_date).toLocaleDateString()
                        : '—'
                    }
                  />
                  {wioa.exit_date && (
                    <Row label="Exited" value={new Date(wioa.exit_date).toLocaleDateString()} />
                  )}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-700 shrink-0">{label}</dt>
      <dd className="text-slate-900 text-right">{value}</dd>
    </div>
  );
}
