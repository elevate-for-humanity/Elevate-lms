'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface Category {
  category_key: string;
  label: string;
  module_number: number;
  count_required: number;
  count_completed: number;
  description: string;
}

export default function SubmitPracticalPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState('');
  const [notes, setNotes] = useState('');
  const [clientInitials, setClientInitials] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [shopName, setShopName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/barber/practicals')
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) { setError('Select a service type'); return; }
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/barber/practicals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_key: selected,
        notes,
        client_initials: clientInitials,
        service_date: serviceDate,
        shop_name: shopName,
      }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push('/pwa/barber/compliance'), 2000);
    } else {
      const d = await res.json();
      setError(d.error ?? 'Submission failed');
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Submitted!</h2>
          <p className="text-slate-600 text-sm">Your instructor will review and approve this service.</p>
        </div>
      </div>
    );
  }

  const selectedCat = categories.find(c => c.category_key === selected);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3">
        <Link href="/pwa/barber/compliance" className="text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-bold text-slate-900">Submit a Practical</h1>
          <p className="text-xs text-slate-500">Instructor approval required for credit</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Service Type */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Service Type *</label>
            <div className="space-y-2">
              {categories.map(cat => {
                const remaining = Math.max(0, cat.count_required - cat.count_completed);
                const met = remaining === 0;
                return (
                  <label
                    key={cat.category_key}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selected === cat.category_key
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.category_key}
                      checked={selected === cat.category_key}
                      onChange={() => setSelected(cat.category_key)}
                      className="mt-0.5 accent-orange-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${met ? 'text-green-700' : 'text-slate-800'}`}>
                          {met ? '✓ ' : ''}{cat.label}
                        </span>
                        <span className="text-xs text-slate-500 ml-2 shrink-0">
                          {cat.count_completed}/{cat.count_required}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Service Details</h3>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Service Date *</label>
              <input
                type="date"
                value={serviceDate}
                onChange={e => setServiceDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Client Initials</label>
              <input
                type="text"
                value={clientInitials}
                onChange={e => setClientInitials(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="e.g. J.D."
                maxLength={4}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-slate-400 mt-1">Initials only — do not enter full name</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Shop / Location</label>
              <input
                type="text"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="Shop name or address"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes for Instructor</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describe the service, technique used, any challenges..."
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !selected}
            className="w-full bg-orange-600 text-white rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit for Instructor Review'}
          </button>

          <p className="text-xs text-slate-500 text-center">
            Your instructor will review and approve this submission. Credit is only added after approval.
          </p>
        </form>
      </div>
    </div>
  );
}
