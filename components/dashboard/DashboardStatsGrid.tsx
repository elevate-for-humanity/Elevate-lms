// components/dashboard/DashboardStatsGrid.tsx
export type DashboardStats = {
  activeCourses: number;
  completedCourses: number;
  avgCompletionPercent: number;
  hoursThisMonth: number;
  currentStreakDays: number;
  longestStreakDays: number;
};

type Props = {
  stats: DashboardStats;
};

export function DashboardStatsGrid({ stats }: Props) {
  return (
    <section className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
      <StatCard label="Active courses" value={stats.activeCourses} helper="Currently in progress" />
      <StatCard label="Completed" value={stats.completedCourses} helper="Finished courses" />
      <StatCard
        label="Avg. completion"
        value={`${stats.avgCompletionPercent}%`}
        helper="Across all courses"
      />
      <StatCard
        label="Hours this month"
        value={stats.hoursThisMonth}
        helper="Approx. training time"
      />
      <StatCard
        label="Current streak"
        value={`${stats.currentStreakDays}d`}
        helper="Daily learning"
      />
      <StatCard label="Longest streak" value={`${stats.longestStreakDays}d`} helper="Best record" />
    </section>
  );
}

type StatCardProps = {
  label: string;
  value: number | string;
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
