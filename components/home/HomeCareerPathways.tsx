import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Calculator, Truck, Wrench } from 'lucide-react';

const PATHWAYS = [
  { slug: 'hvac-technician', title: 'HVAC', description: 'Heating, cooling and service.', icon: Wrench, href: '/programs/hvac-technician' },
  { slug: 'cdl-training', title: 'CDL Training', description: 'Commercial driving skills.', icon: Truck, href: '/programs/cdl-training' },
  { slug: 'bookkeeping', title: 'Bookkeeping', description: 'QuickBooks and business records.', icon: Calculator, href: '/programs/bookkeeping' },
  { slug: 'business', title: 'Business', description: 'Start and grow your business.', icon: BriefcaseBusiness, href: '/programs/business' },
] as const;

export function HomeCareerPathways() {
  return (
    <section className="border-t border-slate-200 bg-slate-50 px-4 py-8 sm:py-12" aria-labelledby="featured-pathways-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="featured-pathways-heading" className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Find your career path</h2>
        <div data-mobile-grid="2" className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {PATHWAYS.map(({ slug, title, description, icon: Icon, href }) => (
            <Link key={slug} href={href} className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 hover:border-brand-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red-700 sm:p-5">
              <Icon className="h-6 w-6 text-brand-red-700" aria-hidden="true" />
              <h3 className="mt-3 text-base font-bold text-slate-950 sm:text-lg">{title}</h3>
              <p className="mt-2 text-sm leading-5 text-slate-600">{description}</p>
              <span className="mt-auto inline-flex min-h-11 items-center gap-2 pt-3 text-sm font-bold text-brand-red-700">Explore <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
        <Link href="/programs" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-red-700">View all programs <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
