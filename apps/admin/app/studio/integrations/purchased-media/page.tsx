import { Suspense } from 'react';
import { requireRole } from '@/lib/auth/require-role';
import PurchasedMediaPlugin from '@/components/studio/plugins/PurchasedMediaPlugin';

export const dynamic = 'force-dynamic';

function PurchasedMediaLoading() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
        Loading Purchased Media…
      </div>
    </main>
  );
}

export default async function PurchasedMediaPluginPage() {
  await requireRole(['admin']);
  return (
    <Suspense fallback={<PurchasedMediaLoading />}>
      <PurchasedMediaPlugin />
    </Suspense>
  );
}
