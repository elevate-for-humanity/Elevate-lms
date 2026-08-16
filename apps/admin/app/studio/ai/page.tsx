import type { Metadata } from 'next';
import UnifiedEllieChat from '@/components/studio/UnifiedEllieChat';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function StudioAiPage() {
  return (
    <main className="h-screen min-h-[720px] p-3 lg:p-5">
      <div className="h-full overflow-hidden rounded-xl border border-slate-800">
        <UnifiedEllieChat />
      </div>
    </main>
  );
}
