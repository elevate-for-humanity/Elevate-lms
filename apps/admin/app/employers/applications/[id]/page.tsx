import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeFormatDate } from '@/lib/format-utils';
import { beginEmployerOnboarding } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Review Employer Application | Admin' };

export default async function EmployerApplicationReview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['admin', 'staff']);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await requireAdminClient();
  const { data: app, error } = await db
    .from('employer_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('Unable to load employer application.');
  if (!app) notFound();
  const canBegin = ['pending', 'in_review'].includes(app.status) && app.state !== 'draft' && app.company_name && app.email && !/@example\.(com|org|net)$/i.test(app.email);
  const details = { ...(app.intake || {}), ...(app.data || {}) };
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <Link href="/employers/applications" className="text-blue-700 underline">
        Employer applications
      </Link>
      <h1 className="text-3xl font-bold">{app.company_name}</h1>
      <p>
        {app.contact_name} · {app.email} · {app.phone || 'No phone supplied'}
      </p>
      <p>
        Status: {app.status} · {app.state} · Received {safeFormatDate(app.created_at)}
      </p>
      <p className="text-sm text-slate-600">Application reference: {app.id}</p>
      <dl className="space-y-4 rounded-xl border p-5">
        {[
          ['Industry', details.industry],
          ['Employee count', details.employee_count],
          ['Hiring and workforce needs', details.hiring_needs],
          ['Additional information', details.notes],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="font-bold">{label}</dt>
            <dd className="whitespace-pre-wrap break-words">{value || 'Not supplied'}</dd>
          </div>
        ))}
      </dl>
      {details.employer_id ? (
        <Link
          href={`/employers/${details.employer_id}`}
          className="inline-block rounded-lg bg-blue-800 px-5 py-3 font-bold text-white"
        >
          Open linked employer
        </Link>
      ) : (
        canBegin && (
          <form action={beginEmployerOnboarding} className="space-y-3 rounded-xl border p-5">
            <input type="hidden" name="applicationId" value={app.id} />
            <p>
              Begin onboarding creates a pending employer record for this request. It does not
              approve the employer, sign agreements, create login access, or send email.
            </p>
            <button className="rounded-lg bg-blue-800 px-5 py-3 font-bold text-white">
              Begin employer onboarding
            </button>
          </form>
        )
      )}
    </main>
  );
}
