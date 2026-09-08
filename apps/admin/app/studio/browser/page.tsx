'use client';

import dynamic from 'next/dynamic';

const CloudBrowserWorkspace = dynamic(() => import('@/components/studio/CloudBrowserWorkspace'), {
  ssr: false,
  loading: () => <div className="flex min-h-[720px] items-center justify-center text-slate-400">Connecting cloud browser…</div>,
});

export default function StudioBrowserPage() {
  return <main className="h-full min-h-0 overflow-hidden"><CloudBrowserWorkspace /></main>;
}
