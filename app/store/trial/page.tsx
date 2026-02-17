'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Shield, Loader2, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DemoTrialFunnelEvents } from '@/lib/analytics/events';

export default function TrialPage() {
  const [orgName, setOrgName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    tenantUrl: string;
    subdomain: string;
    trialEndsAt: string;
    correlationId?: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/trial/start-managed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName, adminName, adminEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = res.status === 409 && data.tenantUrl
          ? `A trial already exists for this email. Your dashboard: ${data.tenantUrl}`
          : (data.error || 'Something went wrong. Please try again.');
        setError(errMsg);
        setCorrelationId(data.correlationId || null);
        DemoTrialFunnelEvents.trialCreatedFailed(errMsg, data.correlationId);
        return;
      }

      setResult(data);
      setCorrelationId(null);
      DemoTrialFunnelEvents.trialCreatedSuccess(data.subdomain, data.correlationId);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setCorrelationId(null);
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (result) {
    const trialEnd = new Date(result.trialEndsAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <div className="min-h-screen bg-white">
        <div className="bg-slate-50 border-b">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Trial Started' }]} />
          </div>
        </div>

        <section className="py-16 sm:py-20">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-slate-400 flex-shrink-0">•</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3">Your trial is live.</h1>
            <p className="text-lg text-slate-800 mb-2">
              Check <strong>{adminEmail}</strong> for login instructions.
            </p>
            <p className="text-sm text-slate-600 mb-8">
              You&apos;re now in your live workspace (14-day trial). Nothing here is public until you launch.
            </p>

            <div className="bg-slate-50 rounded-xl p-6 mb-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Organization</span>
                <span className="font-semibold text-slate-900">{orgName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subdomain</span>
                <span className="font-semibold text-slate-900">{result.subdomain}.elevatelms.com</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Trial ends</span>
                <span className="font-semibold text-slate-900">{trialEnd}</span>
              </div>
            </div>

            {/* First action — converts "trying" into "owning" */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 text-left">
              <h2 className="font-bold text-slate-900 mb-1">Your first step</h2>
              <p className="text-sm text-slate-600 mb-4">
                Open your dashboard and confirm your organization name and settings.
                This takes 30 seconds and makes the workspace yours.
              </p>
              <a
                href={result.tenantUrl}
                onClick={(e) => {
                  DemoTrialFunnelEvents.trialSuccessOpenDashboard(result.subdomain, result.correlationId);
                  // Record onboarding initiation (fire-and-forget, don't block navigation)
                  fetch('/api/trial/begin-onboarding', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(result.correlationId ? { 'x-correlation-id': result.correlationId } : {}),
                    },
                    body: JSON.stringify({
                      subdomain: result.subdomain,
                      correlationId: result.correlationId,
                    }),
                  }).catch(() => {});
                }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-red-600 text-slate-900 font-bold rounded-lg hover:bg-brand-red-700 transition-colors w-full sm:w-auto"
              >
                Open Dashboard &amp; Configure <ArrowRight className="w-5 h-5" />
              </a>
            </div>

            <p className="text-sm text-slate-600">
              No credit card required. Full platform access for 14 days.
            </p>
          </div>
        </section>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Start Trial' }]} />
        </div>
      </div>

      <section className="py-16 sm:py-20">
        <div className="max-w-xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-slate-900 mb-4">Start Your 14-Day Trial</h1>
            <p className="text-lg text-slate-800">
              Full platform access. No credit card. Your environment is provisioned instantly.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              This creates your real workspace with your own subdomain and admin dashboard.
              The demo used sample data — this will be your live environment.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <h2 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">What you get</h2>
            <ul className="space-y-2 text-sm text-slate-800">
              <li className="flex items-start gap-2"><Clock className="w-4 h-4 text-brand-red-600 flex-shrink-0 mt-0.5" /> 14-day full platform access</li>
              <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-brand-red-600 flex-shrink-0 mt-0.5" /> Your own subdomain and admin dashboard</li>
              <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-brand-red-600 flex-shrink-0 mt-0.5" /> Import programs, enroll learners, run reports</li>
              <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-brand-red-600 flex-shrink-0 mt-0.5" /> No credit card required</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="orgName" className="block text-sm font-semibold text-slate-900 mb-1">
                Organization Name
              </label>
              <input
                id="orgName"
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-600 focus:border-transparent"
                placeholder="Acme Training Academy"
              />
            </div>

            <div>
              <label htmlFor="adminName" className="block text-sm font-semibold text-slate-900 mb-1">
                Your Name
              </label>
              <input
                id="adminName"
                type="text"
                required
                minLength={2}
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-600 focus:border-transparent"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label htmlFor="adminEmail" className="block text-sm font-semibold text-slate-900 mb-1">
                Work Email
              </label>
              <input
                id="adminEmail"
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-600 focus:border-transparent"
                placeholder="jane@acmetraining.org"
              />
            </div>

            {error && (
              <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-sm text-brand-red-800 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 pl-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="text-sm font-medium text-brand-red-600 hover:underline"
                  >
                    Try again
                  </button>
                  <span className="text-brand-red-600">|</span>
                  <Link
                    href={`/contact?topic=support&reason=trial-create-failed${correlationId ? `&ref=${correlationId}` : ''}`}
                    className="text-sm font-medium text-brand-red-600 hover:underline"
                  >
                    Contact support
                  </Link>
                </div>
                {correlationId && (
                  <p className="text-xs text-brand-red-400 pl-6">Reference: {correlationId}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-brand-red-600 text-slate-900 font-bold rounded-lg hover:bg-brand-red-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating your trial...
                </>
              ) : (
                <>
                  Start 14-Day Trial <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-slate-600">
              Already know what you need?{' '}
              <Link href="/store/licenses" className="text-brand-red-600 font-medium hover:underline">
                Go directly to licensing
              </Link>
            </p>
            <p className="text-sm text-slate-600">
              Want to see the platform first?{' '}
              <Link href="/store/demo" className="text-brand-red-600 font-medium hover:underline">
                View guided tour →
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
