'use client';

import { FormEvent, Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2, Shield, Globe, Link2, Sparkles } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface TrialResult {
  tenantUrl?: string;
  dashboardUrl?: string;
  publicPreviewUrl?: string;
  subdomain?: string;
  workspaceId?: string;
  tenantId?: string;
  trialEndsAt?: string;
  message?: string;
  correlationId?: string;
  connectionMode?: string;
  keptDemoBuild?: boolean;
  onboardingComplete?: boolean;
  recommendedCapabilities?: string[];
}

function TrialForm() {
  const searchParams = useSearchParams();
  const demoToken = searchParams.get('demo');
  const demoProduct = searchParams.get('product');
  const guidedGoal = searchParams.get('goal');
  const guidedOrg = searchParams.get('org');
  const recommendedCapabilities = useMemo(() => {
    const raw = searchParams.get('recommended') || '';
    return [...new Set(raw.split(',').map((value) => value.trim()).filter(Boolean))].slice(0, 12);
  }, [searchParams]);

  const [orgName, setOrgName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [websiteMode, setWebsiteMode] = useState<'new' | 'existing'>('new');
  const [existingUrl, setExistingUrl] = useState('');
  const [programs, setPrograms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TrialResult | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(demoToken ? '/api/store/demo/convert' : '/api/trial/start-managed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          demoToken
            ? { demoToken, organizationName: orgName, ownerName: adminName, ownerEmail: adminEmail }
            : {
                orgName,
                adminName,
                adminEmail,
                websiteMode,
                existingUrl: existingUrl || undefined,
                programs: programs || undefined,
                recommendedCapabilities,
                guidedGoal: guidedGoal || undefined,
                guidedOrg: guidedOrg || undefined,
              },
        ),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create trial');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create trial');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const trialEnd = result.trialEndsAt ? new Date(result.trialEndsAt).toLocaleDateString() : 'See your account';
    const workspaceTarget = result.dashboardUrl || result.tenantUrl || '/portals';
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"><CheckCircle2 className="h-8 w-8 text-green-700" /></div>
          <h1 className="mt-5 text-center text-3xl font-black text-slate-950">Your organization trial is ready</h1>
          <p className="mt-3 text-center text-slate-600">{result.subdomain ? <>Workspace: <strong>{result.subdomain}</strong> · </> : null}Trial end: <strong>{trialEnd}</strong></p>
          {result.keptDemoBuild ? <div className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm font-semibold text-violet-950"><div className="flex items-center gap-2 font-black"><Sparkles className="h-4 w-4" /> Your demo build was carried into the real workspace.</div></div> : null}
          {(result.recommendedCapabilities?.length || recommendedCapabilities.length) ? <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-800"><p className="font-black">Guided setup preserved</p><p className="mt-1">Recommended capabilities: {(result.recommendedCapabilities || recommendedCapabilities).join(', ')}</p></div> : null}
          <div className="mt-7 rounded-xl bg-slate-50 p-5 text-sm text-slate-700"><p><strong>Next step:</strong> sign in with the same email address. Your owner access, organization membership, tenant membership and Website Builder trial are provisioned before this success screen is returned.</p>{result.correlationId && <p className="mt-2 text-xs text-slate-500">Reference: {result.correlationId}</p>}</div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2"><a href={`https://app.elevateforhumanity.org/login?redirect=${encodeURIComponent(workspaceTarget)}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-bold text-white hover:bg-brand-red-700">Open Login <ArrowRight className="h-4 w-4" /></a>{result.publicPreviewUrl ? <a href={result.publicPreviewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-800 hover:bg-slate-50">Open Public Preview</a> : <Link href="/store" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-800 hover:bg-slate-50">Back to Store</Link>}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4"><Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Start Trial' }]} /></div>
      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-red-100 px-4 py-2 text-sm font-bold text-brand-red-700"><Shield className="h-4 w-4" />14-day organization trial</span>
            <h1 className="mt-5 text-4xl font-black text-slate-950">{demoToken ? 'Keep what you just built' : recommendedCapabilities.length ? 'Start with your recommended setup' : 'Test the platform with your own workspace'}</h1>
            <p className="mt-4 text-lg leading-7 text-slate-600">{demoToken ? `Convert your ${demoProduct || 'Elevate'} demo into a real workspace without rebuilding from zero. No card is required.` : 'No card is required. Choose whether you need a new site or want to connect an existing website.'}</p>
            {recommendedCapabilities.length ? <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-800"><p className="font-black">Your guided recommendations will carry forward</p><p className="mt-1">{recommendedCapabilities.join(', ')}</p></div> : null}
            <div className="mt-7 space-y-3 text-sm text-slate-700">{demoToken ? <p className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 flex-none text-violet-600" />Demo configuration is preserved into the workspace where supported</p> : null}<p className="flex gap-2"><Globe className="mt-0.5 h-4 w-4 flex-none text-brand-red-600" />Organization workspace and public preview</p><p className="flex gap-2"><Link2 className="mt-0.5 h-4 w-4 flex-none text-brand-red-600" />Existing-site connection path</p><p className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-red-600" />Owner access is provisioned before success</p></div>
          </div>

          <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="space-y-4"><label className="block text-sm font-bold text-slate-800">Organization name<input required minLength={2} value={orgName} onChange={(e) => setOrgName(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-3 font-normal" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold text-slate-800">Your name<input required minLength={2} value={adminName} onChange={(e) => setAdminName(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-3 font-normal" /></label><label className="block text-sm font-bold text-slate-800">Work email<input required type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-3 font-normal" /></label></div>{!demoToken ? <><fieldset><legend className="text-sm font-bold text-slate-800">Website setup</legend><div className="mt-2 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setWebsiteMode('new')} className={`rounded-xl border p-3 text-left text-sm font-semibold ${websiteMode === 'new' ? 'border-brand-red-500 bg-brand-red-50' : 'border-slate-300'}`}>Build a new site</button><button type="button" onClick={() => setWebsiteMode('existing')} className={`rounded-xl border p-3 text-left text-sm font-semibold ${websiteMode === 'existing' ? 'border-brand-red-500 bg-brand-red-50' : 'border-slate-300'}`}>Connect existing site</button></div></fieldset>{websiteMode === 'existing' && <label className="block text-sm font-bold text-slate-800">Existing website URL<input required type="url" value={existingUrl} onChange={(e) => setExistingUrl(e.target.value)} placeholder="https://example.org" className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-3 font-normal" /></label>}<label className="block text-sm font-bold text-slate-800">Programs offered <span className="font-normal text-slate-400">(optional)</span><input value={programs} onChange={(e) => setPrograms(e.target.value)} placeholder="CNA, HVAC, Barber…" className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-3 font-normal" /></label></> : null}</div>
            {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
            <button type="submit" disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3.5 font-bold text-white hover:bg-brand-red-700 disabled:opacity-60">{loading ? <><Loader2 className="h-5 w-5 animate-spin" />Creating workspace…</> : <>{demoToken ? 'Keep This Build & Start Trial' : 'Start Free Trial'} <ArrowRight className="h-4 w-4" /></>}</button>
            <p className="mt-3 text-center text-xs text-slate-500">No credit card required for the 14-day trial.</p>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function TrialPage() {
  return <Suspense fallback={<div className="min-h-[60vh] p-12 text-center text-slate-500">Loading trial…</div>}><TrialForm /></Suspense>;
}
