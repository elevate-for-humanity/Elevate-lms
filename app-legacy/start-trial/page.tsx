'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type CreateResult = {
  ok: boolean;
  workspaceUrl?: string;
  publicPreviewUrl?: string;
  dashboardUrl?: string;
  slug?: string;
  trialEndsAt?: string;
  error?: string;
};

export default function StartTrialPage() {
  const [organizationName, setOrganizationName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName,
          ownerEmail,
          ownerName,
          industry,
          plan: 'starter',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create workspace');
        return;
      }

      setResult({
        ok: true,
        workspaceUrl: data.workspaceUrl,
        publicPreviewUrl: data.publicPreviewUrl,
        dashboardUrl: data.dashboardUrl,
        slug: data.slug,
        trialEndsAt: data.trialEndsAt,
      });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Start free trial', href: '/start-trial' },
          ]}
        />

        <h1 className="mt-6 text-3xl font-bold text-slate-900">Start your 14-day workspace trial</h1>
        <p className="mt-3 text-slate-600">
          Get your own training platform — LMS, website, and admin dashboard. No credit card required.
        </p>

        {result?.ok ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Your workspace is ready</h2>
            <p className="mt-2 text-slate-600">
              <span className="font-medium text-slate-900">{result.slug}</span> is live for 14 days.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {result.publicPreviewUrl ? (
                <li>
                  Public site:{' '}
                  <a className="text-brand-blue-600 hover:underline" href={result.publicPreviewUrl}>
                    {result.publicPreviewUrl}
                  </a>
                </li>
              ) : null}
              {result.dashboardUrl ? (
                <li>
                  Admin:{' '}
                  <a className="text-brand-blue-600 hover:underline" href={result.dashboardUrl}>
                    Open dashboard
                  </a>
                </li>
              ) : null}
            </ul>
            <Link
              href={result.dashboardUrl ?? '/login'}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-red-700"
            >
              Go to dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-slate-700">
                Organization name
              </label>
              <input
                id="organizationName"
                name="organizationName"
                required
                minLength={2}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Acme Training Academy"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-slate-700">
                Your name
              </label>
              <input
                id="ownerName"
                name="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Jane Smith"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="ownerEmail" className="block text-sm font-medium text-slate-700">
                Work email
              </label>
              <input
                id="ownerEmail"
                name="ownerEmail"
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-slate-700">
                Industry (optional)
              </label>
              <input
                id="industry"
                name="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Barber school, HVAC, workforce training…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>
            {error ? (
              <p className="rounded-lg bg-brand-red-50 px-3 py-2 text-sm text-brand-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-red-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating workspace…
                </>
              ) : (
                'Create workspace — 14 days free'
              )}
            </button>
            <p className="text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-blue-600 hover:underline">
                Sign in
              </Link>
              {' · '}
              <Link href="/store/trial" className="text-brand-blue-600 hover:underline">
                Advanced trial options
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
