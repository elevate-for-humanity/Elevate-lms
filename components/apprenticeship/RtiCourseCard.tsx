import Link from 'next/link';
import { BookOpen, Play } from 'lucide-react';
import type { RtiTrainingSummary } from '@/lib/apprenticeship/load-apprenticeship-dashboard';
import type { ApprenticePortalConfig } from '@/components/portal/ApprenticePortalShell';

type Props = {
  config: ApprenticePortalConfig;
  rti: RtiTrainingSummary | null;
};

export function RtiCourseCard({ config, rti }: Props) {
  if (!rti) return null;

  if (rti.publishedLessonCount === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-2 mb-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Your RTI course is being prepared. Check back soon or contact your program advisor.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-2 mb-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className={`w-4 h-4 ${config.accentText}`} />
              <h2 className="text-sm font-semibold text-slate-900">RTI course lessons</h2>
            </div>
            <p className="text-sm text-slate-600">{rti.courseTitle}</p>
            <p className="text-xs text-slate-500 mt-1">
              {rti.completedLessonCount} of {rti.publishedLessonCount} lessons complete
            </p>
            <div className="mt-3 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${config.accentBg} rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(rti.progressPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">{Math.round(rti.progressPercent)}% through RTI</p>
          </div>
          <Link
            href={`/lms/courses/${rti.courseId}`}
            className={`inline-flex items-center justify-center gap-2 ${config.accentBg} text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition shrink-0`}
          >
            <Play className="w-4 h-4" />
            {rti.completedLessonCount > 0 ? 'Continue training' : 'Start RTI lessons'}
          </Link>
        </div>
      </div>
    </div>
  );
}
