import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import JobForm from '../JobForm';
import { updateJob } from '../actions';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Review Job | Admin' };
export default async function ReviewJob({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['admin']);
  const { id } = await params;
  const db = await requireAdminClient();
  const [{ data: job, error }, { data: employers, error: employerError }] = await Promise.all([
    db.from('job_postings').select('*').eq('id', id).maybeSingle(),
    db.from('employers').select('id,business_name,company_name,approved').order('business_name'),
  ]);
  if (error || employerError) throw new Error('Unable to load job review.');
  if (!job) notFound();
  return <main className="mx-auto max-w-3xl space-y-6 p-6"><h1 className="text-3xl font-bold">Review Job: {job.title}</h1><p>Status: {job.status}</p><JobForm action={updateJob.bind(null, id)} employers={employers || []} job={job} /></main>;
}
