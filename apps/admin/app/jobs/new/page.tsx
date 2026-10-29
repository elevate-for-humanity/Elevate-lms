import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import JobForm from '../JobForm';
import { createJob } from '../actions';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Post New Job | Admin' };
export default async function NewJob({ searchParams }: { searchParams: Promise<{ employer?: string }> }) {
  await requireRole(['admin']);
  const db = await requireAdminClient();
  const { data: employers, error } = await db.from('employers').select('id,business_name,company_name,approved').order('business_name');
  if (error) throw new Error('Unable to load employers.');
  const { employer } = await searchParams;
  return <main className="mx-auto max-w-3xl space-y-6 p-6"><h1 className="text-3xl font-bold">Post New Job</h1><JobForm action={createJob} employers={employers || []} employerId={employer} /></main>;
}
