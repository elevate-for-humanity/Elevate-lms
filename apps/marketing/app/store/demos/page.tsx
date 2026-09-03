import Link from 'next/link';
import { ArrowRight, Play, Shield, Briefcase, GraduationCap, BarChart3 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import DemoTabs from './DemoTabs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Interactive Platform Demos | Elevate Store',
  description: 'Explore guided, sample-data demos of the Elevate admin, employer, learner, and workforce platform experiences.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/demos' },
};

const demoLinks = [
  { title: 'Admin Dashboard', href: '/store/demo/admin', icon: Shield, description: 'Explore sample enrollment, course, and compliance views.' },
  { title: 'Employer Portal', href: '/store/demo/employer', icon: Briefcase, description: 'Explore sample jobs, candidates, and employer workflows.' },
  { title: 'Student Portal', href: '/store/demo/student', icon: GraduationCap, description: 'Explore sample courses, progress, and lesson navigation.' },
  { title: 'Workforce View', href: '/store/demo/institutional', icon: BarChart3, description: 'Explore the sample reporting and compliance perspective.' },
];

export default function StoreDemosPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Demos' }]} />
      </div>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-red-100 px-4 py-2 text-sm font-bold text-brand-red-700"><Play className="h-4 w-4" />Sample-data demos</span>
          <h1 className="mt-4 text-4xl font-black text-slate-950">See how the platform works</h1>
          <p className="mt-4 text-lg text-slate-600">Guided interactive sample workspaces. Demo actions never write to production data.</p>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl"><DemoTabs /></div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-black text-slate-950">Interactive sample portals</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">Use the sample controls to understand the workflow. Actions that would normally change real data are simulated in demo mode.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {demoLinks.map(({ title, href, icon: Icon, description }) => (
              <Link key={title} href={href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <Icon className="h-6 w-6 text-brand-red-600" />
                <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-brand-red-700">Open demo <ArrowRight className="h-4 w-4" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 text-center">
        <h2 className="text-3xl font-black text-slate-950">Ready to test your own workspace?</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">Start a 14-day organization trial. No card is required for the trial.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/store/trial" className="rounded-xl bg-brand-red-600 px-7 py-3.5 font-bold text-white hover:bg-brand-red-700">Start Trial</Link>
          <Link href="/store/plans" className="rounded-xl border border-slate-300 px-7 py-3.5 font-bold text-slate-800 hover:bg-slate-50">View Plans</Link>
        </div>
      </section>
    </main>
  );
}
