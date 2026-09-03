import { requireRole } from '@/lib/auth/require-role';
import AITeamConsole from '@/components/platform/AITeamConsole';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'AI Team | Admin', robots: { index: false, follow: false } };

export default async function AdminAITeamPage() {
  await requireRole(['admin', 'staff', 'super_admin']);
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl"><AITeamConsole title="AI Operations Team" /></div>
    </main>
  );
}
