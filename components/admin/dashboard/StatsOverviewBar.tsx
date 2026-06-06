// Server component — no client state.
// Renders a horizontal stats bar with key all-time and period metrics.
import Link from 'next/link';
import { Users, BookOpen, DollarSign, BadgeCheck, FileText, TrendingUp } from 'lucide-react';
import type { AdminDashboardData } from './types';

interface Props {
  data: AdminDashboardData;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  href: string;
  urgent?: boolean;
}

function StatCard({ icon, label, value, sub, href, urgent }: StatCardProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col gap-1 px-4 py-3 rounded-xl border transition-colors min-w-0 ${
        urgent
          ? 'border-amber-200 bg-amber-50 hover:bg-amber-100'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className={urgent ? 'text-amber-500' : 'text-slate-400'}>{icon}</span>
        <span className="text-xs font-medium text-slate-500 truncate">{label}</span>
      </div>
      <span className={`text-xl font-black tabular-nums leading-none ${urgent ? 'text-amber-700' : 'text-slate-900'}`}>
        {value}
      </span>
      {sub && <span className="text-[11px] text-slate-400 truncate">{sub}</span>}
    </Link>
  );
}

function fmt(cents: number) {
  if (cents >= 100_000_00) return `$${(cents / 100_000_00).toFixed(1)}M`;
  if (cents >= 1_000_00)   return `$${(cents / 1_000_00).toFixed(1)}k`;
  return `$${(cents / 100).toLocaleString('en-US')}`;
}

export function StatsOverviewBar({ data }: Props) {
  const counts = data.counts ?? {
    pendingApplications: 0,
    activeEnrollments: 0,
    revenueThisMonthCents: 0,
    certificatesIssued: 0,
    pendingProgramHolders: 0,
    pendingDocuments: 0,
  };
  const totalStudents = data.totalStudents ?? 0;
  const revenueAllTimeCents = data.revenueAllTimeCents ?? 0;
  const operational = data.operational;

  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Overview</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <StatCard
          icon={<Users className="w-3.5 h-3.5" aria-hidden="true" />}
          label="Total Students"
          value={totalStudents.toLocaleString()}
          sub="all time"
          href="/admin/students"
        />
        <StatCard
          icon={<BookOpen className="w-3.5 h-3.5" aria-hidden="true" />}
          label="Active Enrollments"
          value={counts.activeEnrollments.toLocaleString()}
          sub="currently enrolled"
          href="/admin/students?status=active"
        />
        <StatCard
          icon={<DollarSign className="w-3.5 h-3.5" aria-hidden="true" />}
          label="Revenue (Month)"
          value={fmt(counts.revenueThisMonthCents)}
          sub={`${fmt(revenueAllTimeCents)} all time`}
          href="/admin/students?payment_status=paid"
        />
        <StatCard
          icon={<BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />}
          label="Certificates"
          value={counts.certificatesIssued.toLocaleString()}
          sub="issued all time"
          href="/admin/certificates"
        />
        <StatCard
          icon={<FileText className="w-3.5 h-3.5" aria-hidden="true" />}
          label="Pending Applications"
          value={counts.pendingApplications.toLocaleString()}
          sub="awaiting review"
          href="/admin/applications?status=submitted,pending,in_review,under_review,pending_admin_review,pending_funding"
          urgent={counts.pendingApplications > 0}
        />
        <StatCard
          icon={<TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />}
          label="New Today"
          value={(operational.newAppsToday + operational.newLeadsToday + operational.newEnrollmentsToday).toLocaleString()}
          sub={`${operational.newAppsToday} apps · ${operational.newLeadsToday} leads · ${operational.newEnrollmentsToday} enrolls`}
          href="/admin/activity"
        />
      </div>
    </div>
  );
}
