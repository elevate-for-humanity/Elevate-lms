export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { GraduationCap, DollarSign, Shield, Briefcase, ExternalLink, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Resources | Elevate for Humanity',
  description: 'Career resources, funding information, and partner links.',
};

const sections = [
  {
    title: 'Student Resources',
    icon: GraduationCap,
    links: [
      { label: 'Apply for Training', href: '/apply/student' },
      { label: 'Check Funding Eligibility', href: '/check-eligibility' },
      { label: 'View All Programs', href: '/programs' },
      { label: 'Career Services', href: '/career-services' },
      { label: 'Student FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Funding & Financial Aid',
    icon: DollarSign,
    links: [
      { label: 'WIOA Funding', href: '/funding/wioa' },
      { label: 'Workforce Ready Grant', href: '/funding/wioa' },
      { label: 'Job-Ready Incentive', href: '/funding/jri' },
      { label: 'DOL Registered Apprenticeship', href: '/funding/dol' },
      { label: 'Indiana Career Connect', href: 'https://www.indianacareerconnect.com', external: true },
    ],
  },
  {
    title: 'Employer Resources',
    icon: Briefcase,
    links: [
      { label: 'Employer Portal', href: '/employer/dashboard' },
      { label: 'Post a Job', href: '/employer/post-job' },
      { label: 'Apprenticeship Partnerships', href: '/partners/host-shops' },
      { label: 'WOTC Tax Credits Info', href: 'https://www.dol.gov/agencies/eta/wotc', external: true },
    ],
  },
  {
    title: 'Government Partners',
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
    title: 'Legal & Compliance',
    icon: Shield,
    links: [
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms of Service', href: '/legal' },
      { label: 'Accessibility Statement', href: '/accessibility' },
      { label: 'Disclosures', href: '/legal/disclosures' },
      { label: 'FERPA Policy', href: '/ferpa' },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Resources' }]} />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-black mb-4">Resources</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Career resources, funding information, and links to our partner organizations.
          </p>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.map((section) => (
              <div key={section.title} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold text-black">{section.title}</h2>
                </div>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link 
                        href={link.href}
                        className="flex items-center gap-2 text-slate-600 hover:text-brand-blue-600 transition-colors group"
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                      >
                        {link.label}
                        {link.external && <ExternalLink className="w-3 h-3 opacity-50" />}
                        <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Need More Help?</h2>
          <p className="text-slate-600 mb-6">
            Our team is here to help you find the right resources.
          </p>
          <Link href="/contact" className="inline-block bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
