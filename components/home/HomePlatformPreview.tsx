/**
 * HomePlatformPreview
 *
 * Subtly reveals backend sophistication without overwhelming users.
 * Framed as "technology supporting student success" — not "look at our infrastructure."
 * Uses platform screenshot images already in /public/images/pages/.
 */

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const PLATFORM_CAPABILITIES = [
  {
    label: 'Learner Portal',
    desc: 'Progress tracking, assignments, attendance, and messaging — all in one place.',
    img: '/images/pages/platform-page-1.webp',
    href: '/lms',
  },
  {
    label: 'Employer Dashboard',
    desc: 'Live cohort visibility, OJT hours, apprenticeship status, and compliance docs.',
    img: '/images/pages/employer-portal-page-1.webp',
    href: '/for-employers',
  },
  {
    label: 'Workforce Analytics',
    desc: 'Outcome tracking, WIOA performance metrics, and agency reporting — automated.',
    img: '/images/pages/admin-analytics-hero.webp',
    href: '/for-agencies',
  },
];

const SYSTEM_FEATURES = [
  { label: 'AI-powered curriculum', detail: 'Adaptive content generation and personalized learning paths' },
  { label: 'Geofenced attendance', detail: 'Automatic check-in at employer and training sites' },
  { label: 'Compliance automation', detail: 'WIOA documentation, RAPIDS exports, audit trails' },
  { label: 'Predictive risk alerts', detail: 'Early intervention when learners show at-risk signals' },
  { label: 'Credential verification', detail: 'Public blockchain-anchored credential verification' },
  { label: 'Employer coordination', detail: 'OJT agreements, wage tracking, placement pipelines' },
];

export function HomePlatformPreview() {
  return (
    <section
      className="bg-slate-950 py-16 px-4"
      aria-labelledby="platform-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            The Platform Behind the Outcomes
          </p>
          <h2
            id="platform-heading"
            className="text-2xl sm:text-3xl font-extrabold text-white mb-3"
          >
            Technology built for workforce, not classrooms.
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
            Every learner, employer, and agency gets purpose-built tools — not a generic LMS
            bolted onto a spreadsheet. The platform handles compliance, tracking, and reporting
            so people can focus on outcomes.
          </p>
        </div>

        {/* Portal preview cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {PLATFORM_CAPABILITIES.map((cap) => (
            <Link
              key={cap.label}
              href={cap.href}
              className="group flex flex-col rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all hover:-translate-y-0.5"
            >
              <div className="relative w-full aspect-[16/9] max-h-48 overflow-hidden bg-slate-800">
                <Image
                  src={cap.img}
                  alt={`${cap.label} screenshot`}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 33vw"
                  loading="lazy"
                  placeholder="empty"
                />

              </div>
              <div className="p-4">
                <p className="text-sm font-extrabold text-white mb-1">{cap.label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{cap.desc}</p>
                <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-brand-red-400 group-hover:text-brand-red-300 transition-colors">
                  Learn more <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* System features grid */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-5">
            What runs under the hood
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SYSTEM_FEATURES.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-red-500 mt-1.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-white">{f.label}</p>
                  <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-slate-400 max-w-md">
              Built for workforce agencies, employers, and training providers who need
              institutional-grade infrastructure — not consumer software.
            </p>
            <Link
              href="/platform"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors shrink-0"
            >
              Platform overview <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
