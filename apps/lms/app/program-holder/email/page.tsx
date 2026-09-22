import type { Metadata } from 'next';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Program Email',
  robots: { index: false, follow: false },
};

export default async function ProgramHolderEmailPage() {
  await requireProgramHolder();
  return (
    <main className="space-y-5 bg-slate-50 p-4 sm:p-6">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-blue-700">
          Program Holder Communications
        </p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Program Email</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Use your program’s Elevate address for official communication.
        </p>
      </div>
      <EmailWorkspace />
    </main>
  );
}
