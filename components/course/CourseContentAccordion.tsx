import Link from "next/link";

type Lesson = {
  id: string;
  title: string;
  duration_minutes?: number | null;
  order_index?: number | null;
  completed?: boolean;
};

type Module = {
  id: string;
  title: string;
  order_index?: number | null;
  lessons: Lesson[];
};

type CourseContentAccordionProps = {
  courseSlug: string;
  modules: Module[];
};

export function CourseContentAccordion({
  courseSlug,
  modules,
}: CourseContentAccordionProps) {
  if (!modules.length) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-black">
        Course outline Available Now.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Course content</h2>
      <p className="mt-1 text-xs text-slate-500">
        {modules.length} modules •{" "}
        {modules.reduce((total, m) => total + (m.lessons?.length || 0), 0)}{" "}
        lessons
      </p>

      <div className="mt-3 divide-y">
        {modules
          .slice()
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          .map((module) => (
            <details
              key={module.id}
              className="group py-2"
              open={module.order_index === 0 || module.order_index === 1}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-2 text-xs font-semibold text-black">
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-black">
                    Module {module.order_index ?? ""}
                  </span>
                  <span>{module.title}</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {module.lessons.length} lessons
                </span>
              </summary>

              <ul className="mt-2 space-y-1 text-xs">
                {module.lessons
                  .slice()
                  .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                  .map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-slate-300" />
                        <Link
                          href={`/lms/courses/${courseSlug}/lessons/${lesson.id}`}
                          className="text-xs text-black hover:text-brand-blue-600 hover:underline"
                        >
                          {lesson.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        {lesson.duration_minutes && (
                          <span>{lesson.duration_minutes} min</span>
                        )}
                        {lesson.completed && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-semibold text-red-700">
                            Done
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            </details>
          ))}
      </div>
    </div>
  );
}
