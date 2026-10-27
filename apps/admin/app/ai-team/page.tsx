import ParisSupervisionPanel from '@/components/admin/ParisSupervisionPanel';
import { requireRole } from '@/lib/auth/require-role';
import UnifiedEllieChat from '@/components/studio/UnifiedEllieChat';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'PARIS | Admin', robots: { index: false, follow: false } };

export default async function AdminAITeamPage() {
  await requireRole(['admin', 'super_admin']);
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl"><ParisSupervisionPanel /><div className="h-[75dvh] overflow-hidden rounded-2xl"><UnifiedEllieChat restoreLatest /></div></div>
    </main>
  );
}
