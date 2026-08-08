import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen overflow-hidden bg-slate-900 text-white">{children}</div>;
}
