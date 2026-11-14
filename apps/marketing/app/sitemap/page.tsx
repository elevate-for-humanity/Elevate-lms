import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES } from '@/lib/navigation/routes';
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
      <section className="border-b border-slate-200 bg-slate-50 px-4 py-8 text-slate-950">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-black sm:text-5xl">Sitemap</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-700">Find applications, business services, public pages and your dashboard. Dashboard tools require your own authorized account.</p>
        </div>
      </section>

      <nav aria-label="Applications, dashboards and businesses" className="mx-auto grid max-w-6xl gap-3 px-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['/apply', 'All application options'], ['/apply/student/form', 'Student application form'],
          [ROUTES.hostShopApply, 'Host Shop application'], ['/apply/employer', 'Employer application'], ['/apply/program-holder', 'Program Holder application'],
          [ROUTES.studentPortal, 'Learner dashboard'], [ROUTES.hostShopPortal, 'Host Shop dashboard'], [ROUTES.programHolderPortal, 'Program Holder dashboard'], [ROUTES.employerPortal, 'Employer dashboard'], [ROUTES.adminPortal, 'Admin dashboard'],
          ['/store', 'Elevate store'], [ROUTES.supersonicFastCash, 'Supersonic Fast Cash'], [ROUTES.curvatureBodySculpting, 'Curvature Body Sculpting / Meri-Gold-Round'],
        ].map(([href, label]) => <Link key={href} href={href} target={href.startsWith('https://') ? '_blank' : undefined} rel={href.startsWith('https://') ? 'noopener noreferrer' : undefined} className="flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-blue-800 hover:bg-blue-50">{label}{href.startsWith('https://') ? ' (new tab)' : ''}</Link>)}
      </nav>
      <section className="mx-auto max-w-6xl px-4 py-8">
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
