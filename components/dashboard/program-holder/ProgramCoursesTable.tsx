// components/dashboard/program-holder/ProgramCoursesTable.tsx
type ProgramCourseSummary = {
  program: {
    id: string;
    title: string;
    funding_type: string | null;
    is_active: boolean;
  };
  courses: {
    id: string;
    title: string;
    estimated_hours: number | null;
    active_learners: number;
    completed_learners: number;
    avg_progress_percent: number;
  }[];
};

type Props = {
  summaries: ProgramCourseSummary[];
};

export function ProgramCoursesTable({ summaries }: Props) {
  if (!summaries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No programs found for this account yet. Once your programs are set up,
        you&apos;ll see enrollments and progress here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summaries.map((group) => (
        <div
          key={group.program.id}
          className="overflow-hidden rounded-2xl bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-black">
                {group.program.title}
              </h3>
              <p className="text-[11px] text-slate-500">
                {group.program.funding_type
                  ? `${group.program.funding_type} · `
                  : ""}
                {group.program.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          <div className="max-h-72 overflow-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Course</th>
                  <th className="px-4 py-2">Active</th>
                  <th className="px-4 py-2">Completed</th>
                  <th className="px-4 py-2">Avg. progress</th>
                  <th className="px-4 py-2">Est. hours</th>
                </tr>
              </thead>
              <tbody>
                {group.courses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-3 text-xs text-slate-500"
                    >
                      No courses created yet for this program.
                    </td>
                  </tr>
                ) : (
                  group.courses.map((course) => (
                    <tr key={course.id} className="border-t border-slate-50">
                      <td className="px-4 py-2 text-xs font-medium text-black">
                        {course.course_name}
                      </td>
                      <td className="px-4 py-2 text-xs text-black">
                        {course.active_learners}
                      </td>
                      <td className="px-4 py-2 text-xs text-black">
                        {course.completed_learners}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-black">
                            {course.avg_progress_percent}%
                          </span>
                          <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                            <div
                              className="h-1.5 rounded-full bg-brand-blue-500"
                              style={{
                                width: `${Math.min(
                                  Math.max(course.avg_progress_percent, 0),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs text-black">
                        {course.estimated_hours
                          ? `${course.estimated_hours} hrs`
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
