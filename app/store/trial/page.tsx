'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BEAUTY_TRIAL_PROGRAMS_PREFILL } from '@/lib/store/beauty-dashboard-clone';
import Image from 'next/image';
import {
  ArrowRight, Clock, Shield, Loader2, AlertCircle,
  Globe, Link2, CheckCircle2, ChevronRight,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DemoTrialFunnelEvents } from '@/lib/analytics/events';

type WebsiteMode = 'new' | 'existing' | '';

interface TrialResult {
  tenantUrl: string;
  subdomain: string;
  trialEndsAt: string;
  correlationId?: string;
  message: string;
  publicPreviewUrl?: string;
  connectionMode?: 'new_site' | 'existing_site' | 'api_embed';
}

const CHECKLIST_NEW = [
  { label: 'Build your website', desc: 'Add homepage, about, and programs pages' },
  { label: 'Import your programs', desc: 'Add courses, modules, and lessons' },
  { label: 'Invite your team', desc: 'Add instructors and staff' },
  { label: 'Test enrollment', desc: 'Enroll a test learner and run through the flow' },
  { label: 'Configure payments', desc: 'Connect Stripe and set program fees' },
  { label: 'Launch', desc: 'Go live — your trial data carries over' },
];

const CHECKLIST_EXISTING = [
  { label: 'Get your embed code', desc: 'Copy the enrollment widget for your site' },
  { label: 'Import your programs', desc: 'Add courses and sync your catalog' },
  { label: 'Connect your domain', desc: 'Point your existing site to the LMS' },
  { label: 'Test enrollment', desc: 'Verify the flow end-to-end' },
  { label: 'Invite your team', desc: 'Add instructors and staff' },
  { label: 'Launch', desc: 'Go live — trial data carries over' },
];

