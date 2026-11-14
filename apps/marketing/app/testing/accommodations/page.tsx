'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ChevronRight, FileCheck2, Loader2, Upload } from 'lucide-react';

const ACCOMMODATION_TYPES = [
  { value: 'extended_time', title: 'Extended Time', description: '1.5x or 2x time when approved.' },
  { value: 'screen_reader', title: 'Screen Reader', description: 'Assistive technology support.' },
  { value: 'large_print', title: 'Large Print', description: 'Enlarged testing materials.' },
  { value: 'separate_room', title: 'Separate Room', description: 'Private testing environment.' },
  { value: 'frequent_breaks', title: 'Frequent Breaks', description: 'Additional approved rest periods.' },
  { value: 'other', title: 'Other', description: 'Another accommodation supported by documentation.' },
] as const;

const STEPS = [
  { step: 1, title: 'Submit the request', description: 'Send the request at least 30 days before the intended exam date whenever possible.' },
  { step: 2, title: 'Attach documentation', description: 'Upload supporting documentation from a qualified professional or the testing sponsor.' },
  { step: 3, title: 'Staff review', description: 'Testing staff reviews the request and contacts you about the approved accommodation.' },
  { step: 4, title: 'Confirm the exam', description: 'Schedule or confirm the exam after the accommodation is approved.' },
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export default function TestingAccommodationsPage() {
  const [fields, setFields] = useState({
    name: '',
    email: '',
    phone: '',
    provider: '',
    examDate: '',
    accommodationType: '',
    details: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmationId, setConfirmationId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const minimumExamDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 10);
  }, []);

  function setField(name: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  function chooseFile(selected: File | undefined) {
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE) {
      setError('Supporting documentation must be 10 MB or smaller.');
      return;
    }
    if (!ACCEPTED_TYPES.has(selected.type)) {
      setError('Upload a PDF, JPG, PNG, DOC, or DOCX file.');
      return;
    }
    setError('');
    setFile(selected);
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError('Supporting documentation is required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(fields)) formData.append(key, value);
      formData.append('documentation', file);

      const response = await fetch('/api/testing/accommodations', { method: 'POST', body: formData });
      const payload = (await response.json()) as { confirmationId?: string; error?: string };
      if (!response.ok || !payload.confirmationId) {
        throw new Error(payload.error || 'Accommodation request could not be submitted.');
      }
      setConfirmationId(payload.confirmationId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Accommodation request could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationId) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-green-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"><CheckCircle2 className="h-8 w-8 text-green-700" /></div>
          <h1 className="mt-5 text-3xl font-black text-slate-950">Accommodation request received</h1>
          <p className="mt-3 leading-7 text-slate-700">Testing staff will review the request and supporting documentation before confirming accommodations.</p>
          <p className="mt-4 font-mono text-sm font-black text-slate-900">Reference: {confirmationId}</p>
          <Link href="/testing" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 font-black text-white">Return to Testing Center</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-300">Certification testing</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Testing Accommodations</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-200">Request approved testing supports and securely submit supporting documentation for review.</p>
        </div>
      </section>

      <section className="border-b border-amber-200 bg-amber-50 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-4xl gap-3 text-sm leading-6 text-amber-950"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><p><strong>Submit early.</strong> When the exam sponsor requires advance approval, allow at least 30 days before the intended exam date.</p></div>
      </section>

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-black">Common accommodations</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ACCOMMODATION_TYPES.map((item) => <article key={item.value} className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><CheckCircle2 className="h-5 w-5 text-green-700" /><h3 className="mt-3 font-black">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl"><h2 className="text-center text-2xl font-black">How the request works</h2><div className="mt-8 space-y-5">{STEPS.map((item) => <div key={item.step} className="flex gap-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 font-black text-white">{item.step}</div><div><h3 className="font-black">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p></div></div>)}</div></div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-6 sm:py-16">
        <form onSubmit={submitRequest} className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">Submit accommodation request</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Your documentation is stored in private Testing Center storage and is not published.</p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Full name" required value={fields.name} onChange={(value) => setField('name', value)} />
            <Field label="Email" required type="email" value={fields.email} onChange={(value) => setField('email', value)} />
            <Field label="Phone" type="tel" value={fields.phone} onChange={(value) => setField('phone', value)} />
            <label className="text-sm font-bold">Exam provider *<select required value={fields.provider} onChange={(event) => setField('provider', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium"><option value="">Select</option><option value="nha">NHA</option><option value="act-workkeys">ACT WorkKeys</option><option value="certiport">Certiport</option><option value="nrf-rise-up">NRF RISE Up</option><option value="esco">ESCO</option><option value="other">Other</option></select></label>
            <label className="text-sm font-bold">Intended exam date<input type="date" min={minimumExamDate} value={fields.examDate} onChange={(event) => setField('examDate', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium" /></label>
            <label className="text-sm font-bold">Requested accommodation *<select required value={fields.accommodationType} onChange={(event) => setField('accommodationType', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium"><option value="">Select</option>{ACCOMMODATION_TYPES.map((item) => <option key={item.value} value={item.value}>{item.title}</option>)}</select></label>
          </div>

          <label className="mt-5 block text-sm font-bold">Details *<textarea required rows={5} value={fields.details} onChange={(event) => setField('details', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium" placeholder="Describe the accommodation requested and any testing-sponsor instructions." /></label>

          <div className="mt-5">
            <p className="text-sm font-bold">Supporting documentation *</p>
            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} />
            <button type="button" onClick={() => inputRef.current?.click()} className="mt-2 flex min-h-24 w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 font-bold text-slate-700 hover:border-blue-400">{file ? <><FileCheck2 className="h-5 w-5 text-green-700" />{file.name}</> : <><Upload className="h-5 w-5" />Choose documentation</>}</button>
          </div>

          {error ? <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div> : null}
          <button type="submit" disabled={submitting || !file} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 font-black text-white disabled:opacity-50">{submitting ? <><Loader2 className="h-5 w-5 animate-spin" />Submitting…</> : <>Submit request <ChevronRight className="h-5 w-5" /></>}</button>
        </form>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="text-sm font-bold">{label}{required ? ' *' : ''}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium" /></label>;
}
