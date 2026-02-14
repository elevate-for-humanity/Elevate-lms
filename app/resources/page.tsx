import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FileText, ExternalLink, GraduationCap, DollarSign, Briefcase, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Resources | Elevate for Humanity',
  description: 'Workforce training resources, funding guides, career tools, and external links for students, employers, and partners.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/resources' },
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
      { label: 'Job-Ready Incentive (JRI)', href: '/funding/jri', external: false },
      { label: 'DOL Apprenticeship', href: '/funding/dol', external: false },
      { label: 'Indiana Career Connect', href: 'https://www.indianacareerconnect.com', external: true },
    ],
  },
  {
    title: 'For Employers',
    icon: Briefcase,
    links: [
      { label: 'Employer Portal', href: '/employer', external: false },
      { label: 'Post a Job', href: '/employer/post-job', external: false },
      { label: 'Apprenticeship Partnerships', href: '/employer', external: false },
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
      { label: 'Privacy Policy', href: '/privacy-policy', external: false },
      { label: 'Terms of Service', href: '/terms-of-service', external: false },
      { label: 'Accessibility', href: '/accessibility', external: false },
      { label: 'Disclosures', href: '/disclosures', external: false },
      { label: 'Governance', href: '/governance', external: false },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Resources' }]} />
        </div>
      </div>

      <section className="bg-slate-900 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">Resources</h1>
          <p className="text-lg text-slate-300 max-w-2xl">Guides, tools, and links for students, employers, and partners.</p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title}>
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-5 h-5 text-brand-blue-600" />
                    <h2 className="font-bold text-slate-900 text-lg">{section.title}</h2>
                  </div>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        {link.external ? (
                          <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 hover:underline text-sm flex items-center gap-1">
                            {link.label} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <Link href={link.href} className="text-brand-blue-600 hover:underline text-sm">{link.label}</Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Need Help?</h2>
          <p className="text-slate-600 mb-6">Can&apos;t find what you&apos;re looking for? Contact our team.</p>
          <Link href="/contact" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-full font-bold transition">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}
