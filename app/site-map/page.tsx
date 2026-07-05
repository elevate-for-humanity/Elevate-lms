import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Site Map | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Complete site map of Elevate for Humanity - find all pages and resources.',
};

const siteSections = [
  {
    title: 'Programs',
    links: [
      { label: 'All Programs', href: '/programs' },
      { label: 'Healthcare', href: '/programs?category=healthcare' },
      { label: 'Skilled Trades', href: '/programs?category=skilled-trades' },
      { label: 'Transportation', href: '/programs?category=transportation' },
      { label: 'Technology', href: '/programs?category=technology' },
      { label: 'CNA', href: '/programs/cna' },
      { label: 'HVAC Technician', href: '/programs/hvac-technician' },
      { label: 'CDL Training', href: '/programs/cdl-training' },
    ],
  },
  {
    title: 'Apprenticeships',
    links: [
      { label: 'All Apprenticeships', href: '/apprenticeships' },
      { label: 'Barber Apprenticeship', href: '/apprenticeships/barber' },
      { label: 'Cosmetology', href: '/apprenticeships/cosmetology' },
      { label: 'Culinary Arts', href: '/apprenticeships/culinary' },
      { label: 'Host Shops', href: '/host-shop' },
    ],
  },
  {
    title: 'Funding',
    links: [
      { label: 'Funding & Grants', href: '/funding' },
      { label: 'Check Eligibility', href: '/check-eligibility' },
      { label: 'WIOA Information', href: '/funding#wioa' },
      { label: 'Workforce Ready Grant', href: '/funding#workforce-ready' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Press', href: '/press' },
      { label: 'Contact', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Student Tools',
    links: [
      { label: 'Apply', href: '/apply' },
      { label: 'Student Portal', href: '/lms' },
      { label: 'Testing Center', href: '/testing' },
      { label: 'Credentials', href: '/credentials' },
    ],
  },
  {
    title: 'Employers & Partners',
    links: [
      { label: 'Partner Portal', href: '/partner' },
      { label: 'Hire Graduates', href: '/hire-graduates' },
      { label: 'Become a Host Shop', href: '/host-shop' },
      { label: 'WorkOne Partners', href: '/workone-partner-packet' },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Site Map</h1>
          <p className="text-xl text-slate-300">Find all pages on {PLATFORM_DEFAULTS.orgName}</p>
        </div>
      </section>
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {siteSections.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                  {section.title}
                </h2>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-slate-600 hover:text-brand-red-600 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
