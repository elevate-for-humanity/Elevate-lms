'use client';

import { useEffect, useState } from 'react';
import ExamReadinessPanel from './ExamReadinessPanel';
import type { DomainStatus } from './ExamReadinessPanel';

// API returns snake_case — map to panel props
interface ApiResponse {
  applicable: boolean;
  is_ready: boolean;
  avg_score: number | null;
  min_score: number | null;
  checkpoints_passed: number;
  checkpoints_total: number;
  lessons_completed: number;
  lessons_total: number;
  failure_reasons: string[];
  domains: DomainStatus[];
  authorization_expires_at: string | null;
}

export default function ExamReadinessWidget({
  courseId,
  programTitle,
}: {
  courseId: string;
  programTitle: string;
}) {
  const [data, setData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    fetch(`/api/lms/courses/${courseId}/exam-readiness`)
      .then(r => r.json())
      .then(setData)
      .catch(() => null);
  }, [courseId]);

  if (!data || !data.applicable) return null;

  return (
    <ExamReadinessPanel
      isReady={data.is_ready}
      avgScore={data.avg_score}
      minScore={data.min_score}
      checkpointsPassed={data.checkpoints_passed}
      checkpointsTotal={data.checkpoints_total}
      lessonsCompleted={data.lessons_completed}
      lessonsTotal={data.lessons_total}
      domains={data.domains}
      failureReasons={data.failure_reasons}
      programTitle={programTitle}
      authorizationExpiresAt={data.authorization_expires_at}
    />
  );
}
