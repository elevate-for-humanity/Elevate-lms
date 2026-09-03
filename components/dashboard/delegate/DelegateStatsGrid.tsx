// components/dashboard/delegate/DelegateStatsGrid.tsx
export type DelegateStats = {
  totalLearners: number;
  onTrackCount: number;
  atRiskCount: number;
  inactiveCount: number;
  avgProgress: number;
};

type Props = {
  stats: DelegateStats;
};

export function DelegateStatsGrid({ stats }: Props) {
  return (
    <section className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
      <StatCard
        label="Total learners"
        value={stats.totalLearners}
        helper="Assigned to your caseload"
      />
      <StatCard label="On track" value={stats.onTrackCount} helper="Healthy progress" />
      <StatCard
        label="At risk"
        value={stats.atRiskCount}
        helper="< 30% progress"
        intent="warning"
      />
      <StatCard
        label="Inactive"
        value={stats.inactiveCount}
        helper="No activity 14+ days"
        intent="danger"
      />
      <StatCard
        label="Avg. progress"
        value={`${stats.avgProgress}%`}
        helper="Across your caseload"
      />
    </section>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  intent?: 'default' | 'warning' | 'danger';
};

function StatCard({ label, value, helper, intent = 'default' }: StatCardProps) {
  const badgeClass =
    intent === 'warning'
      ? 'bg-amber-50 text-amber-700'
      : intent === 'danger'
        ? 'bg-rose-50 text-rose-700'
        : 'bg-slate-50 text-black';

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
