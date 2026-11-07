'use client';

import nextDynamic from 'next/dynamic';

const EvaluationStudioPanel = nextDynamic(() => import('@/components/studio/EvaluationStudioPanel'), {
  ssr: false,
  loading: () => <div className="flex min-h-[50vh] items-center justify-center bg-white text-slate-700">Loading Evaluation Studio…</div>,
});

export default function StudioEvaluationsPage() {
  return <EvaluationStudioPanel />;
}
