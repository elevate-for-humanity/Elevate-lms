export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import { headerNavigation } from '@/lib/navigation/site-nav.config';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Sitemap',
  description: `Complete directory of all pages on ${PLATFORM_DEFAULTS.orgName}.`,
};

export default function SitemapPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold mb-4">Sitemap</h1>
        <p className="text-xl text-slate-600 mb-12">
          Complete directory of all pages on our website.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {headerNavigation.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 text-orange-600">{section.label}</h2>
              <ul className="space-y-2">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Link
                      href={item.href}
                      className="text-slate-700 hover:text-orange-600 hover:underline"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-slate-50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Additional Resources</h2>
          <ul className="grid md:grid-cols-2 gap-2">
            <li>
              <Link
                href="/legal/privacy"
                className="text-slate-700 hover:text-orange-600 hover:underline"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/legal"
                className="text-slate-700 hover:text-orange-600 hover:underline"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="/accessibility"
                className="text-slate-700 hover:text-orange-600 hover:underline"
              >
                Accessibility
              </Link>
            </li>
            <li>
              <Link
                href="/federal-compliance"
                className="text-slate-700 hover:text-orange-600 hover:underline"
              >
                Compliance
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
