import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { loadLearnerWorkspace } from '@/lib/learner/workspace';
import { createClient } from '@/lib/supabase/server';
import { BillingAuthorizationUpload } from './BillingAuthorizationUpload';

export const dynamic = 'force-dynamic';

export default async function LearnerDocumentsPage() {
  const { user } = await requireRole(['student', 'learner', 'admin']);
  const workspace = await loadLearnerWorkspace(user.id);
  const db = await createClient();
  const { data: billingAuthorizations } = await db
    .from('billing_migration_authorizations')
    .select('id,product_name,amount_cents,cadence,status,document_name,rejection_reason')
    .eq('user_id', user.id)
    .in('status', ['requested', 'submitted', 'rejected'])
    .order('created_at', { ascending: false });
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-black">Documents & Records</h1>
      <p className="mt-2 text-slate-700">
        Review required documents, submitted evidence, agreements, certificates, and permanent
        learner records.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/lms/agreements"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-950"
        >
          Agreements
        </Link>
        <Link
          href="/lms/certificates"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-950"
        >
          Certificates
        </Link>
      </div>
      {(billingAuthorizations || []).map((authorization) => (
        <section
          key={authorization.id}
          className="mt-6 rounded-2xl border-2 border-red-400 bg-red-50 p-6"
        >
          <h2 className="text-xl font-black text-red-950">
            Action required: new subscription authorization
          </h2>
          <p className="mt-2 font-semibold text-red-900">
            Stripe is being retired. Upload the signed authorization for{' '}
            {authorization.product_name}:{' '}
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
              Number(authorization.amount_cents) / 100,
            )}{' '}
            {authorization.cadence}. Elevate will review it before the QuickBooks schedule replaces
            the Stripe subscription.
          </p>
          <p className="mt-2 text-sm font-bold capitalize text-red-950">
            Status: {authorization.status.replace('_', ' ')}
          </p>
          {authorization.document_name ? (
            <p className="mt-1 text-sm text-red-900">Uploaded: {authorization.document_name}</p>
          ) : null}
          {authorization.rejection_reason ? (
            <p className="mt-2 font-bold text-red-800">
              Correction needed: {authorization.rejection_reason}
            </p>
          ) : null}
          {authorization.status !== 'submitted' ? (
            <BillingAuthorizationUpload authorizationId={authorization.id} />
          ) : (
            <p className="mt-3 text-sm font-semibold text-red-900">
              Your document is awaiting staff review.
            </p>
          )}
        </section>
      ))}
      {workspace.requirements.length === 0 ? (
        <div role="alert" className="mt-6 rounded-2xl border-2 border-red-300 bg-red-50 p-6">
          <h2 className="font-black text-red-950">Document requirements are not configured</h2>
          <p className="mt-2 text-red-900">
            This does not mean onboarding is complete. Learner support must configure the
            requirements for your program.
          </p>
          <Link
            href="/lms/support"
            className="mt-4 inline-flex rounded-xl bg-red-700 px-5 py-3 font-black text-white"
          >
            Contact learner support
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {workspace.requirements.map((requirement) => {
            const complete = ['verified', 'completed'].includes(requirement.status);
            const urgent =
              !complete &&
              (requirement.priority === 'high' ||
                requirement.priority === 'urgent' ||
                (requirement.due_date && new Date(requirement.due_date) < new Date()));
            return (
              <article
                key={requirement.id}
                className={`rounded-2xl border-l-4 p-5 ${complete ? 'border-emerald-500 bg-emerald-50' : urgent ? 'border-red-600 bg-red-50' : 'border-amber-500 bg-amber-50'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-black">{requirement.title}</h2>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black capitalize">
                    {requirement.status.replace(/_/g, ' ')}
                  </span>
                </div>
                {requirement.description ? (
                  <p className="mt-2 text-sm">{requirement.description}</p>
                ) : null}
                {requirement.due_date ? (
                  <p className="mt-2 text-sm font-bold">
                    Due {new Date(requirement.due_date).toLocaleDateString()}
                  </p>
                ) : null}
                {!complete ? (
                  <Link
                    href={`/lms/documents/upload?requirement=${requirement.id}`}
                    className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white"
                  >
                    {requirement.status === 'rejected' ? 'Replace document' : 'Upload document'}
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
