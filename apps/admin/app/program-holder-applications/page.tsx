import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { isActiveProgramHolderScopeProgram, programHolderApplicationScope, programHolderInterest, programHolderScopeReview, PROGRAM_HOLDER_SCOPE_INTAKE_FIELDS } from '@/lib/program-holder/program-interest';
import ProgramHolderApplicationActions from './ProgramHolderApplicationActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Holder Applications | Elevate For Humanity',
  description: 'Review and process program holder applications.',
};

function statusClass(status: string) {
  if (status === 'pending') return 'bg-amber-100 text-amber-800';
  if (status === 'approved' || status === 'approved_pending_user') return 'bg-green-100 text-green-800';
  if (status === 'denied') return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-700';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function ProgramHolderApplicationsPage() {
  await requireRole(['admin']);
  const supabase = await requireAdminClient();

  const [{ data: applications, error: applicationError }, { data: catalog, error: catalogError }] = await Promise.all([
    supabase.from('program_holder_applications').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('programs').select('id,slug,title,name,is_active,status')
      .eq('is_active', true).in('status', ['active', 'published']).order('title'),
  ]);
  if (applicationError) throw new Error('Program Holder applications are temporarily unavailable.');
  const programs = (catalogError ? [] : catalog || []).filter(isActiveProgramHolderScopeProgram)
    .map((program) => ({ id: program.id, slug: program.slug, title: String(program.title || program.name || program.slug) }));
  const { data: intakes, error: intakeError } = applications?.length
    ? await supabase.from('application_intake').select(PROGRAM_HOLDER_SCOPE_INTAKE_FIELDS)
      .eq('application_type', 'program_holder').eq('destination_table', 'program_holder_applications')
      .in('destination_id', applications.map((application) => application.id))
    : { data: [], error: null };
  const scopeData = new Map<string, Record<string, unknown>>();
  const scopeFailures = new Set<string>();
  for (const application of applications || []) {
    const data: Record<string, unknown> = application.data && typeof application.data === 'object' && !Array.isArray(application.data) ? application.data : {};
    const bound = (intakes || []).filter((intake) => intake.destination_id === application.id);
    try {
      if (intakeError || bound.length > 1) throw new Error('Scope authority is unavailable.');
      scopeData.set(application.id, programHolderApplicationScope(application.id, data, bound[0] || null));
    } catch {
      scopeFailures.add(application.id);
      scopeData.set(application.id, { ...data, program_scope_review: undefined });
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Program Holder Applications</h1>
            <p className="text-slate-600 mt-1">Review and process program holder requests.</p>
          </div>
          <Link
            href="/program-holders"
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Back to Program Holders
          </Link>
        </div>

        {catalogError ? <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-4 text-amber-900">The program catalog could not be loaded. Refresh before resolving or approving a program scope review.</p> : null}
        {scopeFailures.size > 0 ? <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-4 text-amber-900">Original intake records could not be verified for some applications. Their review actions are paused until the records can be confirmed.</p> : null}
        {applications && applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Organization</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Contact</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Program scope</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app: any) => {
                  const data = scopeData.get(app.id) || {};
                  const interest = programHolderInterest(data.requested_program_interest);
                  const review = programHolderScopeReview(data);
                  return (
                  <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{app.organization_name || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{app.contact_name || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <a href={`mailto:${app.email}`} className="text-blue-600 hover:underline">
                        {app.email || 'N/A'}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{app.phone || 'N/A'}</td>
                    <td className="min-w-64 space-y-2 py-3 px-4 text-sm text-slate-700">
                      {data.requested_program_interest ? (
                        <p><strong>Original interest:</strong> {interest?.label || String(data.requested_program_interest)}</p>
                      ) : <p><strong>Requested programs:</strong> {Array.isArray(data.requested_program_slugs) ? data.requested_program_slugs.map(String).join(', ') || 'Not provided' : 'Not provided'}</p>}
                      {review ? <>
                        <p><strong>Reviewed program:</strong> {review.program_title} ({review.program_slug})</p>
                        <p>{review.note}</p>
                        <p className="text-xs text-slate-500">Scope recorded {formatDate(review.reviewed_at)}</p>
                      </> : data.requested_program_interest ? <p className="font-medium text-amber-800">Scope review required before approval</p> : null}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(app.status)}`}>
                        {app.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(app.created_at)}</td>
                    <td className="py-3 px-4">
                      <ProgramHolderApplicationActions
                        applicationId={app.id}
                        disabled={app.status !== 'pending' || scopeFailures.has(app.id)}
                        applicationData={data}
                        updatedAt={app.updated_at ?? null}
                        programs={programs}
                      />
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No program holder applications found.
          </div>
        )}
      </div>
    </div>
  );
}
