export const dynamic = 'force-static';


import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Demos | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Demos page.`,
  robots: { index: false, follow: false },
};

const demos = [
  {
    id: 'admin',
    title: 'Admin Dashboard',
    icon: Shield,
    image: '/images/pages/career-counseling.jpg',
    alt: 'Training program administrator reviewing enrollment data',
    href: '/store/demo/admin',
    description: 'This is what your staff sees every day. Watch how enrollment tracking, compliance reporting, and application management work inside the admin portal.',
    highlights: ['Enrollment and completion tracking', 'Compliance reporting for workforce boards', 'Application and intake pipeline management', 'WIOA documentation and audit tools'],
  },
  {
    id: 'employer',
    title: 'Employer Portal',
    icon: Briefcase,
    image: '/images/pages/employer-handshake.webp',
    alt: 'Employer reviewing candidate profiles from training programs',
    href: '/store/demo/employer',
    description: 'See what your employer partners see - how they track apprentices, view hiring incentives, and manage OJT contracts inside their portal.',
    highlights: ['Apprenticeship hour and wage progression tracking', 'OJT contract and incentive management', 'MOU and compliance document signing', 'WOTC credit visibility'],
  },
  {
    id: 'learner',
    title: 'Student Experience',
    icon: GraduationCap,
    image: '/images/pages/wioa-meeting.webp',
    alt: 'Students in a training classroom working on coursework',
    href: '/store/demo/student',
    description: 'What your students see when they log in. Their courses, progress bars, apprenticeship hours logged, and certificates earned. This is the experience that keeps them showing up.',
    highlights: ['Course modules with progress tracking', 'Log apprenticeship hours from their phone', 'View earned certificates and credentials', 'Access career services and job placement tools'],
  },
  {
    id: 'workforce',
    title: 'Workforce Board View',
    icon: BarChart3,
    image: '/images/pages/wioa-meeting.webp',
    alt: 'Workforce board staff reviewing program outcomes and funding data',
    href: '/store/demo/admin',
    description: 'Built for workforce boards and state agencies. WIOA eligibility, ITA tracking, PIRL reporting, and partner network management. The same admin dashboard, filtered for what matters to you.',
    highlights: ['WIOA eligibility screening with document verification', 'Track WIOA, state, employer, and grant funding together', 'Automated PIRL reporting and quarterly performance', 'Manage your network of training providers and employers'],
  },
];

export default function StoreDemosPage() {

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Demos</h1>
        </div>
      </section>
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-600">This page is under development.</p>
        </div>
      </section>
    </div>
  );
}
