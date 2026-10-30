export type CourseSyllabusRecord = { title?: string; body?: string; program_id?: string };

export default function CourseSyllabus({ syllabus }: { syllabus?: CourseSyllabusRecord | null }) {
  if (!syllabus?.title || !syllabus.body) return null;
  return (
    <details id="course-syllabus" className="rounded-2xl border border-blue-200 bg-white p-5 print:break-inside-avoid">
      <summary className="cursor-pointer text-lg font-black text-blue-950">{syllabus.title}</summary>
      <p tabIndex={0} role="region" aria-label="Syllabus text" className="mt-4 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-800">{syllabus.body}</p>
    </details>
  );
}
