import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { CredentialUploadForm } from '@/components/lms/CredentialUploadForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Upload Credential | Elevate LMS', robots: { index: false, follow: false } };

export default async function CredentialUploadPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/certification/upload');

  const adminDb = await requireAdminClient();
  const { data: enrollments } = await adminDb.from('program_enrollments')
    .select('program_id,program_slug,title').or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
    .is('revoked_at', null).not('program_id','is',null);
  const programs = [...new Map((enrollments ?? []).filter(row => row.program_id).map(row => [row.program_id!, { id: row.program_id!, label: row.title || row.program_slug || 'Enrolled program' }])).values()];
  const { data: availableCredentials } = await adminDb.from('credential_registry').select('id,name').order('name').limit(150);
  const credentials = (availableCredentials ?? []).map(row => ({id: row.id, label: row.name}));
  const { data: uploads } = await db
    .from('student_credential_uploads')
    .select('id,upload_type,original_filename,verification_status,rejection_reason,credential_earned_date,verified_at,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-blue-700">Credential completion</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Upload an earned credential</h1>
        <p className="mt-2 text-slate-700">Upload earned credentials, licenses, prerequisite certificates, and exam results for any program in which you are enrolled. Files are submitted for protected staff verification.</p>
      </div>
      <CredentialUploadForm programs={programs} credentials={credentials} />
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black text-slate-950">Your submissions</h2>
        {uploads?.length ? <ul className="mt-3 space-y-2">{uploads.map((upload) => <li key={upload.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm"><a href={`/api/learner/credentials/${upload.id}`} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 underline">{String(upload.upload_type).replaceAll('-', ' ')} — Preview</a><span className="text-slate-600">{upload.original_filename} · {upload.verification_status === 'pending' ? 'Submitted for review' : upload.verification_status}{upload.rejection_reason ? ` · Reason: ${upload.rejection_reason}` : ''}{upload.credential_earned_date ? ` · Earned: ${upload.credential_earned_date}` : ''}{upload.verified_at ? ` · Reviewed: ${upload.verified_at.slice(0, 10)}` : ''}</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-600">No credential files submitted yet.</p>}
      </section>
      <div className="flex flex-wrap gap-3"><Link href="/lms/certificates" className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-900">My certificates</Link><Link href="/lms/jobs" className="rounded-xl bg-slate-950 px-4 py-2 font-bold text-white">Open free career feed</Link></div>
    </main>
  );
}
