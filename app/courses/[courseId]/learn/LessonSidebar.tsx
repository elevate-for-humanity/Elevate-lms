"use client";

interface Lesson {
  id: string;
  title: string;
  order: number;
  duration?: number;
  completed: boolean;
}

interface LessonSidebarProps {
  lessons: Lesson[];
  currentLessonId: string;
  onLessonSelect: (lessonId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  progressPercentage: number;
}

export default function LessonSidebar({
  lessons,
  currentLessonId,
  onLessonSelect,
  isOpen,
  onToggle,
  progressPercentage,
}: LessonSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-80 bg-white border-r border-slate-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-black">Course Content</h2>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 hover:bg-white rounded-lg transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-black">Progress</span>
              <span className="font-semibold text-black">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-orange-600 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {lessons.map((lesson, index) => {
              const isActive = lesson.id === currentLessonId;
              const isCompleted = lesson.completed;

              return (
                <button
                  key={lesson.id}
                  onClick={() => onLessonSelect(lesson.id)}
                  className={`
                    w-full text-left p-3 rounded-lg mb-2 transition-all
                    ${
                      isActive
                        ? 'bg-brand-orange-50 border-2 border-brand-orange-500'
                        : 'hover:bg-white border-2 border-transparent'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Lesson Number / Status */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <div className="w-6 h-6 bg-brand-green-500 rounded-full flex items-center justify-center">
                          <span className="text-slate-400 flex-shrink-0">•</span>
                        </div>
                      ) : (
                        <div
                          className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                          ${
                            isActive
                              ? 'bg-brand-orange-600 text-white'
                              : 'bg-slate-200 text-black'
                          }
                        `}
                        >
                          {index + 1}
                        </div>
                      )}
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`
                        text-sm font-medium mb-1 line-clamp-2
                        ${isActive ? 'text-brand-orange-900' : 'text-black'}
                      `}
                      >
                        {lesson.title}
                      </h3>
                      {lesson.duration && (
                        <p className="text-xs text-slate-500">
                          {Math.floor(lesson.duration / 60)} min
                        </p>
                      )}
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-brand-orange-600 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="text-xs text-black text-center">
            {lessons.filter((l) => l.completed).length} of {lessons.length}{' '}
            lessons completed
          </div>
        </div>
      </div>
    </>
  );
}
