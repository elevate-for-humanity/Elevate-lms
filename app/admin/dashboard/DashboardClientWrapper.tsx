'use client';

import dynamic from 'next/dynamic';

// Recharts accesses browser APIs at module level — must not run on the server.
const DashboardClient = dynamic(() => import('./DashboardClient'), {
  ssr: false,
  loading: () => (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-8 bg-slate-100 rounded w-1/3" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}
      </div>
      <div className="h-64 bg-slate-100 rounded-xl" />
    </div>
  ),
});

export function DashboardClientWrapper({ data }: { data: any }) {
  return <DashboardClient data={data} />;
}
