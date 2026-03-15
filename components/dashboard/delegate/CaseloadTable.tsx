// components/dashboard/delegate/CaseloadTable.tsx
export type CaseloadLearner = {
  learnerId: string;
  name: string;
  email: string;
  programTitle: string;
  programFundingType: string | null;
  courseTitle: string;
  progressPercent: number;
  status: string;
  lastAccessedAt: string | null;
  riskLevel: "on_track" | "at_risk" | "inactive";
};

type Props = {
  learners: CaseloadLearner[];
};

export function CaseloadTable({ learners }: Props) {
  if (!learners.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        No learners have been assigned to your caseload yet. Once they are,
        you&apos;ll see them here with progress and risk level.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="max-h-[480px] overflow-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Learner</th>
              <th className="px-4 py-2">Program</th>
              <th className="px-4 py-2">Course</th>
              <th className="px-4 py-2">Progress</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Risk</th>
              <th className="px-4 py-2">Last active</th>
            </tr>
          </thead>
          <tbody>
            {learners.map((l) => (
              <tr key={`${l.learnerId}-${l.courseTitle}`} className="border-t border-slate-50">
                <td className="px-4 py-2">
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
                <td className="px-4 py-2 text-xs text-black">
                  <span className="block">{l.programTitle}</span>
                  {l.programFundingType && (
                    <span className="text-[11px] text-slate-500">
                      {l.programFundingType}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-black">
                  {l.courseTitle}
                </td>
                <td className="px-4 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-black">
                      {l.progressPercent}%
                    </span>
                    <div className="h-1.5 w-20 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-white"
                        style={{
                          width: `${Math.min(
                            Math.max(l.progressPercent, 0),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-xs text-black">
                  {l.status}
                </td>
                <td className="px-4 py-2 text-xs">
                  <RiskBadge level={l.riskLevel} />
                </td>
                <td className="px-4 py-2 text-[11px] text-slate-500">
                  {l.lastAccessedAt
                    ? new Date(l.lastAccessedAt).toLocaleDateString(
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

function RiskBadge({
  level,
}: {
  level: "on_track" | "at_risk" | "inactive";
}) {
  if (level === "inactive") {
    return (
      <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">
        Inactive
      </span>
    );
  }
  if (level === "at_risk") {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
        At risk
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
      On track
    </span>
  );
}
