'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';

const PROGRAM_TYPES = [
  'HVAC / Refrigeration', 'Electrical', 'Plumbing', 'Welding',
  'CDL / Commercial Driving', 'Carpentry / Construction',
  'Healthcare / CNA', 'Medical Assistant', 'Phlebotomy',
  'Barbering / Cosmetology', 'IT Support / Cybersecurity',
  'Business / Office Administration', 'Tax Preparation', 'Other',
];

export default function ProgramSubmitForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', category: '', description: '',
    durationWeeks: '', totalHours: '', tuition: '',
    credentialName: '', credentialType: '',
    wioaApproved: false, fundingEligible: false,
    nextStartDate: '', seatsAvailable: '',
    serviceArea: '', deliveryMode: 'in_person',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Program title is required.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/provider/programs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          title: form.title,
          category: form.category || null,
          description: form.description || null,
          estimatedWeeks: form.durationWeeks ? Number(form.durationWeeks) : null,
          totalHours: form.totalHours ? Number(form.totalHours) : null,
          tuition: form.tuition ? Number(form.tuition) : null,
          credentialName: form.credentialName || null,
          credentialType: form.credentialType || null,
          wioaApproved: form.wioaApproved,
          fundingEligible: form.fundingEligible,
          nextStartDate: form.nextStartDate || null,
          seatsAvailable: form.seatsAvailable ? Number(form.seatsAvailable) : null,
          serviceArea: form.serviceArea || null,
          deliveryMode: form.deliveryMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Submission failed'); return; }
      setDone(true);
      setTimeout(() => router.push('/provider/programs'), 1500);
    } catch { setError('Network error.'); }
    finally { setSubmitting(false); }
  }

  if (done) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h2 className="font-bold text-slate-900 mb-1">Program Submitted</h2>
        <p className="text-slate-500 text-sm">Under review. Redirecting…</p>
      </div>
    );
  }

  const inp = (label: string, key: string, opts?: { type?: string; placeholder?: string; required?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{opts?.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        value={(form as Record<string, unknown>)[key] as string}
        onChange={e => set(key, e.target.value)}
        type={opts?.type ?? 'text'}
        placeholder={opts?.placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
      />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Program Details</h2>
        {inp('Program Title', 'title', { required: true, placeholder: 'HVAC Technician Certification' })}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
          >
            <option value="">Select…</option>
            {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={3}
            placeholder="Describe the program, what learners will gain, and who it's for."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Duration & Cost</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {inp('Duration (weeks)', 'durationWeeks', { type: 'number', placeholder: '12' })}
          {inp('Total Hours', 'totalHours', { type: 'number', placeholder: '240' })}
          {inp('Tuition ($)', 'tuition', { type: 'number', placeholder: '3500' })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Credential</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {inp('Credential Name', 'credentialName', { placeholder: 'EPA Section 608 Universal' })}
          {inp('Credential Type', 'credentialType', { placeholder: 'certification' })}
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.wioaApproved} onChange={e => set('wioaApproved', e.target.checked)}
              className="rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500" />
            WIOA Approved
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.fundingEligible} onChange={e => set('fundingEligible', e.target.checked)}
              className="rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500" />
            Funding Eligible
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Schedule & Delivery</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {inp('Next Start Date', 'nextStartDate', { type: 'date' })}
          {inp('Seats Available', 'seatsAvailable', { type: 'number', placeholder: '20' })}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Delivery Mode</label>
            <select value={form.deliveryMode} onChange={e => set('deliveryMode', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white">
              <option value="in_person">In Person</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>
        {inp('Service Area', 'serviceArea', { placeholder: 'Marion County, Central Indiana' })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Submit for Review
      </button>
    </form>
  );
}
