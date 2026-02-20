export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  ArrowRight, Shield, Building2, Users, FileCheck, Clock,
  Server, Globe, Lock, BarChart3, CheckCircle, Zap,
  XCircle, Minus,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'License the Platform | Elevate Workforce Infrastructure',
  description: 'Deploy a compliance-ready workforce training platform in weeks. White-label, hosted SaaS, or state-contract editions. Built by operators. Owned outright.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform/licensing' },
};

export default async function LicensingPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('system_settings').select('*').limit(50);

  return (
    <div className="min-h-screen bg-white">

      {/* Hero — Authority framing */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-blue-900/30 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-2 mb-8">
              <Lock className="w-4 h-4 text-brand-blue-400" />
              <span className="text-sm text-white/80">Proprietary Platform &middot; Full IP Ownership &middot; Licensable</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-6">
              Built by workforce operators.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue-400 to-emerald-400">
                Designed for compliance.
              </span><br />
              Available for licensing.
            </h1>

            <p className="text-xl text-white/60 mb-10 max-w-2xl">
              This is not a generic LMS reskinned for workforce. It was built from the ground up by an organization that runs training programs, manages WIOA compliance, and places graduates into jobs. Every feature exists because an operator needed it.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/platform/licensing/request"
                className="inline-flex items-center justify-center gap-3 bg-white text-slate-900 font-bold text-lg px-10 py-5 rounded-2xl hover:bg-slate-100 transition-all group"
              >
                Request Licensing Brief
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/platform"
                className="inline-flex items-center justify-center gap-3 border-2 border-white/20 text-white font-semibold text-lg px-10 py-5 rounded-2xl hover:bg-white/5 transition-all"
              >
                Platform Overview
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Operational proof — not theoretical */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Operational Proof
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6">
                We run this ourselves.<br />This is not theoretical.
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Elevate for Humanity operates this platform daily — managing enrollments, tracking apprenticeship hours, generating compliance reports, and connecting graduates with employers across Indiana. Every feature has been tested in production with real students, real funding sources, and real audits.
              </p>
              <div className="space-y-4">
                {[
                  'ETPL-approved provider under Indiana DWD',
                  'Active WIOA, WRG, and JRI funding integrations',
                  'Registered Apprenticeship programs with DOL',
                  'Multi-region workforce board partnerships',
                  'FERPA-compliant student data handling',
                  'Real-time outcome tracking and reporting',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-6">Platform by the Numbers</h3>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: '900+', label: 'Application pages' },
                  { value: '500+', label: 'Database tables' },
                  { value: '6', label: 'Portal types' },
                  { value: '17+', label: 'Compliance modules' },
                  { value: '100%', label: 'Audit-ready' },
                  { value: '4–8 wk', label: 'Deployment time' },
                ].map((stat, i) => (
                  <div key={i}>
                    <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Competitive differentiation */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Why Not a Generic LMS
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Built for workforce. Not adapted for it.
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Generic LMS platforms were built for corporate training or online courses. They bolt on compliance as an afterthought. This platform was built compliance-first, funding-first, and outcomes-first.
            </p>
          </div>

          {/* Comparison table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-4 font-semibold text-slate-500 w-1/3">Capability</th>
                    <th className="text-center p-4 font-bold text-slate-900 bg-brand-blue-50 border-x border-brand-blue-100">
                      <span className="text-brand-blue-600">Elevate Platform</span>
                    </th>
                    <th className="text-center p-4 font-semibold text-slate-500">TalentLMS / Thinkific</th>
                    <th className="text-center p-4 font-semibold text-slate-500">Moodle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { feature: 'WIOA eligibility screening', us: true, generic: false, moodle: false },
                    { feature: 'Apprenticeship hour tracking', us: true, generic: false, moodle: false },
                    { feature: 'Funding source integration (WIOA/WRG/JRI)', us: true, generic: false, moodle: false },
                    { feature: 'Multi-portal (student/employer/staff/partner)', us: true, generic: false, moodle: 'partial' },
                    { feature: 'FERPA-compliant data handling', us: true, generic: false, moodle: 'partial' },
                    { feature: 'Audit-ready compliance reports', us: true, generic: false, moodle: false },
                    { feature: 'Employer talent pipeline', us: true, generic: false, moodle: false },
                    { feature: 'Outcome tracking (employment, wages)', us: true, generic: false, moodle: false },
                    { feature: 'Course management', us: true, generic: true, moodle: true },
                    { feature: 'Certificate generation', us: true, generic: true, moodle: true },
                    { feature: 'SCORM support', us: true, generic: true, moodle: true },
                    { feature: 'White-label branding', us: true, generic: true, moodle: 'partial' },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="p-4 text-slate-700">{row.feature}</td>
                      <td className="p-4 text-center bg-brand-blue-50/50 border-x border-brand-blue-50">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                      </td>
                      <td className="p-4 text-center">
                        {row.generic === true ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> :
                         row.generic === 'partial' ? <Minus className="w-5 h-5 text-yellow-500 mx-auto" /> :
                         <XCircle className="w-5 h-5 text-slate-300 mx-auto" />}
                      </td>
                      <td className="p-4 text-center">
                        {row.moodle === true ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> :
                         row.moodle === 'partial' ? <Minus className="w-5 h-5 text-yellow-500 mx-auto" /> :
                         <XCircle className="w-5 h-5 text-slate-300 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment tiers */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Deployment Options
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Three ways to deploy.
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: 'Hosted SaaS',
                subtitle: 'Fastest path to production',
                desc: 'We host, maintain, and update the platform. You get a branded instance with your domain, logo, and configuration. Ideal for organizations that want to launch fast without managing infrastructure.',
                features: ['Custom domain & branding', 'Managed hosting & updates', 'Shared infrastructure', '99.9% uptime SLA'],
                ideal: 'Training providers, workforce boards, community colleges',
              },
              {
                icon: Building2,
                title: 'White-Label License',
                subtitle: 'Full brand ownership',
                desc: 'Your brand, your domain, your data. Dedicated instance with full customization. We handle the technical deployment; you own the customer relationship.',
                features: ['Dedicated instance', 'Full brand customization', 'Custom integrations', 'Priority support'],
                ideal: 'State agencies, large providers, franchise operators',
                featured: true,
              },
              {
                icon: Server,
                title: 'State Contract Edition',
                subtitle: 'Procurement-ready',
                desc: 'Designed for government procurement. Includes compliance documentation, security audit reports, data residency options, and dedicated account management.',
                features: ['On-premise or gov-cloud', 'FedRAMP-aligned security', 'Procurement documentation', 'Dedicated account team'],
                ideal: 'State workforce agencies, DOL regional offices',
              },
            ].map((tier, i) => {
              const Icon = tier.icon;
              return (
                <div
                  key={i}
                  className={`rounded-2xl p-8 flex flex-col ${
                    tier.featured
                      ? 'bg-slate-900 text-white ring-2 ring-brand-blue-500 shadow-xl'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                    tier.featured ? 'bg-brand-blue-500' : 'bg-slate-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${tier.featured ? 'text-white' : 'text-slate-700'}`} />
                  </div>
                  <h3 className={`text-xl font-extrabold mb-1 ${tier.featured ? 'text-white' : 'text-slate-900'}`}>
                    {tier.title}
                  </h3>
                  <p className={`text-sm font-medium mb-4 ${tier.featured ? 'text-brand-blue-300' : 'text-slate-500'}`}>
                    {tier.subtitle}
                  </p>
                  <p className={`mb-6 ${tier.featured ? 'text-white/70' : 'text-slate-600'}`}>
                    {tier.desc}
                  </p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {tier.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 ${tier.featured ? 'text-brand-blue-400' : 'text-emerald-500'}`} />
                        <span className={`text-sm ${tier.featured ? 'text-white/80' : 'text-slate-700'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <p className={`text-xs mb-6 ${tier.featured ? 'text-white/40' : 'text-slate-400'}`}>
                    Ideal for: {tier.ideal}
                  </p>
                  <Link
                    href="/platform/licensing/request"
                    className={`inline-flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-xl transition-all ${
                      tier.featured
                        ? 'bg-white text-slate-900 hover:bg-slate-100'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    Request Brief
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* IP & Ownership */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Ownership & IP
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
              Clean IP. Full ownership. No dependencies.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Lock,
                title: 'Proprietary Codebase',
                desc: 'Custom-built from scratch. Not a fork, not a theme, not a plugin ecosystem. Full source code ownership with clean IP chain.',
              },
              {
                icon: FileCheck,
                title: 'No Restrictive Licenses',
                desc: 'Built on MIT/Apache-licensed open-source foundations (Next.js, Supabase, PostgreSQL). No GPL contamination. No vendor lock-in.',
              },
              {
                icon: Shield,
                title: 'Regulatory Framework Knowledge',
                desc: 'WIOA, FERPA, DOL Registered Apprenticeship, ETPL, WRG, JRI — built into the architecture, not bolted on.',
              },
              {
                icon: Zap,
                title: 'Deployment Capability',
                desc: 'Proven deployment pipeline. Netlify + Cloudflare (our stack), Vercel, or self-hosted. Database on Supabase or self-managed PostgreSQL. Your infrastructure, your choice.',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-slate-700" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How licensing works */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-12 text-center">
            How Licensing Works
          </h2>

          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Request Licensing Brief',
                desc: 'Tell us about your organization, student volume, and compliance requirements. We send a detailed technical and commercial brief within 48 hours.',
              },
              {
                step: '2',
                title: 'Technical Walkthrough',
                desc: 'Meet with our team to review the platform live, discuss customization needs, and scope the deployment. No sales pitch — just architecture.',
              },
              {
                step: '3',
                title: 'Deploy',
                desc: 'We configure your instance, apply your branding, migrate any existing data, and train your team. Most deployments complete in 4–8 weeks.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-slate-950 text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            Ready to deploy workforce infrastructure?
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Request a licensing brief. No sales pitch. Just the technical and commercial details you need to evaluate fit.
          </p>
          <Link
            href="/platform/licensing/request"
            className="inline-flex items-center justify-center gap-3 bg-white text-slate-900 font-bold text-lg px-10 py-5 rounded-2xl hover:bg-slate-100 transition-all group"
          >
            Request Licensing Brief
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-8 text-sm text-slate-500">
            Or email directly: <a href="/contact" className="underline hover:text-white/60">Contact Us</a>
          </p>
        </div>
      </section>

    </div>
  );
}
