// components/ui/ProgressBar.tsx
type ProgressBarProps = {
  progress: number; // 0–100
};

export function ProgressBar({ progress }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-[11px] text-black">
        <span className="font-medium text-black">Progress</span>
        <span>{clamped}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-200">
        <div
          className="h-2.5 rounded-full bg-brand-orange-600 transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
