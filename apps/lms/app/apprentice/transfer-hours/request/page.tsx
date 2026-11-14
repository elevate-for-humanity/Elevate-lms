import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import TransferHoursRequestForm from './TransferHoursRequestForm';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Transfer Hours Request | Apprentice' };
export default async function TransferHoursRequestPage() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) redirect('/login?redirect=/apprentice/transfer-hours/request');
  const programSlug = await resolveApprenticeProgramSlug(db, subject.userId);
  const { data: enrollment, error } = await db.from('program_enrollments').select('id')
    .or(`user_id.eq.${subject.userId},student_id.eq.${subject.userId}`)
    .eq('program_slug', programSlug || '').in('status', ['active', 'enrolled', 'in_progress', 'confirmed'])
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return <main className="mx-auto max-w-3xl px-4 py-8"><Link href="/apprentice/transfer-hours" className="font-bold underline">Back to transfer hours</Link><h1 className="mt-5 text-3xl font-black">Request prior training credit</h1>{subject.previewing ? <p className="mt-5" role="status">Admin preview is read-only. The learner must submit their own evidence.</p> : enrollment ? <TransferHoursRequestForm enrollmentId={enrollment.id} /> : <p className="mt-5" role="status">An active apprenticeship enrollment is required. Contact your program coordinator.</p>}</main>;
}
