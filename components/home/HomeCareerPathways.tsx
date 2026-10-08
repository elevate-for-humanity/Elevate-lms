import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const PATHWAYS = [
  {
    slug: 'hvac-technician', title: 'HVAC Technician',
    description: 'Learn heating and cooling fundamentals, electrical safety, diagnostics, maintenance and equipment service. Explore classroom and hands-on training options.',
    image: '/images/hvac-hero.webp', alt: 'HVAC technician working on heating and cooling equipment', href: '/programs/hvac-technician',
  },
  {
    slug: 'cdl-training', title: 'CDL Training',
    description: 'Prepare for commercial driving through permit study, vehicle inspections, safety procedures and supervised driving practice.',
    image: '/images/pages/cdl-loading-dock.webp', alt: 'Commercial truck at a loading dock', href: '/programs/cdl-training',
  },
  {
    slug: 'bookkeeping', title: 'Bookkeeping',
    description: 'Learn financial records, payroll, accounts payable and receivable, reconciliations and practical QuickBooks workflows.',
    image: '/images/pages/bookkeeping-ledger.webp', alt: 'Bookkeeping records and ledger materials', href: '/programs/bookkeeping',
  },
  {
    slug: 'business', title: 'Business & Entrepreneurship',
    description: 'Develop a business plan and practical skills in budgeting, marketing, customer service, operations and business administration.',
    image: '/images/pages/business-meeting.webp', alt: 'Business professionals collaborating at a meeting', href: '/programs/business-administration',
  },
] as const;

export function HomeCareerPathways() {
  return (
    <section className="border-t border-slate-200 bg-slate-50 px-4 py-10 sm:py-14" aria-labelledby="featured-pathways-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="featured-pathways-heading" className="text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">Build skills for a career you can grow in</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">Explore what you will learn and how to get started. Workforce funding may be available to eligible applicants after agency approval.</p>
        <div data-mobile-grid="2" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PATHWAYS.map(({ slug, title, description, image, alt, href }) => (
            <article key={slug} className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-slate-100" aria-label={`Explore ${title}`}>
                <Image src={image} alt={alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" loading="lazy" className="object-cover" />
              </Link>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <h3 className="text-lg font-bold leading-snug text-slate-950">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-700">{description}</p>
                <Link href={href} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-red-700">Explore program <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              </div>
            </article>
          ))}
        </div>
        <Link href="/programs" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-red-700">View all programs <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
