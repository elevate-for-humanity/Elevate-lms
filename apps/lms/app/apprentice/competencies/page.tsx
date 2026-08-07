import type { Metadata } from 'next';
import Link from 'next/link';
import AppendixAProgress from './AppendixAProgress.client';

export const metadata: Metadata = {
  title: 'Appendix A Competency Progress | Apprentice Portal',
  description: 'Track verified U.S. DOL Registered Apprenticeship Appendix A competencies and related instruction requirements.',
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
        <AppendixAProgress />
      </div>
    </div>
  );
}
