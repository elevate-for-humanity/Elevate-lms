import type { Metadata } from 'next';
import CompetencyManager from './CompetencyManager.client';

export const metadata: Metadata = {
  title: 'Appendix A Competency Sign-Offs | Host Shop',
  description: 'Verify DOL Registered Apprenticeship Appendix A competencies for assigned apprentices.',
};

export const dynamic = 'force-dynamic';

export default function HostShopCompetenciesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <CompetencyManager />
      </div>
    </div>
  );
}
