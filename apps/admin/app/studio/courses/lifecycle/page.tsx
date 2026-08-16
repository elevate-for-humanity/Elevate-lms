import Link from 'next/link';
import CourseLifecycleWorkspace from '@/components/admin/course-builder/CourseLifecycleWorkspace';

export const dynamic = 'force-dynamic';

export default function CourseLifecyclePage() {
  return (
    <>
      <div className="border-b border-slate-800 bg-slate-950 px-5 py-3 text-sm text-slate-300">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Link href="/studio/courses" className="font-bold text-cyan-400 hover:underline">← Back to Course Builder</Link>
          <span className="text-slate-600">/</span>
          <span>Lifecycle &amp; SCORM</span>
        </div>
      </div>
      <CourseLifecycleWorkspace />
    </>
  );
}
