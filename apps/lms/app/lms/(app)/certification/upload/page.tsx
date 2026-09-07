import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CredentialUploadForm } from '@/components/lms/CredentialUploadForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Upload Credential | Elevate LMS', robots: { index: false, follow: false } };

export default async function CredentialUploadPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/certification/upload');

  const { data: uploads } = await db
    .from('student_credential_uploads')
    .select('id,upload_type,original_filename,verification_status,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-blue-700">Credential completion</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Upload an earned credential</h1>
        <p className="mt-2 text-slate-700">Upload OSHA 10, CPR/AED, or EPA 608 evidence for protected review. Elevate issues its completion certificate only after required evidence is verified.</p>
      </div>
      <CredentialUploadForm />
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black text-slate-950">Your submissions</h2>
        {uploads?.length ? <ul className="mt-3 space-y-2">{uploads.map((upload) => <li key={upload.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm"><span className="font-bold text-slate-900">{String(upload.upload_type).replaceAll('-', ' ')}</span><span className="text-slate-600">{upload.original_filename} · {upload.verification_status}</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-600">No credential files submitted yet.</p>}
      </section>
      <div className="flex flex-wrap gap-3"><Link href="/lms/certificates" className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-900">My certificates</Link><Link href="/lms/jobs" className="rounded-xl bg-slate-950 px-4 py-2 font-bold text-white">Open free career feed</Link></div>
    </main>
  );
}
