import {
  DEMO_CANDIDATES,
  DEMO_COURSES,
  DEMO_PROGRAM_ROWS,
  DEMO_STUDENTS,
} from '@/lib/store/demo-preview-data';

/** A compact, read-only view of the same public sample records used in the live demos. */
export default function StoreDemoPreview({
  role,
  compact = false,
}: {
  role: string;
  compact?: boolean;
}) {
  const title =
    role === 'employer'
      ? 'Candidate matches'
      : role === 'learner'
        ? 'My learning'
        : role === 'workforce'
          ? 'Program operations'
          : 'Learner overview';
  const rows =
    role === 'employer'
      ? DEMO_CANDIDATES.map((item) => ({
          title: item.name,
          detail: item.program,
          badge: item.skills.join(' · '),
          progress: undefined,
        }))
      : role === 'learner'
        ? DEMO_COURSES.map((item) => ({
            title: item.title,
            detail: 'Course progress',
            badge: `${item.progress}%`,
            progress: item.progress,
          }))
        : role === 'workforce'
          ? DEMO_PROGRAM_ROWS.map((item) => ({
              title: item[0],
              detail: item[1],
              badge: item[2],
              progress: undefined,
            }))
          : DEMO_STUDENTS.map((item) => ({
              title: item.name,
              detail: item.program,
              badge: `${item.progress}% · ${item.status}`,
              progress: item.progress,
            }));

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      aria-label={`${title} sample workspace preview`}
    >
      <div className="flex items-center justify-between gap-3 bg-slate-950 px-4 py-3 text-white">
        <p className="text-sm font-black text-white">{compact ? 'Demo' : 'Elevate workspace'}</p>
        <span className="rounded-full border border-white/30 px-2 py-1 text-xs font-bold text-white">
          Sample data
        </span>
      </div>
      <div className={compact ? 'p-3' : 'p-4 sm:p-6'}>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-blue-800">{title}</p>
        <div className="mt-3 space-y-3">
          {rows.map((row) => (
            <div key={row.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-950">{row.title}</p>
                  {!compact ? <p className="mt-1 text-xs text-slate-600">{row.detail}</p> : null}
                </div>
                {!compact ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-900">
                    {row.badge}
                  </span>
                ) : null}
              </div>
              {typeof row.progress === 'number' ? (
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
                  role="progressbar"
                  aria-label={`${row.title} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={row.progress}
                >
                  <div
                    className="h-full rounded-full bg-brand-blue-800"
                    style={{ width: `${row.progress}%` }}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
