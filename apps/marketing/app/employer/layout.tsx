import type { Metadata } from 'next';

// Employer dashboards are owned by the LMS application, not Marketing.
// All routes under this legacy Marketing segment redirect to the canonical
// LMS host in their page handlers; do not invoke Marketing-session auth here.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Employer Portal',
  description: 'Employer dashboard, hiring, and apprenticeship management.',
};

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
