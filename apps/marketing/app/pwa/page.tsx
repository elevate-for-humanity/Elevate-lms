import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Elevate App',
  robots: { index: false, follow: false },
};

export const revalidate = 300;

const ADMIN = 'https://admin.elevateforhumanity.org';
const LMS = 'https://app.elevateforhumanity.org';
const installGroups = [
  { title: 'Studio and administration', apps: [
    ['Dev Studio with PARIS', ADMIN + '/install/dev-studio.html'],
    ['Course Builder', ADMIN + '/install/course-builder.html'],
    ['PARIS assistant', ADMIN + '/paris'],
    ['Admin dashboard', ADMIN + '/install'],
  ] },
  { title: 'Training and operations', apps: [
    ['Elevate LMS', LMS + '/install'], ['Student / Learner', LMS + '/install/learner'],
    ['Apprentice', LMS + '/install/apprentice'], ['Employer', LMS + '/install/employer'],
    ['Program Holder', LMS + '/install/program-holder'], ['Host Shop', LMS + '/install/host-shop'],
    ['Elevate Phone', LMS + '/communications/phone'],
  ] },
  { title: 'Public networks and services', apps: [
    ['Barber & Beauty Network', '/barber-beauty-network'], ['Business Network', '/business-network'],
    ['Elevate Community', '/community'], ['Supersonic Fast Cash', '/tax'],
  ] },
];

export default function MarketingPwaPage() {
  return (
    <main className="min-h-[70vh] bg-white px-5 py-10 text-slate-950" data-pwa-launcher="marketing">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Elevate app</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Choose where you want to go.</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          This installed app is a direct launcher. Public website visits stay in the browser so search results open immediately instead of being captured by the PWA.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-lg font-black">Public website</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Programs, funding, apprenticeships, employers, and public information.</p>
          </Link>
          <a href="https://app.elevateforhumanity.org" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-lg font-black">Learner portal</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Courses, progress, apprenticeship access, and learner records.</p>
          </a>
          <a href="https://admin.elevateforhumanity.org" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-lg font-black">Admin portal</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Admin AI, Studio, Course Builder, operations, and management tools.</p>
          </a>
        </div>
        <section className="mt-10" aria-labelledby="app-install-links">
          <h2 id="app-install-links" className="text-2xl font-black">Install an Elevate app</h2>
          <p className="mt-2 max-w-2xl text-slate-700">Open the app you want. On Android, use Chrome’s install option. For protected apps, sign in first and check the app name in the install prompt.</p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {installGroups.map(({ title, apps }) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-5">
                <h3 className="text-lg font-bold">{title}</h3>
                <ul className="mt-2">{apps.map(([name, href]) => (
                  <li key={name}><a className="inline-flex min-h-11 items-center font-semibold text-blue-800 underline" href={href}>{name}</a></li>
                ))}</ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
