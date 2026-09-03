// Server component — no client state.
// Renders a single-row "what happened today" strip above the KPI grid.
import Link from 'next/link';
import { FileText, Users, TrendingUp, ArrowRight } from 'lucide-react';
import type { OperationalCounts } from './types';

interface Props {
  operational: OperationalCounts;
}

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  urgent?: boolean;
}

function StatPill({ icon, label, value, href, urgent }: StatPillProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
        urgent && value > 0
          ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      <span className={urgent && value > 0 ? 'text-amber-500' : 'text-slate-400'}>{icon}</span>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs text-slate-500 hidden sm:inline">{label}</span>
    </Link>
  );
}

export function TodayActivityStrip({ operational }: Props) {
  const total = operational.newAppsToday + operational.newLeadsToday + operational.newEnrollmentsToday;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Today</p>
        {total === 0 && (
          <p className="text-xs text-slate-400">No new activity yet</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <StatPill
          icon={<FileText className="w-4 h-4" />}
          label="applications"
          value={operational.newAppsToday}
          href="/applications?status=submitted,pending,in_review,pending_admin_review"
          urgent
        />
        <StatPill
          icon={<TrendingUp className="w-4 h-4" />}
          label="new leads"
          value={operational.newLeadsToday}
          href="/crm/leads"
        />
        <StatPill
          icon={<Users className="w-4 h-4" />}
          label="enrollments"
          value={operational.newEnrollmentsToday}
          href="/students?status=active"
        />
        {total > 0 && (
          <Link
            href="/activity"
            className="flex items-center gap-1 px-3 py-2.5 text-xs text-brand-blue-600 hover:underline ml-auto"
          >
            Full activity log <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
