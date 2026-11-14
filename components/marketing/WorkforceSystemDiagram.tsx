/**
 * WorkforceSystemDiagram
 *
 * Visual flow: Participant → Training → Credential → Employer → Reporting
 * Pure CSS/HTML — no external chart libraries, server-renderable.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const NODES = [
  {
    step: '01',
    label: 'Participant',
    sublabel: 'Intake & Eligibility',
    detail: 'WIOA eligibility check, funding match, IEP alignment, enrollment',
    color: 'bg-slate-800 border-slate-700',
    accent: 'text-brand-red-400',
    href: '/check-eligibility',
  },
  {
    step: '02',
    label: 'Training',
    sublabel: 'LMS + Credentialing',
    detail: 'Online + in-person coursework, checkpoint assessments, attendance tracking',
    color: 'bg-slate-800 border-slate-700',
    accent: 'text-amber-400',
    href: '/programs',
  },
  {
    step: '03',
    label: 'Credential',
    sublabel: 'Verified Certificate',
    detail: 'Industry-recognized credential issued, publicly verifiable, DOL-aligned',
    color: 'bg-slate-800 border-slate-700',
    accent: 'text-emerald-400',
    href: '/verify',
  },
  {
    step: '04',
    label: 'Employer',
    sublabel: 'Placement & OJT',
    detail: 'Job placement, OJT/WEX agreements, apprenticeship hours, wage tracking',
    color: 'bg-slate-800 border-slate-700',
    accent: 'text-blue-400',
    href: '/employer/dashboard',
  },
  {
    step: '05',
    label: 'Reporting',
    sublabel: 'Agency Outcomes',
    detail: 'RAPIDS-compatible exports, DWD reporting, WIOA performance metrics',
    color: 'bg-slate-800 border-slate-700',
    accent: 'text-purple-400',
    href: '/for-agencies',
  },
];

export function WorkforceSystemDiagram() {
  return (
    <section className="bg-slate-950 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest text-center mb-3">
          How the system works
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-3">
          One cycle. Every stakeholder.
        </h2>
        <p className="text-slate-400 text-sm text-center max-w-xl mx-auto mb-12">
          From first contact to employer placement and agency reporting — every step is tracked,
          documented, and verifiable.
        </p>

        {/* Desktop: horizontal flow */}
        <div className="hidden lg:flex items-stretch gap-0">
          {NODES.map((node, i) => (
            <div key={node.step} className="flex items-stretch flex-1">
              <Link
                href={node.href}
                className={`flex-1 ${node.color} border rounded-xl p-5 flex flex-col gap-2 hover:border-slate-500 transition-colors group`}
              >
                <span className={`text-xs font-black ${node.accent} tracking-widest`}>
                  {node.step}
                </span>
                <h3 className="text-white font-extrabold text-base leading-tight">{node.label}</h3>
                <p className={`text-xs font-semibold ${node.accent}`}>{node.sublabel}</p>
                <p className="text-slate-400 text-xs leading-relaxed mt-1">{node.detail}</p>
              </Link>
              {i < NODES.length - 1 && (
                <div className="flex items-center px-2 shrink-0">
                  <ArrowRight className="w-5 h-5 text-slate-600" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical stack */}
        <div className="flex lg:hidden flex-col gap-3">
          {NODES.map((node, i) => (
            <div key={node.step}>
              <Link
                href={node.href}
                className={`block ${node.color} border rounded-xl p-5 hover:border-slate-500 transition-colors`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-black ${node.accent} tracking-widest`}>
                    {node.step}
                  </span>
                  <h3 className="text-white font-extrabold text-sm">{node.label}</h3>
                  <span className={`text-xs font-semibold ${node.accent} ml-auto`}>
                    {node.sublabel}
                  </span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{node.detail}</p>
              </Link>
              {i < NODES.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowRight className="w-4 h-4 text-slate-600 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom legend */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Participants', value: 'Tracked from day 1' },
            { label: 'Funding sources', value: 'WIOA · WRG · IMPACT' },
            { label: 'Credentials issued', value: 'Publicly verifiable' },
            { label: 'Employer placements', value: 'Wage outcomes logged' },
            { label: 'Agency reports', value: 'RAPIDS-compatible' },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-center"
            >
              <p className="text-white text-xs font-bold">{item.label}</p>
              <p className="text-slate-400 text-[10px] mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
