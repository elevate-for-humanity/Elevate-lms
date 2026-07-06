'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Users, Phone, Mail } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export default function FssaWaitlistPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    caseManagerName: '',
    caseManagerAgency: '',
    caseManagerPhone: '',
    programInterest: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          programSlug: 'fssa',
          notes: [
            form.caseManagerName && `Case Manager: ${form.caseManagerName}`,
            form.caseManagerAgency && `Agency: ${form.caseManagerAgency}`,
            form.caseManagerPhone && `CM Phone: ${form.caseManagerPhone}`,
            form.programInterest && `Program Interest: ${form.programInterest}`,
            form.notes,
          ]
            .filter(Boolean)
            .join('\n'),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit');
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-brand-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-brand-green-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">You&apos;re on the list!</h1>
            <p className="text-slate-500">
              We&apos;ve received your information. Our admissions team will contact you — and your
              case manager if provided — within 2 business days.
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-5 text-sm text-slate-600 text-left space-y-2">
            <p className="font-semibold text-slate-800">While you wait:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Ask your case manager to contact us directly at {PLATFORM_DEFAULTS.supportPhone}</li>
              <li>Gather any FSSA/TANF benefit documentation you have</li>
              <li>
                <Link href="/programs" className="text-brand-blue-600 underline">
                  Browse all programs
                </Link>{' '}
                to confirm your program of interest
              </li>
            </ul>
          </div>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-xl font-semibold text-sm transition"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/apply" className="text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">FSSA IMPACT — Waitlist</h1>
            <p className="text-sm text-slate-500">{PLATFORM_DEFAULTS.orgName}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h2 className="font-bold text-blue-900 text-sm">About FSSA IMPACT Funding</h2>
              <p className="text-sm text-blue-700 mt-1">
                FSSA IMPACT funding is administered through the Indiana Family and Social Services
                Administration. Enrollment requires coordination with a WorkOne or FSSA case
                manager. We cannot accept direct online applications — but we can add you to our
                waitlist and work with your case manager to get you enrolled.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
              className="flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-medium"
            >
              <Phone className="w-4 h-4" /> {PLATFORM_DEFAULTS.supportPhone}
            </a>
            <a
              href="mailto:info@elevateforhumanity.org"
              className="flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-medium"
            >
              <Mail className="w-4 h-4" /> info@elevateforhumanity.org
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Personal info */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Your Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Program of Interest
              </label>
              <select
                value={form.programInterest}
                onChange={(e) => update('programInterest', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
              >
                <option value="">Select a program…</option>
                <option value="cna">Certified Nursing Assistant (CNA)</option>
                <option value="medical-assistant">Medical Assistant</option>
                <option value="phlebotomy">Phlebotomy Technician</option>
                <option value="hvac-technician">HVAC Technician</option>
                <option value="barber-apprenticeship">Barber Apprenticeship</option>
                <option value="cosmetology-apprenticeship">Cosmetology Apprenticeship</option>
                <option value="peer-recovery-specialist">Peer Recovery Specialist</option>
                <option value="other">Other / Not sure yet</option>
              </select>
            </div>
          </div>

          {/* Case manager info */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Case Manager Information</h2>
            <p className="text-sm text-slate-500">
              If you have a WorkOne or FSSA case manager, provide their contact info so we can
              coordinate directly. This speeds up enrollment significantly.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Case Manager Name
              </label>
              <input
                type="text"
                value={form.caseManagerName}
                onChange={(e) => update('caseManagerName', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Agency</label>
              <input
                type="text"
                value={form.caseManagerAgency}
                onChange={(e) => update('caseManagerAgency', e.target.value)}
                placeholder="e.g. WorkOne Indianapolis, FSSA Marion County"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Case Manager Phone
              </label>
              <input
                type="tel"
                value={form.caseManagerPhone}
                onChange={(e) => update('caseManagerPhone', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              placeholder="Anything else we should know…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400 resize-none"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition"
          >
            {submitting ? 'Submitting…' : 'Join Waitlist'}
          </button>

          <p className="text-xs text-center text-slate-400">
            By submitting you agree to be contacted by {PLATFORM_DEFAULTS.orgName} regarding enrollment.
          </p>
        </form>
      </div>
    </div>
  );
}
