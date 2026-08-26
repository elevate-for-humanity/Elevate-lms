export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Site Map | ' + PLATFORM_DEFAULTS.orgName,
  description: 'Complete site map for ' + PLATFORM_DEFAULTS.orgName + ' workforce development platform.',
};

const navSections = [
  {
    title: 'Programs',
    links: [
      { name: 'All Programs', href: '/programs' },
      { name: 'Healthcare Programs', href: '/programs/healthcare' },
      { name: 'Skilled Trades', href: '/programs/skilled-trades' },
      { name: 'Technology', href: '/programs/technology' },
      { name: 'Apprenticeships', href: '/apprenticeships' },
      { name: 'Short Courses', href: '/store' },
    ],
  },
  {
    title: 'Funding',
    links: [
      { name: 'Funding Overview', href: '/funding' },
      { name: 'Check Eligibility', href: '/check-eligibility' },
      { name: 'WIOA / WorkOne', href: '/eligibility' },
      { name: 'Scholarships', href: '/scholarships' },
    ],
  },
  {
    title: 'Partners',
    links: [
      { name: 'For Employers', href: '/for-employers' },
      { name: 'For Agencies', href: '/for-agencies' },
      { name: 'For Providers', href: '/for-providers' },
      { name: 'Government', href: '/government' },
      { name: 'Host Shops', href: '/partners/host-shops' },
    ],
  },
  {
    title: 'About',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' },
    ],
  },
];

export default function SiteMapPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Site Map</h1>
        <p className="text-slate-600 mb-8">Navigate all pages on {PLATFORM_DEFAULTS.orgName}</p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {navSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-bold text-slate-900 mb-4">{section.title}</h2>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-brand-blue-700 hover:underline">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
