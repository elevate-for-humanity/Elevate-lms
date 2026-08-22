import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { resolveCaseManagerParticipant } from '@/lib/case-manager/participant-scope';
import { loadParticipant360ByApplication } from '@/lib/participants/participant-360';
import AddPlacementForm from './_components/AddPlacementForm';

export const metadata: Metadata = {
  title: 'Participant 360 | Case Manager',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }> }

function text(value: unknown, fallback = '—') {
  return value === null || value === undefined || value === '' ? fallback : String(value);
}
function date(value: unknown) {
  if (!value) return '—';
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('en-US');
}
function badge(status: unknown) {
  const value = String(status || '').toLowerCase();
  if (['verified', 'active', 'approved', 'completed', 'issued'].includes(value)) return 'bg-emerald-100 text-emerald-900';
  if (['pending', 'in_progress', 'submitted'].includes(value)) return 'bg-amber-100 text-amber-900';
  if (['rejected', 'lost', 'expired', 'revoked'].includes(value)) return 'bg-red-100 text-red-900';
  return 'bg-slate-100 text-slate-800';
}

export default async function ParticipantDetailPage({ params }: Props) {
  const { id } = await params;
  const { user, effectiveRoles } = await requireRole(['case_manager', 'admin', 'staff']);
  const supabase = await createClient();
  const admin = await requireAdminClient();
  const db = admin || supabase;

  const scoped = await resolveCaseManagerParticipant(id, { db, userId: user.id, effectiveRoles });
  if (!scoped) notFound();

  const record = await loadParticipant360ByApplication(db, id);
  if (!record) notFound();

  const app = record.application;
  const profile = record.profile;
  const participantName =
    profile?.full_name ||
    `${app.first_name ?? ''} ${app.last_name ?? ''}`.trim() ||
    'Participant';
  const activeEnrollments = record.enrollments.filter((row: any) =>
    ['active', 'enrolled', 'in_progress'].includes(String(row.enrollment_state || row.status || '').toLowerCase()),
  );
  const verifiedPlacements = record.placements.filter((row: any) => String(row.status).toLowerCase() === 'verified');
  const verifiedCredentials = record.credentials.filter((row: any) =>
    ['active', 'issued', 'verified'].includes(String(row.status || 'active').toLowerCase()),
  );
  const unresolvedDocuments = record.documents.filter((row: any) =>
    !['approved', 'verified', 'complete', 'completed'].includes(String(row.verification_status || row.status || '').toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-600">
          <Link href="/case-manager/dashboard" className="font-semibold hover:underline">Dashboard</Link>
          <span className="mx-2">/</span>
          <Link href="/case-manager/participants" className="font-semibold hover:underline">Participants</Link>
          <span className="mx-2">/</span><span>{participantName}</span>
        </nav>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">Participant 360</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{participantName}</h1>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {text(profile?.email || app.email)} {profile?.phone || app.phone ? `· ${profile?.phone || app.phone}` : ''}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Canonical learner ID: {record.learnerId || 'Not linked yet'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Status value={app.status || 'application'} />
              {record.wioa ? <Status value={record.wioa.eligibility_status || record.wioa.status || 'WIOA record'} /> : null}
            </div>
          </div>
        </section>

        {Object.keys(record.sourceErrors).length > 0 ? (
          <section role="alert" className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
            <h2 className="font-black">Some record sources are unavailable</h2>
            <p className="mt-1 text-sm font-medium">No values were fabricated. The unavailable sources are shown so data/schema issues can be corrected.</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {Object.entries(record.sourceErrors).map(([source, error]) => <li key={source}><strong>{source}:</strong> {error}</li>)}
            </ul>
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Participant summary">
          <Metric label="Active enrollments" value={activeEnrollments.length} />
          <Metric label="Credentials" value={verifiedCredentials.length} />
          <Metric label="Verified placements" value={verifiedPlacements.length} />
          <Metric label="Open documents" value={unresolvedDocuments.length} />
          <Metric label="Case notes" value={record.caseNotes.length} />
        </section>

        <div className="mt-7 grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
          <div className="space-y-6">
            <Section title="Enrollments & training">
              <DataTable
                headers={['Program', 'Status', 'Progress', 'Funding', 'Enrolled']}
                empty="No enrollments found."
                rows={record.enrollments.map((e: any) => [
                  e.programs?.title || e.programs?.name || e.program_slug || 'Program',
                  <Status key="status" value={e.enrollment_state || e.status || 'unknown'} />,
                  `${Number(e.progress_percent ?? e.progress ?? 0)}%`,
                  text(e.funding_source),
                  date(e.enrolled_at || e.created_at),
                ])}
              />
            </Section>

            <Section title="Funding & authorized services">
              <DataTable
                headers={['Source', 'Status', 'Amount', 'Assigned']}
                empty="No funding assignments linked to this participant's enrollments."
                rows={record.fundingAssignments.map((f: any) => [
                  f.funding_sources?.name || f.funding_source || f.source || 'Funding source',
                  <Status key="status" value={f.status || 'assigned'} />,
                  f.amount != null ? `$${Number(f.amount).toLocaleString()}` : '—',
                  date(f.created_at || f.assigned_at),
                ])}
              />
            </Section>

            <Section title="Apprenticeship">
              <DataTable
                headers={['Program / Employer', 'Status', 'Hours', 'Started']}
                empty="No apprenticeship enrollment linked to this participant."
                rows={record.apprenticeshipEnrollments.map((a: any) => [
                  a.program_name || a.employer_name || a.occupation || 'Apprenticeship',
                  <Status key="status" value={a.status || 'active'} />,
                  a.total_hours_completed != null ? `${a.total_hours_completed} / ${a.total_hours_required ?? '—'}` : '—',
                  date(a.start_date || a.created_at),
                ])}
              />
            </Section>

            <Section title="Employment placements">
              <DataTable
                headers={['Employer', 'Title', 'Type', 'Wage', 'Status']}
                empty="No placements recorded."
                rows={record.placements.map((p: any) => [
                  text(p.employer_name), text(p.job_title), text(p.employment_type),
                  p.hourly_wage ? `$${Number(p.hourly_wage).toFixed(2)}/hr` : '—',
                  <Status key="status" value={p.status || 'unknown'} />,
                ])}
              />
              {record.learnerId ? <div className="mt-5 border-t border-slate-100 pt-5"><AddPlacementForm learnerId={record.learnerId} caseManagerId={user.id} /></div> : null}
            </Section>

            <Section title="Credentials">
              <DataTable
                headers={['Credential', 'Type', 'Issued', 'Expires', 'Status']}
                empty="No credentials on record."
                rows={record.credentials.map((c: any) => [
                  c.credential_name || c.name || 'Credential', text(c.credential_type || c.type),
                  date(c.issued_date || c.issued_at), date(c.expiry_date || c.expires_at),
                  <Status key="status" value={c.status || 'active'} />,
                ])}
              />
            </Section>

            <Section title="Documents & evidence">
              <DataTable
                headers={['Document', 'Type', 'Status', 'Uploaded']}
                empty="No participant documents found."
                rows={record.documents.map((d: any) => [
                  d.file_name || d.title || d.document_type || 'Document', text(d.document_type),
                  <Status key="status" value={d.verification_status || d.status || 'pending'} />, date(d.created_at || d.uploaded_at),
                ])}
              />
            </Section>

            <Section title="Case notes">
              {record.caseNotes.length ? <div className="space-y-3">{record.caseNotes.map((n: any) => (
                <article key={n.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">{n.category || 'Case note'}</p><time className="text-xs font-semibold text-slate-500">{date(n.created_at)}</time></div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{n.note || n.notes || n.content || '—'}</p>
                  {n.author_name ? <p className="mt-2 text-xs font-semibold text-slate-500">By {n.author_name}</p> : null}
                </article>
              ))}</div> : <Empty>No case notes found.</Empty>}
            </Section>

            <Section title="Recent activity & communications">
              <div className="grid gap-5 lg:grid-cols-2">
                <div><h3 className="mb-3 font-black">Activity</h3>{record.activity.length ? <Timeline rows={record.activity} /> : <Empty>No learner activity recorded.</Empty>}</div>
                <div><h3 className="mb-3 font-black">Communications</h3>{record.communications.length ? <Timeline rows={record.communications} /> : <Empty>No communications recorded.</Empty>}</div>
              </div>
            </Section>
          </div>

          <aside className="space-y-5">
            <Section title="Application">
              <dl className="space-y-3 text-sm">
                <Row label="Status" value={text(app.status)} />
                <Row label="Program" value={text(app.program_interest || app.program_name)} />
                <Row label="Applied" value={date(app.created_at)} />
                <Row label="City / State" value={[profile?.city, profile?.state].filter(Boolean).join(', ') || '—'} />
                {app.notes ? <Row label="Intake notes" value={text(app.notes)} /> : null}
              </dl>
            </Section>

            <Section title="WIOA / workforce record">
              {record.wioa ? <dl className="space-y-3 text-sm">
                <Row label="Program" value={text(record.wioa.wioa_program || record.wioa.program || record.wioa.program_id)} />
                <Row label="Eligibility" value={text(record.wioa.eligibility_status || record.wioa.status)} />
                <Row label="Enrollment" value={date(record.wioa.enrollment_date)} />
                <Row label="Exit" value={date(record.wioa.exit_date)} />
                {record.wioa.exit_reason ? <Row label="Exit reason" value={text(record.wioa.exit_reason)} /> : null}
              </dl> : <Empty>No WIOA participant record linked.</Empty>}
            </Section>

            <Section title="Record integrity">
              <dl className="space-y-3 text-sm">
                <Row label="Identity link" value={record.learnerId ? 'Linked to profile/user ID' : 'Application only'} />
                <Row label="Data sources loaded" value={String(10 - Object.keys(record.sourceErrors).length)} />
                <Row label="Data source errors" value={String(Object.keys(record.sourceErrors).length)} />
              </dl>
            </Section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 bg-slate-50 px-5 py-4"><h2 className="font-black text-slate-950">{title}</h2></div><div className="p-5">{children}</div></section>;
}
function Metric({ label, value }: { label: string; value: number }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-3xl font-black">{value}</p><p className="mt-1 text-sm font-semibold text-slate-600">{label}</p></article>;
}
function Status({ value }: { value: unknown }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${badge(value)}`}>{text(value, 'unknown')}</span>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-0"><dt className="shrink-0 font-semibold text-slate-600">{label}</dt><dd className="text-right font-bold text-slate-900">{value}</dd></div>;
}
function Empty({ children }: { children: React.ReactNode }) { return <p className="rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-600">{children}</p>; }
function DataTable({ headers, rows, empty }: { headers: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-slate-200">{headers.map((header) => <th key={header} className="px-3 py-3 text-xs font-black uppercase tracking-wide text-slate-600">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-3 align-top font-medium text-slate-700">{cell}</td>)}</tr>)}</tbody></table></div>;
}
function Timeline({ rows }: { rows: any[] }) {
  return <ol className="space-y-3">{rows.slice(0, 20).map((row: any, index) => <li key={row.id || index} className="border-l-2 border-slate-200 pl-3"><p className="text-sm font-bold text-slate-900">{row.title || row.event_type || row.action || row.subject || row.type || row.channel || 'Activity'}</p><p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{row.description || row.message || row.body || row.details || row.status || ''}</p><time className="mt-1 block text-xs font-semibold text-slate-400">{date(row.created_at || row.sent_at || row.updated_at)}</time></li>)}</ol>;
}
