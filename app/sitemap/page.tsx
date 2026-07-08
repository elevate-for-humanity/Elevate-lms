import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sitemap | Elevate',
  description: 'Navigate all pages on Elevate for Humanity.',
};

const pages = {
  'Programs': ['/programs', '/apprenticeships', '/funding', '/career-services'],
  'Support': ['/contact', '/help', '/student-resources'],
  'About': ['/about', '/team', '/blog'],
  'Legal': ['/privacy-policy', '/terms', '/accessibility'],
};

export default function SitemapPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="py-20 px-4 bg-gradient-to-br from-blue-900 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Sitemap</h1>
          <p className="text-xl text-blue-100">Find what you need.</p>
        </div>
      </section>
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.entries(pages).map(([cat, links]) => (
            <div key={cat}>
              <h3 className="text-xl font-bold text-blue-900 mb-4">{cat}</h3>
              <ul className="space-y-2">
                {links.map((href) => (
                  <li key={href}>
                    <Link href={href} className="text-blue-600 hover:underline">{href}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
