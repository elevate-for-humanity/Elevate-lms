import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { completionAlert } from '@/lib/program-holder/student-training';

export async function StudentCompletionTasks({ userId }: { userId: string }) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;
  const db = await requireAdminClient();
  if (user.id !== userId) {
    const preview = await resolvePortalPreviewSubject(db, user.id);
    if (!preview.previewing || preview.userId !== userId) throw new Error('Unauthorized learner progress view.');
  }
  const [enrollments, credentials, resumes, documents, careers] = await Promise.all([
    db.from('program_enrollments').select('id,program_id,program_slug,title,status,training_start_date,expected_end_date,training_end_date,completion_date,completed_at')
      .or(`user_id.eq.${userId},student_id.eq.${userId}`).is('revoked_at', null),
    db.from('student_credential_uploads').select('program_id,verification_status').eq('user_id', userId),
    db.from('resumes').select('id').eq('user_id', userId).limit(1),
    db.from('documents').select('id').eq('user_id', userId).contains('metadata', { original_type: 'resume' }).limit(1),
    db.from('resume_profiles').select('id').eq('user_id', userId).limit(1),
  ]);
  if ([enrollments, credentials, resumes, documents, careers].some(r => r.error))
    return <p role="status" className="m-4 rounded-xl border p-4">Completion tasks are temporarily unavailable. Please contact student support.</p>;
  if (!enrollments.data?.length) return null;
  return <section className="m-4 space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:mx-6">
    <h2 className="text-xl font-black">Training dates and next steps</h2>
    {enrollments.data.map(e => {
      const alert = completionAlert(e);
      const cert = credentials.data?.find(c => c.program_id === e.program_id && c.verification_status === 'approved')
        || credentials.data?.find(c => c.program_id === e.program_id && c.verification_status === 'pending')
        || credentials.data?.find(c => c.program_id === e.program_id);
      return <div key={e.id} className="rounded-xl bg-white p-3 text-sm">
        <h3 className="font-bold">{e.title || e.program_slug || 'Enrolled program'}</h3>
        <p>Start: {e.training_start_date || 'Not documented'} · Expected completion: {e.expected_end_date || e.training_end_date || 'Not documented'}</p>
        <p>Actual completion: {(e.completion_date || e.completed_at)?.slice(0, 10) || 'Not documented'}</p>
        {alert && <p className="mt-2 font-bold text-amber-900">{alert}</p>}
        <Link className="mt-2 block font-bold text-blue-700 underline" href="/lms/certification/upload">{cert?.verification_status === 'approved' ? 'Credential upload approved' : cert?.verification_status === 'pending' ? 'Credential submitted for review' : cert?.verification_status === 'rejected' ? 'Credential rejected — review the reason and resubmit' : 'Upload your certificate for review'}</Link>
      </div>;
    })}
    {!resumes.data?.length && !documents.data?.length && <Link className="block font-bold text-blue-700 underline" href="/lms/resume-builder">Resume missing — build or upload your resume</Link>}
    {!careers.data?.length && <Link className="block font-bold text-blue-700 underline" href="/lms/career">Career Services not started — open career readiness</Link>}
  </section>;
}
