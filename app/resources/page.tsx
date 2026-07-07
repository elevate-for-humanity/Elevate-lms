export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Resources | Elevate for Humanity',
  description: 'Resources page content.',
};

const sections = [
  {
    title: 'For Students',
    icon: GraduationCap,
    links: [
      { label: 'Apply for Training', href: '/apply/student', external: false },
      { label: 'Check Funding Eligibility', href: '/check-eligibility', external: false },
      { label: 'View All Programs', href: '/programs', external: false },
      { label: 'Career Services', href: '/career-services', external: false },
      { label: 'FAQ', href: '/faq', external: false },
    ],
  },
  {
    title: 'Funding & Financial Aid',
    icon: DollarSign,
    links: [
      { label: 'WIOA Funding', href: '/funding', external: false },
      { label: 'Workforce Ready Grant (WRG)', href: '/funding', external: false },
      { label: 'Job-Ready Incentive (Job Ready Indy)', href: '/funding/jri', external: false },
      { label: 'DOL Apprenticeship', href: '/funding/dol', external: false },
      {
        label: 'Indiana Career Connect',
        href: 'https://www.indianacareerconnect.com',
        external: true,
      },
    ],
  },
  {
    title: 'For Employers',
    icon: Briefcase,
    links: [
      { label: 'Employer Portal', href: '/employer/dashboard', external: false },
      { label: 'Post a Job', href: '/employer/dashboard', external: false },
      { label: 'Apprenticeship Partnerships', href: '/employer/dashboard', external: false },
      { label: 'WOTC Tax Credits', href: 'https://www.dol.gov/agencies/eta/wotc', external: true },
    ],
  },
  {
    title: 'External Resources',
    icon: ExternalLink,
    links: [
      { label: 'WorkOne Indiana', href: 'https://www.workoneindy.com', external: true },
      { label: 'Indiana DWD', href: 'https://www.in.gov/dwd', external: true },
      { label: 'Next Level Jobs', href: 'https://nextleveljobs.org', external: true },
      { label: 'OSHA Training', href: 'https://www.osha.gov', external: true },
      { label: 'U.S. DOL Apprenticeship', href: 'https://www.apprenticeship.gov', external: true },
    ],
  },
  {
    title: 'Policies & Compliance',
    icon: Shield,
    links: [
      { label: 'Privacy Policy', href: '/legal/privacy', external: false },
      { label: 'Terms of Service', href: '/legal', external: false },
      { label: 'Accessibility', href: '/accessibility', external: false },
      { label: 'Disclosures', href: '/legal/disclosures', external: false },
      { label: 'Governance', href: '/governance', external: false },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Resources</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}
