'use client';

import nextDynamic from 'next/dynamic';

const WorkflowsClient = nextDynamic(
  () => import('../../../admin/studio/workflows/WorkflowsClient'),
  {
    ssr: false,
    loading: () => <div className="flex min-h-[50vh] items-center justify-center bg-white text-slate-600">Loading workflow builder…</div>,
  },
);

export default function NewWorkflowPage() {
  return <WorkflowsClient />;
}
