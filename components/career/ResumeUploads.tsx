'use client';
import { useEffect, useState } from 'react';

export function ResumeUploads() {
  const [rows, setRows] = useState<{ id: string; file_name: string }[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    const response = await fetch('/api/learner/resumes');
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Unable to load resumes.');
    setRows(body.resumes);
  }
  useEffect(() => { void load().catch(error => setMessage(error.message)); }, []);
  return <section className="rounded-xl border border-slate-200 bg-white p-5">
    <h2 className="text-xl font-bold">Upload an existing resume</h2>
    <p className="my-2 text-sm">PDF or Word, up to 10 MB. Only you and authorized Elevate staff can access your file.</p>
    <form onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage('');
      const form = event.currentTarget;
      try {
        const response = await fetch('/api/learner/resumes', { method: 'POST', body: new FormData(form) });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Upload failed.');
        form.reset(); await load(); setMessage('Resume uploaded.');
      } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload failed.'); }
      finally { setBusy(false); }
    }} className="flex flex-wrap items-center gap-3">
      <label className="min-w-0">Resume file<input required type="file" name="file" accept=".pdf,.doc,.docx" className="block w-full max-w-full text-sm" /></label>
      <button disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? 'Uploading…' : 'Upload resume'}</button>
    </form>
    <p role="status" className="mt-3 text-sm">{message}</p>
    <ul className="mt-3 space-y-2">{rows.map(row => <li key={row.id}><a className="break-words font-bold text-blue-700 underline" href={`/api/learner/resumes/${row.id}`}>{row.file_name} — Download</a></li>)}</ul>
  </section>;
}
