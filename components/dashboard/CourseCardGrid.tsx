// components/dashboard/CourseCardGrid.tsx
import Link from "next/link";
import Image from "next/image";

type Course = {
  id: string;
  title: string;
  short_description: string | null;
  thumbnail_url: string | null;
  estimated_hours: number | null;
  program_type: string | null;
  progress_percent: number;
  last_accessed_at: string | null;
};

type Props = {
  courses: Course[];
};

export function CourseCardGrid({ courses }: Props) {
  if (!courses.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        You&apos;re not enrolled in any courses yet. When you start a program,
        they will appear here.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  const progress = course.progress_percent ?? 0;
  const isComplete = progress >= 100;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Thumbnail */}
      <div className="relative h-32 w-full bg-slate-200">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
            Course image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-black">
            {course.title}
          </h3>
          {course.program_type && (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-orange-600">
              {course.program_type}
            </span>
          )}
        </div>

        {course.short_description && (
          <p className="line-clamp-2 text-xs text-black">
            {course.short_description}
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{isComplete ? "Completed" : "In progress"}</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-brand-blue-500 transition-all"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </div>

        {/* Meta + button */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {course.estimated_hours
              ? `${course.estimated_hours} hrs`
              : "Self-paced"}
          </span>
          {course.last_accessed_at && (
            <span>
              Last active{" "}
              {new Date(course.last_accessed_at).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="mt-3 flex justify-end">
          <Link
            href={`/student/courses/${course.id}`}
            className="rounded-full bg-brand-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-blue-700"
          >
            {isComplete ? "View certificate" : "Resume course"}
          </Link>
        </div>
      </div>
    </article>
  );
}
