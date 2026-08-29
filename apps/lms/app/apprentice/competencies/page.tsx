import type { Metadata } from 'next';
import Link from 'next/link';
import AppendixAProgress from './AppendixAProgress.client';

export const metadata: Metadata = {
  title: 'Competency Progress | Apprentice Portal',
  description: 'Track approved apprenticeship competencies and related instruction requirements.',
};

export const dynamic = 'force-dynamic';

export default function ApprenticeCompetenciesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link href="/apprentice" className="text-sm font-medium text-brand-blue-700 hover:underline">
            ← Apprentice Dashboard
          </Link>
        </div>
        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-bold">Cosmetology competency standard pending configuration</p>
          <p className="mt-1">Only an approved program competency standard can be used for verified progress. Course activity will remain available, but it will not be mislabeled as a registered Appendix A standard.</p>
        </div>
        <AppendixAProgress />
      </div>
    </div>
  );
}
