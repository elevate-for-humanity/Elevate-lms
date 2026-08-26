import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, GraduationCap, MapPin, ShieldCheck } from 'lucide-react';
import { BARBER_APPRENTICESHIP } from '@/data/programs/barber-apprenticeship';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';

export const metadata: Metadata = {
  title: 'Apprenticeship Programs | Elevate for Humanity',
  description:
    'Explore Elevate apprenticeship pathways in barbering, cosmetology, esthetics, and nail technology, including supervised work-based learning, related instruction, progress tracking, and licensing pathways.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/apprenticeships' },
};

const PROGRAM = BARBER_APPRENTICESHIP;

const PATHWAYS = [
  {
    title: 'Barber Apprenticeship',
    href: '/programs/barber-apprenticeship',
    applyHref: '/apply/student?program=barber-apprenticeship',
    image: PROGRAM.heroImage || '/images/pexels/barber-hero.webp',
    imageAlt: PROGRAM.heroImageAlt || 'Barber apprentice training at a licensed host shop',
    badge: 'DOL Registered Pathway',
    description: 'Structured on-the-job learning, related technical instruction, documented progress, and preparation for Indiana barber licensing requirements.',
  },
  {
    title: 'Cosmetology Apprenticeship',
    href: '/programs/cosmetology-apprenticeship',
    applyHref: '/apply/student?program=cosmetology-apprenticeship',
    image: '/images/pexels/cosmetology.webp',
    imageAlt: 'Cosmetology apprentice receiving supervised salon training',
    badge: 'Beauty Apprenticeship Pathway',
    description: 'Supervised salon learning in hair services, client care, sanitation, business practices, and documented progress toward the applicable licensing pathway.',
  },
  {
    title: 'Esthetics Apprenticeship',
    href: '/programs/esthetician-apprenticeship',
    applyHref: '/apply/student?program=esthetician-apprenticeship',
    image: '/images/pexels/esthetician.webp',
    imageAlt: 'Esthetics apprentice completing supervised skincare training',
    badge: 'Beauty Apprenticeship Pathway',
    description: 'Hands-on skincare training with supervision, sanitation, client safety, service practice, and progress documentation.',
  },
  {
    title: 'Nail Technician Apprenticeship',
    href: '/programs/nail-technician-apprenticeship',
    applyHref: '/apply/student?program=nail-technician-apprenticeship',
    image: '/images/pexels/nail-tech.webp',
    imageAlt: 'Nail technician apprentice completing supervised salon training',
    badge: 'Beauty Apprenticeship Pathway',
    description: 'Supervised nail-services training covering sanitation, manicuring, client care, service skills, and documented training progress.',
  },
] as const;

const EXPERIENCE = [
  { icon: GraduationCap, title: 'Learn the craft', body: 'Complete structured instruction connected to your occupation and licensing pathway.' },
  { icon: BriefcaseBusiness, title: 'Train on the job', body: 'Build skills through supervised work-based learning at an approved participating site.' },
  { icon: ShieldCheck, title: 'Track real progress', body: 'Hours, competencies, documents, RTI, and required milestones are recorded in the apprenticeship workflow.' },
  { icon: MapPin, title: 'Work with a host site', body: 'Host-site availability is confirmed during enrollment and depends on current participating capacity.' },
] as const;

