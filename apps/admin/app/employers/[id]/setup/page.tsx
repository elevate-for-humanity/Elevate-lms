import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { prepareEmployerAccount } from './actions';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Employer Dashboard Preparation' };
export default async function EmployerPreparationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['admin']);
  const { id } = await params;
  const db = await requireAdminClient();
  const { data: employer, error } = await db
    .from('employers')
    .select('id,company_name,contact_name,email,contact_email,owner_user_id,approved,status')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('Employer could not be loaded');
  if (!employer) notFound();
  const { data: documents, error: fileError } = await db
    .from('documents')
    .select('id,file_name,status,user_id')
    .eq('owner_type', 'employer')
    .eq('owner_id', id);
  if (fileError) throw new Error('Employer files could not be loaded');
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href={`/employers/${id}`} className="text-blue-700 underline">
        Employer record
      </Link>
      <h1 className="text-3xl font-bold">Prepare employer dashboard</h1>
      <h2 className="text-xl font-semibold">{employer.company_name}</h2>
      <p>
        {employer.contact_name} · {employer.email || employer.contact_email}
      </p>
      <p className="rounded-lg bg-amber-50 p-4">
        Preparing this account does not send an invitation, confirm email ownership, approve the
        employer, sign agreements, or activate training. The recipient must verify their email when
        invited.
      </p>
      <p>
        Login linked: {employer.owner_user_id ? 'Yes' : 'No'}. Employer approval:{' '}
        {employer.approved ? 'Approved' : 'Pending'}.
      </p>
      <form action={prepareEmployerAccount}>
        <input type="hidden" name="employerId" value={id} />
        <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
          Prepare account and link files — no email
        </button>
      </form>
      <section className="rounded-lg border p-5">
        <h2 className="text-xl font-bold">Organization files</h2>
        <ul className="mt-4 space-y-3">
          {documents?.map((doc) => (
            <li key={doc.id}>
              <Link className="text-blue-700 underline" href={`/documents/review/${doc.id}`}>
                {doc.file_name}
              </Link>{' '}
              — {doc.status},{' '}
              {doc.user_id === employer.owner_user_id && doc.user_id
                ? 'linked to login'
                : 'awaiting account linkage'}
            </li>
          ))}
        </ul>
      </section>
      <p>Invitation remains a separate action after dashboard testing and document review.</p>
    </main>
  );
}
