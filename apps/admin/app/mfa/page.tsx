import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import { AdminMfaClient } from './AdminMfaClient';

function MfaFallback() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Preparing secure authentication…
        </div>
      </div>
    </main>
  );
}

export default function AdminMfaPage() {
  return (
    <Suspense fallback={<MfaFallback />}>
      <AdminMfaClient />
    </Suspense>
  );
}
