'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import {
  Shield, CheckCircle2, Loader2, AlertCircle, ArrowLeft,
  Send, BookOpen,
} from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';

interface PolicyItem {
  id: string;
  title: string;
  summary: string;
  details: string[];
}

const POLICIES: PolicyItem[] = [
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
    id: 'eeo',
    title: 'Equal Employment Opportunity Policy',
    summary: 'I agree to comply with all federal and state anti-discrimination laws.',
    details: [
      'I will not discriminate based on race, color, religion, sex, national origin, age, disability, or genetic information',
      'I will provide equal training opportunities to all apprentices',
      'I will maintain a harassment-free workplace',
      'I will make reasonable accommodations for qualified individuals with disabilities',
      'I understand that violations may result in immediate termination of the partnership',
    ],
  },
  {
    id: 'safety',
    title: 'Workplace Safety Commitment',
    summary: 'I certify that my barbershop meets all health and safety requirements.',
    details: [
      'My shop maintains a valid Indiana barbershop license',
      'All tools and stations are properly sanitized and disinfected',
      'I carry current workers\' compensation insurance',
      'I carry current general liability insurance',
      'I will report any workplace injuries or incidents immediately',
      'I will allow safety inspections by the Sponsor',
    ],
  },
  {
    id: 'confidentiality',
    title: 'Confidentiality Agreement',
    summary: 'I agree to protect the privacy of apprentice personal information.',
    details: [
      'I will not share apprentice personal information with unauthorized parties',
      'I will store any apprentice records securely',
      'I will comply with applicable privacy laws',
      'I understand that apprentice educational records are protected under FERPA',
      'I will return or destroy apprentice records upon termination of the partnership',
    ],
  },
  {
    id: 'compensation-compliance',
    title: 'Wage & Labor Compliance',
    summary: 'I agree to comply with all wage and labor laws regarding apprentice compensation.',
    details: [
      'I will pay apprentices at least the applicable minimum wage',
      'I will maintain accurate payroll records',
      'I will provide pay stubs for all compensation periods',
      'I will not require unpaid work from apprentices',
      'I understand that apprentices are employees, not independent contractors',
      'I will comply with overtime requirements if applicable',
    ],
  },
  {
    id: 'reporting',
    title: 'Reporting & Communication Obligations',
    summary: 'I agree to maintain open communication with the Sponsor and fulfill reporting requirements.',
    details: [
      'I will respond to Sponsor inquiries within 2 business days',
      'I will submit hour verification reports on schedule',
      'I will notify the Sponsor of any issues with the apprentice promptly',
      'I will participate in quarterly check-in meetings',
      'I will report any changes to shop ownership, licensing, or insurance within 5 business days',
    ],
  },
];

export default function PolicyAcknowledgmentPage() {
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [signerName, setSignerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const allAcknowledged = POLICIES.every(p => acknowledged.has(p.id));

  const togglePolicy = (id: string) => {
    const next = new Set(acknowledged);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setAcknowledged(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allAcknowledged) {
      setError('You must acknowledge all policies before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/partners/barbershop-apprenticeship/policy-acknowledgment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: shopName,
          signer_name: signerName,
          policies_acknowledged: Array.from(acknowledged),
          acknowledged_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-brand-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Policies Acknowledged</h1>
          <p className="text-black mb-6">
            All {POLICIES.length} policy acknowledgments have been recorded. A confirmation
            will be sent to your email.
          </p>
          <div className="space-y-3">
            <Link
              href="/partners/barbershop-apprenticeship/forms"
              className="block w-full px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700"
            >
              Back to Required Forms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Partners', href: '/partners/barbershop-apprenticeship' },
          { label: 'Forms', href: '/partners/barbershop-apprenticeship/forms' },
          { label: 'Policy Acknowledgment' },
        ]} />
      </div>

      {/* Institutional Header */}
      <section className="py-6 border-b">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/partners/barbershop-apprenticeship/forms" className="inline-flex items-center gap-1 text-black hover:text-brand-blue-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Forms
          </Link>
          <InstitutionalHeader
            documentType="Policy Acknowledgment"
            title="Worksite Partner Policy Review"
            subtitle={`Review and acknowledge each policy below. All ${POLICIES.length} policies must be acknowledged.`}
            noDivider
          />
        </div>
      </section>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-8 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {acknowledged.size} of {POLICIES.length} policies acknowledged
          </span>
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${(acknowledged.size / POLICIES.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Handbook Link */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 mb-8 flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-brand-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-brand-blue-900">
              <strong>Read the Partner Handbook first.</strong> You must understand all policies before acknowledging them.
            </p>
          </div>
          <Link
            href="/partners/barbershop-apprenticeship/handbook"
            target="_blank"
            className="text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 whitespace-nowrap"
          >
            Open Handbook →
          </Link>
        </div>

        {/* Policies */}
        <div className="space-y-4 mb-8">
          {POLICIES.map((policy) => {
            const isAcked = acknowledged.has(policy.id);
            return (
              <div
                key={policy.id}
                className={`bg-white rounded-xl shadow-sm border p-6 transition-all ${isAcked ? 'border-brand-green-300 bg-brand-green-50/20' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => togglePolicy(policy.id)}
                    className="mt-0.5 flex-shrink-0"
                    aria-label={isAcked ? `Remove acknowledgment for ${policy.title}` : `Acknowledge ${policy.title}`}
                  >
                    {isAcked ? (
                      <CheckCircle2 className="w-6 h-6 text-brand-green-500" />
                    ) : (
                      <Shield className="w-6 h-6 text-gray-300" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{policy.title}</h3>
                    <p className="text-sm text-black mb-3">{policy.summary}</p>
                    <ul className="space-y-1.5">
                      {policy.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-black">
                          <span className="text-black mt-1">•</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => togglePolicy(policy.id)}
                      className={`mt-3 text-sm font-medium ${isAcked ? 'text-brand-green-600' : 'text-brand-blue-600 hover:text-brand-blue-700'}`}
                    >
                      {isAcked ? '✓ Acknowledged' : 'Click to Acknowledge'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Signer Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                placeholder="Your Barbershop Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                placeholder="Full legal name"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !allAcknowledged}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-blue-600 text-white rounded-lg font-bold text-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
          ) : (
            <><Send className="w-5 h-5" /> Submit All Acknowledgments</>
          )}
        </button>

        {/* Next Steps */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900">Next: Submit Your Application</h3>
            <p className="text-sm text-black">After acknowledging policies, complete the partner application.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/partners/barbershop-apprenticeship/sign-mou"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-white text-sm whitespace-nowrap"
            >
              Sign MOU
            </Link>
            <Link
              href="/programs/barber-apprenticeship/apply?type=partner_shop"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 text-sm whitespace-nowrap"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
