// components/dashboard/admin/ComplianceStatsGrid.tsx
export type ComplianceStats = {
  totalLearners: number;
  totalPrograms: number;
  compliantCount: number;
  atRiskCount: number;
  nonCompliantCount: number;
  expiringSoonCount: number;
};

type Props = {
  stats: ComplianceStats;
};

export function ComplianceStatsGrid({ stats }: Props) {
  return (
    <section className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
      <StatCard label="Total learners" value={stats.totalLearners} helper="In tracked programs" />
      <StatCard label="Programs" value={stats.totalPrograms} helper="WRG / WIOA / JRI / others" />
      <StatCard
        label="Compliant"
        value={stats.compliantCount}
        helper="Fully meeting requirements"
        intent="good"
      />
      <StatCard
        label="At risk"
        value={stats.atRiskCount}
        helper="Falling behind targets"
        intent="warn"
      />
      <StatCard
        label="Non-compliant"
        value={stats.nonCompliantCount}
        helper="Requires immediate action"
        intent="bad"
      />
      <StatCard
        label="Expiring soon"
        value={stats.expiringSoonCount}
        helper="Certs within 30 days"
      />
    </section>
  );
}

type StatCardProps = {
  label: string;
  value: number | string;
  helper?: string;
  intent?: 'default' | 'good' | 'warn' | 'bad';
};

function StatCard({ label, value, helper, intent = 'default' }: StatCardProps) {
  let badgeClass = 'bg-slate-50 text-black border border-slate-100';

  if (intent === 'good') {
    badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
  } else if (intent === 'warn') {
    badgeClass = 'bg-amber-50 text-amber-700 border border-amber-100';
  } else if (intent === 'bad') {
    badgeClass = 'bg-rose-50 text-rose-700 border border-rose-100';
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-black">{value}</p>
      {helper && (
        <span
          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}
        >
          {helper}
        </span>
      )}
    </div>
  );
}