export default function ApprenticeshipsPage() {
  const hero = heroBanners.apprenticeships;
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <HeroVideo
        videoSrcDesktop={hero.videoSrcDesktop}
        videoSrcMobile={hero.videoSrcMobile}
        posterImage={hero.posterImage || '/images/pages/admin-apprenticeships-hero.webp'}
        voiceoverSrc={hero.voiceoverSrc}
        microLabel="Earn while you learn"
        belowHeroHeadline="Apprenticeship puts training where the work happens."
        belowHeroSubheadline="Build real skills through supervised work-based learning, structured instruction, progress tracking, and a clear path toward occupation-specific requirements."
        ctas={[
          { label: 'Explore Apprenticeships', href: '#programs' },
          { label: 'Find Host Shops', href: '/partners/host-shops', variant: 'secondary' },
        ]}
        trustIndicators={hero.trustIndicators}
        transcript={hero.transcript}
        analyticsName="apprenticeships"
        heightClassName="aspect-[16/9] h-auto min-h-[280px] max-h-[600px] sm:aspect-[21/9]"
        mediaFit="cover"
      />

      <section className="border-b border-slate-200 bg-white px-4 py-10 sm:py-12">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXPERIENCE.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white"><Icon className="h-5 w-5" /></div>
              <h2 className="mt-4 text-lg font-black text-slate-950">{title}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="programs" className="px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-red-700">Choose your pathway</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">See the work before you read the details.</h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-700 sm:text-lg">Each pathway has its own requirements, tuition, licensing objective, and enrollment record. Open the program that fits what you want to do.</p>
          </div>

          <div className="mt-9 grid gap-6 md:grid-cols-2">
            {PATHWAYS.map((pathway) => (
              <article key={pathway.href} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <Link href={pathway.href} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <Image src={pathway.image} alt={pathway.imageAlt} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 50vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" aria-hidden="true" />
                    <span className="absolute left-4 top-4 rounded-full bg-slate-950/85 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white backdrop-blur-sm">{pathway.badge}</span>
                    <h3 className="absolute bottom-5 left-5 right-5 text-2xl font-black text-white sm:text-3xl">{pathway.title}</h3>
                  </div>
                </Link>
                <div className="p-6">
                  <p className="text-sm font-medium leading-6 text-slate-700 sm:text-base">{pathway.description}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Link href={pathway.href} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">Program</Link>
                    <Link href={pathway.applyHref} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-slate-50">Apply</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-orange-200 bg-gradient-to-br from-orange-50 via-white to-sky-50 px-4 py-14 text-slate-950 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="relative min-h-[340px] overflow-hidden rounded-3xl sm:min-h-[440px]">
              <Image src="/images/pages/apprenticeship-sponsor-page-1.webp" alt="Apprentice working with an on-site supervisor" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-red-700">How it works</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">A clear path from application to documented progress.</h2>
              <div className="mt-7 space-y-5">
                {[
                  ['01', 'Choose and apply', 'Select the occupation, review the full program record, and submit the required application and documents.'],
                  ['02', 'Confirm the training site', 'Host-site placement and any third-party funding are confirmed for the individual participant before they are treated as approved.'],
                  ['03', 'Train and learn', 'Complete supervised on-the-job learning together with the required instruction and competencies.'],
                  ['04', 'Track the record', 'Hours, skills, documents, and program milestones remain visible in the apprenticeship workflow.'],
                ].map(([n, title, body]) => (
                  <div key={n} className="flex gap-4 border-b border-slate-200 pb-5 last:border-0">
                    <span className="text-sm font-black text-brand-red-700">{n}</span>
                    <div><h3 className="font-black text-slate-950">{title}</h3><p className="mt-1 text-sm font-medium leading-6 text-slate-700 sm:text-base">{body}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 md:grid-cols-3">
            <Link href="/partners/host-shops" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md"><p className="text-xs font-black uppercase tracking-wider text-brand-red-700">Host sites</p><h2 className="mt-2 text-xl font-black">Need a place to train?</h2><p className="mt-2 text-sm leading-6 text-slate-700">Review the participating host-site process and current placement information.</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-brand-blue-800">Host-site information <ArrowRight className="h-4 w-4" /></span></Link>
            <Link href="/funding/wioa" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md"><p className="text-xs font-black uppercase tracking-wider text-brand-red-700">Funding</p><h2 className="mt-2 text-xl font-black">Using workforce funding?</h2><p className="mt-2 text-sm leading-6 text-slate-700">Funding is participant- and program-specific and requires authorization from the responsible agency.</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-brand-blue-800">Review funding steps <ArrowRight className="h-4 w-4" /></span></Link>
            <Link href="/programs" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md"><p className="text-xs font-black uppercase tracking-wider text-brand-red-700">More programs</p><h2 className="mt-2 text-xl font-black">Explore the full catalog.</h2><p className="mt-2 text-sm leading-6 text-slate-700">Compare apprenticeship with healthcare, skilled trades, business, technology, and other pathways.</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-brand-blue-800">All programs <ArrowRight className="h-4 w-4" /></span></Link>
          </div>
          <p className="mx-auto mt-8 max-w-4xl text-center text-xs font-medium leading-5 text-slate-600">Apprenticeship or program status does not automatically provide WIOA, ETPL, Workforce Ready Grant, employer, or other third-party funding. Funding and placement require the applicable authorization and current capacity.</p>
        </div>
      </section>
    </main>
  );
}
