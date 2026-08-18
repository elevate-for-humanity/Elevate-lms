import type { Metadata } from 'next';
import Link from 'next/link';
import { publicRouteGroups } from '@/lib/navigation/public-route-registry';

export const metadata: Metadata = {
  title: 'Sitemap | Elevate for Humanity',
  description: 'Browse the public programs, funding, apprenticeships, testing, store, employer, and institutional pages on Elevate for Humanity.',
  alternates: { canonical: '/sitemap' },
};

export default function SitemapPage() {
  const groups = Array.from(publicRouteGroups().entries());

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-blue-900 to-blue-800 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-black sm:text-5xl">Sitemap</h1>
          <p className="mt-3 max-w-2xl text-lg text-blue-100">Canonical public pages available for visitors and search engines.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {groups.map(([category, routes]) => (
            <section key={category} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">{category}</h2>
              <ul className="mt-4 space-y-2">
                {routes.map((route) => (
                  <li key={route.path}>
                    <Link href={route.path} className="font-semibold text-blue-700 hover:underline">
                      {route.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
