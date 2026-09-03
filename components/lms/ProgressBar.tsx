type Props = { progress: number; showLabel?: boolean; size?: 'sm' | 'md' | 'lg' };

export function ProgressBar({ progress, showLabel = true, size = 'md' }: Props) {
  const pct = Math.max(0, Math.min(100, progress || 0));
  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wide text-black">Progress</span>
          <span className="font-semibold text-black">{pct}%</span>
        </div>
      )}
      <div className={`w-full rounded-full bg-slate-200 ${heightClass}`}>
        <div
          className={`${heightClass} rounded-full    transition-all duration-500 ease-smooth`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