function TrialPageContent() {
  const searchParams = useSearchParams();
  const [orgName, setOrgName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [websiteMode, setWebsiteMode] = useState<WebsiteMode>('');
  const [existingUrl, setExistingUrl] = useState('');
  const [programs, setPrograms] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('vertical') === 'beauty') {
      setPrograms((prev) => (prev.trim() ? prev : BEAUTY_TRIAL_PROGRAMS_PREFILL));
    }

    const mode = searchParams.get('mode');
    if (mode === 'existing' || mode === 'new') {
      setWebsiteMode(mode);
    }
  }, [searchParams]);
  const [error, setError] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [result, setResult] = useState<TrialResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/trial/start-managed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName,
          adminName,
          adminEmail,
          websiteMode: websiteMode || 'new',
          existingUrl: existingUrl || undefined,
          programs: programs || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg =
          res.status === 409 && data.tenantUrl
            ? `A trial already exists for this email. Your dashboard: ${data.tenantUrl}`
            : data.error || 'Something went wrong. Please try again.';
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

  // ── Success state ──────────────────────────────────────────────────────────
  if (result) {
    const trialEnd = new Date(result.trialEndsAt).toLocaleDateString('en-US', {
      timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
    const isExisting = result.connectionMode === 'existing_site' || result.connectionMode === 'api_embed';
    const checklist = isExisting ? CHECKLIST_EXISTING : CHECKLIST_NEW;

    return (
      <div className="min-h-screen bg-white">
        <section className="relative h-[160px] sm:h-[220px] overflow-hidden">
          {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
          <Image src="/images/pages/store-trial-hero.jpg" alt="Elevate platform" fill sizes="100vw" className="object-cover" priority placeholder="empty" />
        </section>

        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Trial Started' }]} />
          </div>
        </div>

        <section className="py-12 sm:py-16">
          <div className="max-w-2xl mx-auto px-4">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-brand-green-600" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">Your trial is live.</h1>
              <p className="text-slate-600">Check <strong>{adminEmail}</strong> for your login link.</p>
            </div>

            {/* Details */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Organization</span>
                <span className="font-semibold text-slate-900">{orgName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 flex-shrink-0">Admin dashboard</span>
                <span className="font-mono text-xs text-slate-700 truncate">{result.subdomain}.app.elevateforhumanity.org/admin</span>
              </div>
              {result.publicPreviewUrl && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 flex-shrink-0">Public preview</span>
                  <a href={result.publicPreviewUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 hover:underline text-xs truncate">
                    {result.publicPreviewUrl.replace('https://', '')}
                  </a>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Trial ends</span>
                <span className="font-semibold text-slate-900">{trialEnd}</span>
              </div>
            </div>

            {/* Primary CTA */}
            <a
              href={result.tenantUrl}
              onClick={() => {
                DemoTrialFunnelEvents.trialSuccessOpenDashboard(result.subdomain, result.correlationId);
                fetch('/api/trial/begin-onboarding', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...(result.correlationId ? { 'x-correlation-id': result.correlationId } : {}) },
                  body: JSON.stringify({ subdomain: result.subdomain, correlationId: result.correlationId }),
                }).catch(() => {});
              }}
              className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors mb-8"
            >
              Open Dashboard <ArrowRight className="w-5 h-5" />
            </a>

            {/* Onboarding checklist */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
              <h2 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Your setup checklist</h2>
              <ol className="space-y-3">
                {checklist.map((item, i) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Connection path for existing sites */}
            {isExisting && (
              <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-5">
                <h3 className="font-bold text-brand-blue-900 text-sm mb-3 flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> Connecting your existing site
                </h3>
                <p className="text-sm text-brand-blue-800 mb-2">From your dashboard you can access:</p>
                <ul className="space-y-1 text-sm text-brand-blue-800 pl-2">
                  {['Embed codes for enrollment widgets', 'API docs and authentication tokens', 'Program catalog sync', 'Lead capture form builder'].map(item => (
                    <li key={item} className="flex items-center gap-2"><ChevronRight className="w-3 h-3 flex-shrink-0" />{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-center text-xs text-slate-400 mt-6">No credit card required. Full platform access for 14 days.</p>
          </div>
        </section>
      </div>
    );
  }

  // ── Form state ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Start Trial' }]} />
        </div>
      </div>

      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-start">

            {/* Left: value prop */}
            <div className="hidden lg:block">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl border border-slate-200 mb-6">
                <Image src="/images/pages/store-trial-detail.jpg" alt="Admin dashboard preview" fill sizes="50vw" className="object-cover" placeholder="empty" />
              </div>
              <p className="text-sm text-slate-500 text-center mb-6">Your branded training website + LMS — ready in under 60 seconds</p>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">What you get</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2"><Clock className="w-4 h-4 text-brand-red-600 flex-shrink-0 mt-0.5" />14-day full platform access — no credit card</li>
                  <li className="flex items-start gap-2"><Globe className="w-4 h-4 text-brand-red-600 flex-shrink-0 mt-0.5" />Branded training website with your subdomain</li>
                  <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-brand-red-600 flex-shrink-0 mt-0.5" />LMS workspace — programs, learners, reports</li>
                  <li className="flex items-start gap-2"><Link2 className="w-4 h-4 text-brand-red-600 flex-shrink-0 mt-0.5" />Connect your existing site via embed or API</li>
                </ul>
              </div>
            </div>

            {/* Right: form */}
            <div>
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Start Your 14-Day Trial</h1>
                <p className="text-slate-600">Build a training website and LMS workspace — or connect your existing site. No credit card. Provisioned instantly.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="orgName" className="block text-sm font-semibold text-slate-900 mb-1">Organization Name</label>
                  <input id="orgName" type="text" required minLength={2} maxLength={100} value={orgName} onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-600 focus:border-transparent text-sm" placeholder="Acme Training Academy" />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="adminName" className="block text-sm font-semibold text-slate-900 mb-1">Your Name</label>
                    <input id="adminName" type="text" required minLength={2} value={adminName} onChange={(e) => setAdminName(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-600 focus:border-transparent text-sm" placeholder="Jane Smith" />
                  </div>
                  <div>
                    <label htmlFor="adminEmail" className="block text-sm font-semibold text-slate-900 mb-1">Work Email</label>
                    <input id="adminEmail" type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-600 focus:border-transparent text-sm" placeholder="jane@acmetraining.org" />
                  </div>
                </div>

                {/* Website mode */}
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">Do you have an existing website?</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {([
                      { mode: 'new' as WebsiteMode, icon: Globe, title: 'Build a new site', desc: 'We create your branded training website + LMS' },
                      { mode: 'existing' as WebsiteMode, icon: Link2, title: 'Connect existing site', desc: 'Embed or API — keep your current site' },
                    ] as const).map(({ mode, icon: Icon, title, desc }) => (
                      <button key={mode} type="button" onClick={() => setWebsiteMode(mode)}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${websiteMode === mode ? 'border-brand-red-500 bg-brand-red-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${websiteMode === mode ? 'text-brand-red-600' : 'text-slate-400'}`} />
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {websiteMode === 'existing' && (
                  <div>
                    <label htmlFor="existingUrl" className="block text-sm font-semibold text-slate-900 mb-1">Your website URL</label>
                    <input id="existingUrl" type="url" value={existingUrl} onChange={(e) => setExistingUrl(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-600 focus:border-transparent text-sm" placeholder="https://yoursite.com" />
                  </div>
                )}

                <div>
                  <label htmlFor="programs" className="block text-sm font-semibold text-slate-900 mb-1">
                    What programs do you offer? <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input id="programs" type="text" value={programs} onChange={(e) => setPrograms(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-600 focus:border-transparent text-sm" placeholder="e.g. CNA, HVAC, Medical Assistant, IT Help Desk" />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pl-6">
                      <button type="submit" disabled={loading} className="text-sm font-medium text-red-600 hover:underline">Try again</button>
                      <span className="text-red-300">|</span>
                      <Link href={`/contact?topic=support&reason=trial-create-failed${correlationId ? `&ref=${correlationId}` : ''}`} className="text-sm font-medium text-red-600 hover:underline">Contact support</Link>
                    </div>
                    {correlationId && <p className="text-xs text-red-400 pl-6">Reference: {correlationId}</p>}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
                  {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />Creating your workspace…</>) : (<>Start 14-Day Trial <ArrowRight className="w-5 h-5" /></>)}
                </button>
              </form>

              <div className="mt-6 text-center lg:text-left space-y-2">
                <p className="text-sm text-slate-500">Already know what you need?{' '}
                  <Link href="/store/licenses/managed-platform" className="text-brand-red-600 font-medium hover:underline">Purchase directly</Link>
                </p>
                <p className="text-sm text-slate-500">Want to see the platform first?{' '}
                  <Link href="/store/demos" className="text-brand-red-600 font-medium hover:underline">Open full demo →</Link>
                </p>
                <p className="text-sm text-slate-500">Beauty schools & salons?{' '}
                  <Link href="/store/beauty-programs" className="text-brand-red-600 font-medium hover:underline">Dashboard clone for beauty programs →</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function TrialPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-600">Loading trial…</div>
      }
    >
      <TrialPageContent />
    </Suspense>
  );
}
