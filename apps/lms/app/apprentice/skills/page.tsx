import type { Metadata } from 'next';
import ApprenticeCompetenciesPage from '../competencies/page';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Skills Checklist | Apprentice Portal',
  robots: { index: false, follow: false },
};

// Use enrollment-scoped verified competencies. The historical generic skills
// tables have no apprentice/skill identity columns in the deployed schema.
export default ApprenticeCompetenciesPage;
