import Link from 'next/link';
import { ArrowRight, BookOpen, BriefcaseBusiness, Truck, Wrench } from 'lucide-react';

// Keep the real Host Shop photography as the homepage's visual proof.
// Program details have their own media; unrelated stock cards do not belong here.
const PATHWAYS = [
  { slug: 'hvac-technician', title: 'HVAC', detail: 'Heating, cooling and service', icon: Wrench, href: '/programs/hvac-technician' },
  { slug: 'cdl-training', title: 'CDL', detail: 'Commercial driver training', icon: Truck, href: '/programs/cdl-training' },
  { slug: 'bookkeeping', title: 'Bookkeeping', detail: 'Financial records and payroll', icon: BookOpen, href: '/programs/bookkeeping' },
  { slug: 'business', title: 'Business', detail: 'Entrepreneurship and operations', icon: BriefcaseBusiness, href: '/programs/business' },
] as const;

export function HomeCareerPathways() {
  return (
    <section className="bg-white px-4 py-8 sm:py-12" aria-labelledby="featured-pathways-heading">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="featured-pathways-heading" className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Find your career path.</h2>
          <Link href="/programs" className="inline-flex min-h-11 items-center gap-2 font-bold text-brand-red-700">All programs <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PATHWAYS.map(({ slug, title, detail, icon: Icon, href }) => (
            <Link key={slug} href={href} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-red-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-red-700 lg:flex-col lg:items-start lg:p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-brand-blue-800"><Icon className="h-6 w-6" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-950">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-brand-red-700" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
