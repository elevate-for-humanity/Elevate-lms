'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const EXAMPLES = [
  'I want a barber school with online theory and apprenticeship tracking.',
  'I want a staffing agency with CRM and job board.',
  'I want a CNA school with LMS and certification exams.',
  'I want a home healthcare training provider website.',
];

type LaunchResult = {
  publicPreviewUrl?: string;
  dashboardUrl?: string;
  slug?: string;
  trialEndsAt?: string;
  aiSiteEnhanced?: boolean;
  lmsSeeded?: boolean;
};

export default function LaunchPage() {
  const [organizationName, setOrganizationName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [includeLms, setIncludeLms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LaunchResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/onboarding/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName,
          ownerEmail,
          ownerName,
          businessDescription,
          industry: inferIndustry(businessDescription),
          includeLms,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Launch failed');
        return;
      }
      setResult(data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Launch your platform', href: '/launch' },
          ]}
        />

        <div className="mt-6 flex items-center gap-2 text-brand-red-600">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">AI Business Launch</span>
        </div>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">Describe your business. We build the platform.</h1>
        <p className="mt-3 text-slate-600">
          Workspace, website, trial subdomain, and optional LMS — provisioned in one flow. No credit card.
        </p>

        {!result ? (
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Business name</label>
              <input
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3"
                placeholder="Elevate Barber Academy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                What do you want to build?
              </label>
              <textarea
                required
                rows={4}
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3"
                placeholder="Describe your business, programs, and goals..."
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setBusinessDescription(ex)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    {ex.slice(0, 42)}…
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Your email</label>
                <input
                  required
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Your name</label>
                <input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={includeLms}
                onChange={(e) => setIncludeLms(e.target.checked)}
              />
              Include starter LMS program
            </label>

            {error && <p className="text-sm text-brand-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Launch my platform
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="mt-10 rounded-xl border border-brand-green-200 bg-brand-green-50 p-6">
            <h2 className="text-xl font-bold text-slate-900">Your platform is live</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {result.aiSiteEnhanced && <li>AI-enhanced website copy applied</li>}
              {result.lmsSeeded && <li>Starter LMS program created</li>}
              {result.trialEndsAt && (
                <li>Trial ends {new Date(result.trialEndsAt).toLocaleDateString()}</li>
              )}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              {result.publicPreviewUrl && (
                <a
                  href={result.publicPreviewUrl}
                  className="rounded-lg bg-brand-red-600 px-5 py-2.5 text-sm font-bold text-white"
                >
                  View public site
                </a>
              )}
              {result.dashboardUrl && (
                <a
                  href={result.dashboardUrl}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-900"
                >
                  Open dashboard
                </a>
              )}
              <Link href="/operator" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold">
                Open AI Operator
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function inferIndustry(description: string): string {
  const d = description.toLowerCase();
  if (d.includes('barber')) return 'Barber';
  if (d.includes('cna') || d.includes('nursing')) return 'Healthcare';
  if (d.includes('staffing')) return 'Staffing';
  if (d.includes('cdl')) return 'CDL';
  return 'Training Provider';
}
