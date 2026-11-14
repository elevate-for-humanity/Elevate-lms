// components/dashboard/program-holder/ProgramHolderStatsGrid.tsx
export type ProgramHolderStats = {
  totalLearners: number;
  activeLearners: number;
  completedLearners: number;
  activePrograms: number;
  activeCourses: number;
  monthlyRevenue: number;
};

type Props = {
  stats: ProgramHolderStats;
};

export function ProgramHolderStatsGrid({ stats }: Props) {
  return (
    <section className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
      <StatCard
        label="Total learners"
        value={stats.totalLearners}
        helper="All learners in your programs"
      />
      <StatCard
        label="Active learners"
        value={stats.activeLearners}
        helper="Currently enrolled and learning"
      />
      <StatCard
        label="Completed learners"
        value={stats.completedLearners}
        helper="Finished at least one course"
      />
      <StatCard
        label="Active programs"
        value={stats.activePrograms}
        helper="Programs running right now"
      />
      <StatCard
        label="Active courses"
        value={stats.activeCourses}
        helper="Courses under your programs"
      />
      <StatCard
        label="This month revenue"
        value={stats.monthlyRevenue ? `$${stats.monthlyRevenue.toLocaleString()}` : '$0'}
        helper="Funding / revenue recorded"
      />
    </section>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-black">{value}</p>
      {helper && <p className="mt-1 text-[11px] text-slate-500">{helper}</p>}
    </div>
  );
}
