import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeFormatDate } from '@/lib/format-utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Employer Applications | Admin' };

export default async function EmployerApplicationsPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();
  const [submitted, legacy, drafts, intake] = await Promise.all([
    db
      .from('employer_applications')
      .select('id,company_name,contact_name,email,phone,status,state,created_at')
      .order('created_at', { ascending: false }),
    db
      .from('applications')
      .select('id,first_name,last_name,email,status,created_at,source,type,application_type')
      .or('type.eq.employer,application_type.eq.employer,source.eq.employer-application')
      .order('created_at', { ascending: false }),
    db
      .from('partners')
      .select(
        'id,name,contact_name,contact_email,account_status,approval_status,applied_at,partner_application_id,created_at,notes',
      )
      .eq('partner_type', 'employer')
      .eq('account_status', 'draft')
      .order('created_at', { ascending: false }),
    db
      .from('application_intake')
      .select('id,status,created_at,error,payload,destination_id')
      .eq('application_type', 'employer')
      .or('status.neq.processed,destination_id.is.null,destination_table.neq.employer_applications')
      .order('created_at', { ascending: false }),
  ]);
  if ([submitted, legacy, drafts, intake].some((result) => result.error)) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Employer applications unavailable</h1>
        <p role="alert" className="mt-3">
          One or more employer review queues could not be loaded. No records have been changed.
        </p>
        <Link href="/employers/applications" className="mt-4 inline-block underline">
          Retry
        </Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
      <header>
        <Link href="/employers" className="text-blue-700 underline">
          Employers
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Employer applications</h1>
        <p className="mt-2 text-slate-700">
          Review website submissions, earlier employer requests, and incomplete directory records.
        </p>
        <Link href="/employers/onboarding" className="mt-3 inline-block underline">
          Employer onboarding review
        </Link>
      </header>
      <section aria-labelledby="submitted-title">
        <h2 id="submitted-title" className="text-xl font-bold">
          Website applications ({submitted.data?.length ?? 0})
        </h2>
        <p className="my-2 text-sm text-slate-600">
          Pending review is not approval. Open an application to inspect the submitted details and
          begin onboarding.
        </p>
        <div className="divide-y rounded-xl border">
          {submitted.data?.map((row) => (
            <Link
              key={row.id}
              href={`/employers/applications/${row.id}`}
              className="block p-4 hover:bg-slate-50"
            >
              <strong>{row.company_name}</strong>
              <p>
                {row.contact_name} · {row.email}
              </p>
              <p className="text-sm text-slate-600">
                {row.status} · {row.state} · {safeFormatDate(row.created_at)}
              </p>
            </Link>
          ))}
          {!submitted.data?.length && <p className="p-4">No saved employer applications.</p>}
        </div>
      </section>
      <section aria-labelledby="legacy-title">
        <h2 id="legacy-title" className="text-xl font-bold">
          Earlier employer-form records ({legacy.data?.length ?? 0})
        </h2>
        <p className="my-2 text-sm text-slate-600">
          Some earlier employer-form entries were stored as student records. Review their original
          details before changing their classification.
        </p>
        <div className="divide-y rounded-xl border">
          {legacy.data?.map((row) => (
            <Link
              key={row.id}
              href={`/applications/review/${row.id}`}
              className="block p-4 hover:bg-slate-50"
            >
              <strong>
                {[row.first_name, row.last_name].filter(Boolean).join(' ') || row.email}
              </strong>
              <p>
                {row.email} · {row.status}
              </p>
              <p className="text-sm">
                Recorded type: {row.application_type || row.type || 'Not specified'} ·{' '}
                {safeFormatDate(row.created_at)}
              </p>
            </Link>
          ))}
          {!legacy.data?.length && <p className="p-4">No earlier employer-form records.</p>}
        </div>
      </section>
      <section aria-labelledby="intake-title">
        <h2 id="intake-title" className="text-xl font-bold">
          Submissions needing processing ({intake.data?.length ?? 0})
        </h2>
        <div className="divide-y rounded-xl border">
          {intake.data?.map((row) => (
            <div key={row.id} className="p-4">
              <strong>{row.payload?.company_name || 'Employer request'}</strong>
              <p>
                {row.payload?.contact_name} · {row.payload?.email}
              </p>
              <p>
                Status: {row.status} · Reference: {row.id}
              </p>
              {row.error && <p className="text-red-800">Processing requires attention.</p>}
            </div>
          ))}
          {!intake.data?.length && <p className="p-4">No unprocessed employer submissions.</p>}
        </div>
      </section>
      <section aria-labelledby="draft-title">
        <h2 id="draft-title" className="text-xl font-bold">
          Directory drafts ({drafts.data?.length ?? 0})
        </h2>
        <p className="my-2 text-sm text-slate-600">
          A directory draft is not proof that an organization applied. Records without a linked
          application must be verified before onboarding.
        </p>
        <div className="divide-y rounded-xl border">
          {drafts.data?.map((row) => (
            <div key={row.id} className="p-4">
              <strong>{row.name}</strong>
              <p>
                {row.contact_name} · {row.contact_email}
              </p>
              {row.notes && <p className="my-2 whitespace-pre-wrap text-sm text-slate-700">{row.notes}</p>}
              <p className="text-sm">
                Draft · {row.approval_status || 'Approval not recorded'} ·{' '}
                {row.partner_application_id
                  ? 'Linked partner application'
                  : 'No linked application'}{' '}
                ·{' '}
                {row.applied_at
                  ? `Application date: ${safeFormatDate(row.applied_at)}`
                  : 'No application date recorded'}
              </p>
            </div>
          ))}
          {!drafts.data?.length && <p className="p-4">No employer directory drafts.</p>}
        </div>
      </section>
    </main>
  );
}
