// Server component — enrollment pipeline funnel.
// Shows applied → enrolled → active → completed conversion at a glance.
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { AdminDashboardData } from './types';

interface Props {
  data: AdminDashboardData;
}

interface FunnelStep {
  label: string;
  value: number;
  href: string;
  color: string;
  bg: string;
}

function pct(num: number, denom: number) {
  if (!denom) return null;
  return Math.round((num / denom) * 100);
}

export function EnrollmentFunnel({ data }: Props) {
  const kpis = Array.isArray(data.kpis) ? data.kpis : [];
  const applied   = kpis.find(k => k.label === 'Pending Applications')?.value ?? 0;
  const active    = kpis.find(k => k.label === 'Active Enrollments')?.value ?? 0;
  const certs     = kpis.find(k => k.label === 'Certificates Issued')?.value ?? 0;
  // Total ever enrolled = active + completed (certs) + withdrawn (not tracked separately yet)
  const enrolled  = active + certs;

  const steps: FunnelStep[] = [
    { label: 'Applied',    value: applied,  href: '/admin/applications?status=submitted,pending,in_review,under_review,pending_admin_review,pending_funding', color: 'text-amber-700',      bg: 'bg-amber-50 border-amber-200' },
    { label: 'Enrolled',   value: enrolled, href: '/admin/students',                                                              color: 'text-brand-blue-700', bg: 'bg-brand-blue-50 border-brand-blue-200' },
    { label: 'Active',     value: active,   href: '/admin/students?status=active',                                                color: 'text-emerald-700',    bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Certified',  value: certs,    href: '/admin/certificates',                                                          color: 'text-purple-700',     bg: 'bg-purple-50 border-purple-200' },
  ];

  const enrollRate  = pct(enrolled, applied + enrolled);
  const activeRate  = pct(active, enrolled);
  const certRate    = pct(certs, enrolled);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-bold text-slate-900 text-sm">Enrollment Funnel</h2>
        <Link href="/admin/analytics" className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1">
          Analytics <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Funnel steps */}
      <div className="p-4 grid grid-cols-4 gap-2">
        {steps.map((step, i) => (
          <Link key={step.label} href={step.href} className={`flex flex-col items-center p-3 rounded-lg border ${step.bg} hover:opacity-80 transition-opacity`}>
            <span className={`text-2xl font-bold ${step.color}`}>{step.value.toLocaleString()}</span>
            <span className="text-xs text-slate-500 mt-0.5 text-center">{step.label}</span>
            {i > 0 && steps[i - 1].value > 0 && (
              <span className="text-xs font-semibold text-slate-400 mt-1">
                {pct(step.value, steps[i - 1].value)}%
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Conversion summary */}
      <div className="px-4 pb-4 flex flex-wrap gap-3 text-xs text-slate-500">
        {enrollRate !== null && (
          <span><strong className="text-slate-700">{enrollRate}%</strong> applied → enrolled</span>
        )}
        {activeRate !== null && enrolled > 0 && (
          <span><strong className="text-slate-700">{activeRate}%</strong> enrolled → active</span>
        )}
        {certRate !== null && enrolled > 0 && (
          <span><strong className="text-slate-700">{certRate}%</strong> enrolled → certified</span>
        )}
        {enrolled === 0 && applied === 0 && (
          <span className="text-slate-400 italic">No enrollment data yet</span>
        )}
      </div>
    </div>
  );
}
