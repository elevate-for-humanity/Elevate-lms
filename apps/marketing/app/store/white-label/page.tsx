'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Cloud, Shield, Zap, Headphones, Globe, Palette, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: Cloud, title: 'Managed Infrastructure', description: 'Hosting, deployment configuration, health checks, and application updates are operated through the managed platform release process.' },
  { icon: Palette, title: 'Organization Branding', description: 'Configure approved organization branding, including logo, colors, and supported presentation settings.' },
  { icon: Globe, title: 'Domain Options', description: 'Use the platform address or connect an approved custom domain through the supported DNS and TLS workflow.' },
  { icon: Shield, title: 'Security Controls', description: 'Role-based access, audit logging, RLS-protected data, privileged-role MFA enforcement, and controlled server credentials support the security model.' },
  { icon: Zap, title: 'Managed Releases', description: 'Application changes move through source control, CI validation, immutable builds, health verification, and production deployment controls.' },
  { icon: Headphones, title: 'Support', description: 'Support channels and response commitments follow the purchased plan or signed agreement.' },
];

const PLAN_SCOPE = [
  { name: 'Growth', description: 'For a training organization using standard managed-platform workflows.', features: ['Organization workspace', 'Brand configuration', 'Managed hosting', 'Standard support terms', 'Plan-scoped capacity'] },
  { name: 'Scale', description: 'For organizations requiring expanded operations and integrations.', features: ['Expanded role-based workspaces', 'Custom-domain option', 'Integration options', 'Expanded support terms', 'Plan-scoped capacity'] },
  { name: 'Enterprise', description: 'For larger organizations with procurement-defined requirements.', features: ['Contract-scoped capacity', 'Deployment and identity options', 'Custom integration scope', 'Security and acceptance requirements', 'Contract-defined service terms'] },
];

export default function WhiteLabelPage() {
  const [subdomain, setSubdomain] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  const checkSubdomain = async () => {
    if (!subdomain || subdomain.length < 3) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/provisioning/tenant?subdomain=${encodeURIComponent(subdomain)}`);
      const data = await res.json();
      setAvailable(Boolean(data.available));
    } catch {
      setAvailable(null);
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-6xl text-center">
          <span className="inline-block rounded-full bg-brand-blue-500/15 px-4 py-1 text-sm font-bold text-brand-blue-200">Managed organization platform</span>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black sm:text-5xl">Your Organization. Your Brand. One Managed Platform.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">Configure an organization workspace without creating a second codebase or unsupported infrastructure promise.</p>

          <div className="mx-auto mt-9 max-w-xl rounded-2xl border border-white/10 bg-white p-6 text-left text-slate-950 shadow-xl">
            <label className="block text-sm font-bold text-slate-800">Check organization ID availability</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input type="text" value={subdomain} onChange={(event) => { setSubdomain(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setAvailable(null); }} placeholder="yourorg" className="min-h-12 flex-1 rounded-xl border border-slate-300 px-4 outline-none focus:ring-2 focus:ring-brand-blue-600" />
              <button type="button" onClick={checkSubdomain} disabled={checking || subdomain.length < 3} className="min-h-12 rounded-xl bg-brand-blue-700 px-6 font-bold text-white disabled:opacity-50">{checking ? 'Checking…' : 'Check'}</button>
            </div>
            {available !== null ? <p className={`mt-2 text-sm font-bold ${available ? 'text-green-700' : 'text-red-700'}`}>{available ? 'Available' : 'Already in use'}</p> : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-black text-slate-950">Managed capabilities</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => <article key={feature.title} className="rounded-2xl border border-slate-200 p-6 shadow-sm"><feature.icon className="h-9 w-9 text-brand-blue-700" /><h3 className="mt-4 text-lg font-black text-slate-950">{feature.title}</h3><p className="mt-2 leading-7 text-slate-600">{feature.description}</p></article>)}
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-black text-slate-950">Choose scope before price</h2>
          <p className="mx-auto mt-3 max-w-3xl text-center leading-7 text-slate-600">Current pricing and included limits are presented in the applicable store offer or agreement. This page describes service scope without inventing learner, storage, response-time, backup, or availability guarantees.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PLAN_SCOPE.map((plan) => <article key={plan.name} className="rounded-2xl border border-slate-200 bg-white p-7"><h3 className="text-2xl font-black text-slate-950">{plan.name}</h3><p className="mt-2 min-h-16 text-slate-600">{plan.description}</p><ul className="mt-5 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm font-semibold text-slate-700"><Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />{feature}</li>)}</ul></article>)}
          </div>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/store/licenses" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue-700 px-7 py-3 font-bold text-white">View Current License Offers <ArrowRight className="h-4 w-4" /></Link><Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-3 font-bold text-slate-900">Discuss Enterprise Scope</Link></div>
        </div>
      </section>
    </main>
  );
}
