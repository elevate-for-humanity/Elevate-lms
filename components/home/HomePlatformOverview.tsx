import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    title: 'Train & Learn',
    body: 'Courses, assignments, progress tracking, credentials, and learner dashboards in one connected learning environment.',
    image: '/images/pages/comp-pathway-classroom.webp',
    href: '/programs',
  },
  {
    title: 'Run Apprenticeships',
    body: 'Apprentice, host-site, OJL, RTI, document, competency, and progress workflows built around real program operations.',
    image: '/images/pages/apprenticeship-sponsor-page-1.webp',
    href: '/apprenticeships',
  },
  {
    title: 'Verify Geofenced Attendance',
    body: 'Authenticated apprentice timeclock actions are checked against the assigned host-site GPS radius. Accepted clock-in and clock-out events retain location evidence; out-of-radius actions are blocked and recorded as compliance events.',
    image: '/images/pages/for-employers-page-1.webp',
    href: '/apprenticeships',
  },
  {
    title: 'Manage Workforce Operations',
    body: 'Applications, participants, employers, funding workflows, compliance records, and administrative tools across one platform.',
    image: '/images/pages/workforce-training.webp',
    href: '/platform',
  },
] as const;

export function HomePlatformOverview() {
  return (
    <section className="bg-white px-4 py-14 sm:py-18" aria-labelledby="platform-overview-heading">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">One connected platform</p>
            <h2 id="platform-overview-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              From first application to training, apprenticeship, credentials, and workforce operations.
            </h2>
          </div>
          <p className="text-base font-medium leading-7 text-slate-700 sm:text-lg sm:leading-8">
            Elevate brings the public website, learning experience, employer and apprenticeship workflows, administrative operations, and participant progress into one system instead of sending people through disconnected tools.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Link key={feature.title} href={feature.href} className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <Image src={feature.image} alt={feature.title} fill className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" aria-hidden="true" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-black text-slate-950">{feature.title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-700 sm:text-base">{feature.body}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-brand-red-700">Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
