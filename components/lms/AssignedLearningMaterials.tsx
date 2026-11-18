import Link from 'next/link';

export type LearningMaterial = { id: string; title: string; href: string };

/** Links are supplied by the account-scoped workspace loader. */
export default function AssignedLearningMaterials({ courses = [], workbooks = [], error }: {
  courses?: LearningMaterial[];
  error?: string;
  workbooks?: LearningMaterial[];
}) {
  if (!courses.length && !workbooks.length && !error) return null;
  return (
    <section aria-label="Your course and workbook" className="rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-7">
      <h2 className="text-2xl font-black text-slate-950">Your course and workbook</h2>
      <p className="mt-2 text-slate-700">Open your learning materials here. Use the course for lessons and the workbook for interactive practice.</p>
      {error ? <div role="alert" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
        <p>{error}</p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link href="/lms/courses" className="min-h-11 font-bold underline">My Courses</Link>
          <Link href="/workbooks" className="min-h-11 font-bold underline">Workbooks</Link>
        </div>
      </div> : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {courses.map(course => (
          <article key={course.id} className="rounded-xl border bg-white p-5">
            <h3 className="text-lg font-bold text-slate-950">{course.title}</h3>
            <Link href={course.href} className="mt-4 inline-flex min-h-12 items-center rounded-lg bg-blue-800 px-4 py-3 font-bold text-white">Open course</Link>
          </article>
        ))}
        {workbooks.map(workbook => (
          <article key={workbook.id} className="rounded-xl border bg-white p-5">
            <h3 className="text-lg font-bold text-slate-950">{workbook.title}</h3>
            <Link href={workbook.href} className="mt-4 inline-flex min-h-12 items-center rounded-lg bg-blue-800 px-4 py-3 font-bold text-white">Open interactive workbook</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
