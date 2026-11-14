'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Send } from 'lucide-react';

type ProgramOption = {
  id: string;
  title: string;
  slug: string;
  fundingTier: 'workforce-funded' | 'self-pay';
};

export default function InquiryForm({ programs, initialProgram = '' }: { programs: ProgramOption[]; initialProgram?: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', program: initialProgram, question: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/program-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult({ ok: res.ok && data.ok, message: data.message || data.error || 'Unable to submit inquiry.' });
      if (res.ok && data.ok) setForm((p) => ({ ...p, question: '' }));
    } catch {
      setResult({ ok: false, message: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
      <div className="flex items-start gap-3 rounded-xl bg-sky-50 border border-sky-100 p-4">
        <MessageCircle className="h-6 w-6 text-sky-700 shrink-0" />
        <div>
          <p className="font-extrabold text-slate-950">This is an inquiry, not an enrollment application.</p>
          <p className="mt-1 text-base text-slate-700">Use this form to ask questions, compare programs, discuss schedules, or request a call. It does not reserve a seat, request funding, or enroll you.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-base font-semibold text-slate-800 mb-2" htmlFor="inquiry-name">Name *</label>
          <input id="inquiry-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3.5 text-base border border-slate-300 rounded-xl" />
        </div>
        <div>
          <label className="block text-base font-semibold text-slate-800 mb-2" htmlFor="inquiry-phone">Phone *</label>
          <input id="inquiry-phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3.5 text-base border border-slate-300 rounded-xl" />
        </div>
      </div>

      <div>
        <label className="block text-base font-semibold text-slate-800 mb-2" htmlFor="inquiry-email">Email *</label>
        <input id="inquiry-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3.5 text-base border border-slate-300 rounded-xl" />
      </div>

      <div>
        <label className="block text-base font-semibold text-slate-800 mb-2" htmlFor="inquiry-program">Program you are asking about *</label>
        <select id="inquiry-program" required value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} className="w-full px-4 py-3.5 text-base border border-slate-300 rounded-xl bg-white">
          <option value="">Select a program</option>
          {programs.map((p) => <option key={p.id} value={p.slug}>{p.title}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-base font-semibold text-slate-800 mb-2" htmlFor="inquiry-question">What would you like to know?</label>
        <textarea id="inquiry-question" rows={5} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full px-4 py-3.5 text-base border border-slate-300 rounded-xl" placeholder="Ask about schedule, start dates, payment options, requirements, testing, or anything else." />
      </div>

      {result && <div className={`rounded-xl px-4 py-3 text-base ${result.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{result.message}</div>}

      <button disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-4 text-lg font-extrabold text-white hover:bg-slate-800 disabled:opacity-60">
        <Send className="h-5 w-5" /> {submitting ? 'Sending...' : 'Send Program Inquiry'}
      </button>

      <p className="text-center text-base text-slate-600">Ready to actually enroll? <Link href={`/apply${form.program ? `?program=${encodeURIComponent(form.program)}` : ''}`} className="font-bold text-brand-red-700 hover:underline">Start the enrollment application</Link>.</p>
    </form>
  );
}
