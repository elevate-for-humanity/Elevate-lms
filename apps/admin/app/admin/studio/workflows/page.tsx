'use client';

import nextDynamic from 'next/dynamic';

const WorkflowsClient = nextDynamic(() => import('./WorkflowsClient'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center bg-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
    </div>
  ),
});

export default function WorkflowsPage() {
  return <WorkflowsClient />;
}
