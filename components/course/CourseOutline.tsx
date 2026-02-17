import type { Course, Lesson } from "@/lms-data/courses";
import clsx from "clsx";

interface Props {
  course: Course;
  activeLessonId?: string;
  onSelectLesson?: (lesson: Lesson) => void;
}

export function CourseOutline({ course, activeLessonId, onSelectLesson }: Props) {
  return (
    <aside className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 text-[11px] text-slate-100">
      <p className="text-[11px] font-semibold text-slate-100">
        Course Outline
      </p>
      <p className="mt-1 text-[10px] text-slate-400">
        Click a lesson to play the video or open the content.
      </p>

      <div className="mt-3 space-y-2">
        {course.modules.map((module) => (
          <div key={module.id} className="rounded-lg bg-slate-950/80 p-2">
            <p className="text-[11px] font-semibold text-slate-100">
              {module.title}
            </p>
            {module.summary && (
              <p className="mt-0.5 text-[10px] text-slate-400">
                {module.summary}
              </p>
            )}
            <div className="mt-2 space-y-1">
              {module.lessons.map((lesson) => {
                const isActive = lesson.id === activeLessonId;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => onSelectLesson?.(lesson)}
                    className={clsx(
                      "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-[11px]",
                      isActive
                        ? "bg-brand-red-700/70 text-white"
                        : "bg-slate-900/80 text-slate-100 hover:bg-slate-900"
                    )}
                  >
                    <span className="flex-1">{lesson.title}</span>
                    {lesson.durationMinutes && (
                      <span className="ml-2 text-[10px] text-slate-300">
                        {lesson.durationMinutes} min
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
