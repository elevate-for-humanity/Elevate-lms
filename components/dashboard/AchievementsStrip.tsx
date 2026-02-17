// components/dashboard/AchievementsStrip.tsx
type Achievement = {
  id: string;
  name: string;
  icon: string | null;
  earned_at: string;
};

type Props = {
  achievements: Achievement[];
};

export function AchievementsStrip({ achievements }: Props) {
  if (!achievements.length) {
    return (
      <p className="text-xs text-slate-500">
        Start a course and complete your first lesson to unlock your first
        badge.
      </p>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {achievements.map((a) => (
        <div
          key={a.id}
          className="flex min-w-[120px] flex-col items-start gap-1 rounded-xl bg-slate-50 px-3 py-2 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange-100 text-xs">
              {a.icon ?? "⭐"}
            </span>
            <span className="font-medium text-black">{a.name}</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Earned{" "}
            {new Date(a.earned_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
