// components/dashboard/program-holder/AtRiskLearnersTable.tsx
type AtRiskLearner = {
  id: string;
  name: string;
  email: string;
  program_title: string;
  course_title: string;
  progress_percent: number;
  last_accessed_at: string | null;
};

type Props = {
  learners: AtRiskLearner[];
};

export function AtRiskLearnersTable({ learners }: Props) {
  if (!learners.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-500">
        No learners are flagged as at risk right now. Keep an eye here to
        catch anyone who falls behind.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="max-h-80 overflow-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Learner</th>
              <th className="px-3 py-2">Program</th>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Progress</th>
              <th className="px-3 py-2">Last active</th>
            </tr>
          </thead>
          <tbody>
            {learners.map((l) => (
              <tr key={l.id} className="border-t border-slate-50">
                <td className="px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-black">
                      {l.name}
                    </span>
                    {l.email && (
                      <span className="text-[11px] text-slate-500">
                        {l.email}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-black">
                  {l.program_title}
                </td>
                <td className="px-3 py-2 text-xs text-black">
                  {l.course_title}
                </td>
                <td className="px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-black">
                      {l.progress_percent}%
                    </span>
                    <div className="h-1.5 w-20 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-brand-orange-500"
                        style={{
                          width: `${Math.min(
                            Math.max(l.progress_percent, 0),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-[11px] text-slate-500">
                  {l.last_accessed_at
                    ? new Date(l.last_accessed_at).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" }
                      )
                    : "No activity yet"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
