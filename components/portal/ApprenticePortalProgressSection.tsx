'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { ApprenticeProgressWidget } from '@/components/apprenticeship/ApprenticeProgressWidget';

interface Props {
  enrollmentId?: string | null;
  programName: string;
  accentBg: string;
  accentText: string;
  lmsCourseHref?: string | null;
}

export function ApprenticePortalProgressSection({
  enrollmentId,
  programName,
  accentBg,
  accentText,
  lmsCourseHref,
}: Props) {
  return (
    <div className="space-y-4">
      {lmsCourseHref ? (
        <Link
          href={lmsCourseHref}
          className={`flex items-center gap-3 p-4 rounded-xl ${accentBg} text-white hover:opacity-90 transition`}
        >
          <BookOpen className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-semibold">Continue online training (RTI)</p>
            <p className="text-sm text-white/85">Open your course lessons, videos, and checkpoints</p>
          </div>
        </Link>
      ) : null}

      {enrollmentId ? (
        <ApprenticeProgressWidget enrollmentId={enrollmentId} programName={programName} />
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your enrollment is still being set up. Refresh in a few minutes or contact support if this
          persists.
        </div>
      )}
    </div>
  );
}
