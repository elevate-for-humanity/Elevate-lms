import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const PATHWAYS = [
  { slug:'beauty-barber-network', title:'Beauty & Barber Network', description:'Train in real professional environments and explore barber, cosmetology, esthetics, and nail pathways.', image:'/images/pages/barber-hero-main.webp', imageAlt:'Barber and beauty professional training in a working shop', ctaHref:'/apprenticeships', cta:'Explore Beauty & Barber' },
  { slug:'hvac-technician', title:'HVAC Technician', description:'Build hands-on heating, cooling, safety, diagnostics, installation, and service skills.', image:'/images/hvac-hero.webp', imageAlt:'HVAC technician working on an air-conditioning system', ctaHref:'/programs/hvac-technician', cta:'View HVAC Program' },
  { slug:'cdl-training', title:'CDL Training', description:'Prepare for commercial driving through permit, safety, inspection, and road-training requirements.', image:'/images/pages/cdl-loading-dock.webp', imageAlt:'Commercial truck at a loading dock for CDL training', ctaHref:'/programs/cdl-training', cta:'View CDL Program' },
  { slug:'bookkeeping', title:'Bookkeeping', description:'Learn practical bookkeeping, QuickBooks, payroll, financial records, and business-office workflows.', image:'/images/pages/bookkeeping.webp', imageAlt:'Bookkeeping learner working with financial records', ctaHref:'/programs/bookkeeping', cta:'View Bookkeeping Program' },
  { slug:'business', title:'Business & Entrepreneurship', description:'Learn how to organize, launch, market, operate, and grow a business.', image:'/images/pages/business-meeting.webp', imageAlt:'Entrepreneurs collaborating on a business plan', ctaHref:'/programs/business', cta:'View Business Program' },
] as const;

export function HomeCareerPathways() {
  return (
    <section className="bg-white px-4 py-16 sm:py-20" aria-labelledby="featured-pathways-heading" aria-label="Choose the program you want to explore.">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">Flagship opportunities</p>
          <h2 id="featured-pathways-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Choose a path that can move you forward.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-700">Career-training program pages show current tuition, duration, delivery format, credentials, requirements, funding information, payment options, and enrollment steps. State or workforce funding may cover tuition for eligible participants in approved programs; eligibility and authorization are determined individually.</p>
        </div>
        <div className="mt-10 grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-5">
          {PATHWAYS.map((p) => (
            <article key={p.slug} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-2xl">
              <Link href={p.ctaHref} className="flex h-full flex-col">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image src={p.image} alt={p.imageAlt} fill className="object-cover brightness-105 contrast-105 saturate-110 transition duration-500 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 20vw" loading="lazy" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-black leading-tight text-slate-950">{p.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{p.description}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-extrabold text-brand-red-700">{p.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/programs" className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-7 py-4 font-extrabold text-white hover:bg-brand-red-700">View All Career Programs <ArrowRight className="h-5 w-5" /></Link>
          <Link href="/check-eligibility" className="inline-flex items-center rounded-xl border-2 border-slate-900 px-7 py-4 font-extrabold text-slate-950 hover:bg-slate-50">Check Funding Options</Link>
        </div>
      </div>
    </section>
  );
}
