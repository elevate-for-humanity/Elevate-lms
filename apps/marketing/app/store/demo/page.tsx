import Link from 'next/link';
import Image from 'next/image';
import StoreDemoPreview from '@/components/store/StoreDemoPreview';
import { ArrowRight, Play, Shield, Briefcase, GraduationCap, BarChart3 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import DemoTabs from '../demos/DemoTabs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Interactive Platform Demos | Elevate Store',
  description:
    'Explore guided, sample-data demos of the Elevate admin, employer, learner, and workforce platform experiences.',
  alternates: { canonical: 'https://store.elevateforhumanity.org/store/demo' },
  robots: { index: true, follow: true },
};

const demoLinks = [
  {
    title: 'Admin Dashboard',
    href: '/store/demo/admin',
    icon: Shield,
    description: 'Explore sample enrollment, course, and compliance views.',
  },
  {
    title: 'Employer Portal',
    href: '/store/demo/employer',
    icon: Briefcase,
    description: 'Explore sample jobs, candidates, and employer workflows.',
  },
  {
    title: 'Student Portal',
    href: '/store/demo/student',
    icon: GraduationCap,
    description: 'Explore sample courses, progress, and lesson navigation.',
  },
  {
    title: 'Workforce View',
    href: '/store/demo/institutional',
    icon: BarChart3,
    description: 'Explore the sample reporting and compliance perspective.',
  },
];

export default function StoreDemosPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Demos' }]} />
      </div>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-8 sm:py-10">
        <div className="mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-700">
              Explore before you choose
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              See your next workspace in action.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-700">
              Follow a learner, manage a program, or explore hiring. Choose a sample workspace and
              try the controls before starting your own.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="#interactive-demos"
                className="inline-flex min-h-11 items-center rounded-xl bg-brand-red-700 px-5 py-3 text-sm font-bold text-white"
              >
                Choose a demo
              </Link>
              <Link
                href="/store/plans"
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-950"
              >
                Compare plans
              </Link>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-600">
              Clearly labeled sample data. Demo actions do not change real records.
            </p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
            <Image
              src="/images/business-training-vibrant-2026.webp"
              alt="Illustrative business team exploring a workspace together"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-contain"
            />
          </div>
        </div>
      </section>

      <section id="interactive-demos" className="px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <DemoTabs />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-black text-slate-950">
            Interactive sample portals
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">
            Use the sample controls to understand the workflow. Actions that would normally change
            real data are simulated in demo mode.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {demoLinks.map(({ title, href, description }) => (
              <Link
                key={title}
                href={href}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-lg"
              >
                <StoreDemoPreview
                  compact
                  role={
                    href.endsWith('student')
                      ? 'learner'
                      : href.endsWith('institutional')
                        ? 'workforce'
                        : href.split('/').at(-1)!
                  }
                />
                <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                <span className="mt-auto inline-flex min-h-11 items-center pt-3 gap-1 text-sm font-bold text-brand-red-700">
                  Open demo <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:grid-cols-2 sm:items-center">
          <div className="relative aspect-[16/10] bg-slate-100">
            <Image
              src="/images/bookkeeping-training-vibrant-2026.webp"
              alt="Illustrative learner and mentor working on business records"
              fill
              sizes="(max-width: 640px) 100vw, 560px"
              className="object-contain"
            />
          </div>
          <div className="p-5 sm:p-7">
            <h2 className="text-2xl font-black text-slate-950">Ready for your own workspace?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Start a 14-day organization trial. No card is required for the trial.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/store/trial"
                className="inline-flex min-h-11 items-center rounded-xl bg-brand-red-700 px-5 py-3 text-sm font-bold text-white"
              >
                Start Trial
              </Link>
              <Link
                href="/store/plans"
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-950"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
