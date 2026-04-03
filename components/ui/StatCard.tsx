/**
 * StatCard — displays a live metric with a skeleton while loading.
 *
 * Usage (server component — pass value directly):
 *   <StatCard label="Participants" value={count} />
 *
 * Usage (client component — pass undefined while fetching):
 *   <StatCard label="Retention Rate" value={data?.rate} />
 *
 * When value is undefined the card shows an animated skeleton.
 * When value is null it shows "—" (data unavailable).
 */

interface StatCardProps {
  label: string;
  value: string | number | null | undefined;
  sub?: string;
  className?: string;
}

export function StatCard({ label, value, sub, className = '' }: StatCardProps) {
  const isLoading = value === undefined;

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <h3 className="text-sm font-medium text-black mb-2">{label}</h3>
      {isLoading ? (
        <div className="space-y-2 mt-1">
          <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
          {sub && <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />}
        </div>
      ) : (
        <>
          <p className="text-3xl font-bold text-black">
            {value === null ? '—' : value}
          </p>
          {sub && <p className="text-xs text-black mt-1">{sub}</p>}
        </>
      )}
    </div>
  );
}
