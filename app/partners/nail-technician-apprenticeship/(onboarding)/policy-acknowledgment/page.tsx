'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Shield, Loader2, AlertCircle, ArrowRight, BookOpen } from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';

const POLICIES = [
  {
    id: 'handbook',
    title: 'Partner Handbook Acknowledgment',
    summary: 'I confirm that I have read and understand the Partner Handbook in its entirety.',
    details: [
      'I understand my role and responsibilities as a worksite partner',
      'I understand the compensation requirements for apprentices',
      'I understand the hour tracking and verification procedures',
      'I understand the competency development expectations',
      'I understand the prohibited practices and consequences',
    ],
  },
  {
    id: 'dol',
    title: 'DOL Registered Apprenticeship Compliance',
    summary: 'I understand this is a USDOL Registered Apprenticeship and I must comply with all federal requirements.',
    details: [
      'I will maintain accurate records of all apprentice hours',
      'I will allow USDOL compliance visits if requested',
      'I understand that non-compliance may result in program termination',
      'I will report any apprentice safety incidents within 24 hours',
    ],
  },
  {
    id: 'ipla',
    title: 'Indiana IPLA Licensing Requirements',
    summary: 'I understand the Indiana Professional Licensing Agency requirements for nail technician training.',
    details: [
      'I will ensure all supervised training meets Indiana IPLA standards',
      'I will maintain a licensed nail technician supervisor on-site during all apprentice training hours',
      'I understand that 600 hours are required for Indiana nail technician licensure',
      'I will support the apprentice in preparing for IPLA theory and practical exams',
    ],
  },
  {
    id: 'equal_opportunity',
    title: 'Equal Opportunity & Non-Discrimination',
    summary: 'I commit to providing equal opportunity to all apprentices regardless of protected characteristics.',
    details: [
      'I will not discriminate based on race, color, religion, sex, national origin, age, disability, or veteran status',
      'I will maintain a harassment-free training environment',
      'I will report any discrimination complaints to Elevate immediately',
    ],
  },
];

export default function NailTechnicianPolicyAcknowledgmentPage() {
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const allAcknowledged = POLICIES.every((p) => acknowledged[p.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allAcknowledged) { setError('Please acknowledge all policies to continue.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await fetch('/api/partners/policy-acknowledgment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program: 'nail-technician-apprenticeship', policies: Object.keys(acknowledged) }),
      });
      setSubmitted(true);
    } catch {
      setError('Could not save acknowledgment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-brand-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Policies Acknowledged</h2>
          <p className="text-slate-600 text-sm mb-6">Thank you. Please continue to upload your required documents.</p>
          <Link href="/partners/nail-technician-apprenticeship/documents"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
            Continue to Documents <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <InstitutionalHeader title="Policy Acknowledgment" subtitle="Nail Technician Apprenticeship — Host Spa Partner" documentType="Policy Acknowledgment" />

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {POLICIES.map((policy) => (
            <div key={policy.id} className={`bg-white border rounded-xl p-5 transition-colors ${acknowledged[policy.id] ? 'border-brand-green-300' : 'border-slate-200'}`}>
              <div className="flex items-start gap-3">
                <input type="checkbox" id={policy.id} checked={!!acknowledged[policy.id]}
                  onChange={(e) => setAcknowledged((prev) => ({ ...prev, [policy.id]: e.target.checked }))}
                  className="mt-1 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                <div>
                  <label htmlFor={policy.id} className="font-semibold text-slate-900 text-sm cursor-pointer">{policy.title}</label>
                  <p className="text-sm text-slate-600 mt-1">{policy.summary}</p>
                  <ul className="mt-2 space-y-1">
                    {policy.details.map((d) => (
                      <li key={d} className="text-xs text-slate-500 flex items-start gap-1.5">
                        <BookOpen className="w-3 h-3 mt-0.5 shrink-0 text-purple-400" /> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Link href="/partners/nail-technician-apprenticeship/handbook" className="text-sm text-slate-500 hover:text-slate-700">← Back to Handbook</Link>
            <button type="submit" disabled={submitting || !allAcknowledged}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <>Continue to Documents <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
