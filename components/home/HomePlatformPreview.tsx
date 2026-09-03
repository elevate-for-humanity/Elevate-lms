import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const PLATFORM_CAPABILITIES = [
  {
    label: 'Learner Portal',
    desc: 'Progress, assignments, attendance, credentials, and learner records in one authenticated workspace.',
    img: '/images/pages/platform-page-1.webp',
    href: 'https://app.elevateforhumanity.org/lms',
  },
  {
    label: 'Employer & Apprenticeship Workflows',
    desc: 'OJL/RTI records, competencies, documents, host-site activity, and apprenticeship progress.',
    img: '/images/pages/employer-portal-page-1.webp',
    href: '/for-employers',
  },
  {
    label: 'Administrative Operations',
    desc: 'Applications, program records, compliance evidence, reporting workflows, and operational dashboards.',
    img: '/images/pages/admin-analytics-hero.webp',
    href: '/for-agencies',
  },
] as const;

const SYSTEM_FEATURES = [
  { label: 'Course and curriculum tooling', detail: 'Structured course creation, learner delivery, assessments, and progress records' },
  { label: 'Apprenticeship evidence', detail: 'Separate OJL, RTI, competency, wage, document, and mentor-verification workflows' },
  { label: 'Compliance records', detail: 'Evidence-bound regulatory records, approval controls, and audit-oriented data boundaries' },
  { label: 'Role-based workspaces', detail: 'Learner, employer, host-site, workforce, and administrative surfaces with scoped access' },
  { label: 'Credential records', detail: 'Credential issuance and verification metadata tied to program and learner records' },
  { label: 'Employer coordination', detail: 'Host-site records, work-based learning progress, and employer-facing operational tools' },
] as const;

export function HomePlatformPreview() {
  return (
    <section className="bg-slate-950 py-16 px-4" aria-labelledby="platform-heading">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">See the connected platform</p>
          <h2 id="platform-heading" className="text-2xl sm:text-3xl font-extrabold text-white mb-3">The workflows behind training, apprenticeships, and workforce operations.</h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">These previews show the types of authenticated workspaces used across the platform. Exact access and capabilities depend on the user's role, program, and contract.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {PLATFORM_CAPABILITIES.map((cap) => (
            <Link key={cap.label} href={cap.href} className="group flex flex-col rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all hover:-translate-y-0.5">
              <div className="relative w-full aspect-[16/9] max-h-48 overflow-hidden bg-slate-800">
                <Image src={cap.img} alt={`${cap.label} platform preview`} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 33vw" loading="lazy" placeholder="empty" />
              </div>
              <div className="p-4">
                <p className="text-sm font-extrabold text-white mb-1">{cap.label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{cap.desc}</p>
                <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-brand-red-400 group-hover:text-brand-red-300 transition-colors">Learn more <ArrowRight className="w-3 h-3" /></span>
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-5">Demonstrated platform capabilities</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SYSTEM_FEATURES.map((feature) => (
              <div key={feature.label} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-red-500 mt-1.5 shrink-0" aria-hidden="true" />
                <div><p className="text-xs font-bold text-white">{feature.label}</p><p className="text-[11px] text-slate-400 leading-snug mt-0.5">{feature.detail}</p></div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-slate-400 max-w-md">Agency or enterprise commitments such as SLA, custom integrations, white-labeling, or specific security attestations are established in the applicable agreement and evidence package.</p>
            <Link href="/platform" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors shrink-0">Platform overview <ArrowRight className="w-3 h-3" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
