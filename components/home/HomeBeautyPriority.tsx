import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Sparkles } from 'lucide-react';

const TRACKS = [
  {
    title: 'Barber Apprenticeship',
    hours: '2,000 hours of supervised host-shop training',
    focus: 'Haircutting, fades, grooming, sanitation, client service, and professional practice',
    image: '/images/partners/kountry-kutz/interior-active.webp',
    href: '/programs/barber-apprenticeship',
    icon: BadgeCheck,
  },
  {
    title: 'Cosmetology Apprenticeship',
    hours: '2,000 hours of supervised salon training',
    focus: 'Haircutting, styling, color, chemical services, sanitation, and client care',
    image: '/images/pexels/cosmetology.webp',
    href: '/programs/cosmetology-apprenticeship',
    icon: Sparkles,
  },
  {
    title: 'Esthetician Apprenticeship',
    hours: '2,000 hours of supervised work-based training',
    focus: 'Skin care, sanitation, client consultation, services, safety, and professional practice',
    image: '/images/beauty/esthetics-hero.webp',
    href: '/programs/esthetician-apprenticeship',
    icon: Sparkles,
  },
  {
    title: 'Nail Technician Apprenticeship',
    hours: '2,000 hours of supervised nail-salon training',
    focus: 'Manicuring, pedicuring, nail enhancements, sanitation, and client safety',
    image: '/images/pexels/nail-tech.webp',
    href: '/programs/nail-technician-apprenticeship',
    icon: BadgeCheck,
  },
] as const;

const FEATURED_TRACKS = TRACKS.slice(0, 2);
const MORE_TRACKS = TRACKS.slice(2);

export function HomeBeautyPriority() {
  return (
    <section className="border-y border-rose-100 bg-gradient-to-b from-rose-50 via-white to-white px-4 py-12 sm:py-16" aria-labelledby="beauty-pathways-heading">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-rose-700">Featured Apprenticeship Programs</p>
          <h2 id="beauty-pathways-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Start with Barber or Cosmetology.
          </h2>
          <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-700 sm:text-lg">
            Our featured earn-while-you-learn pathways combine structured instruction with supervised training at an approved Host Site. Explore Barber and Cosmetology first, then compare the additional beauty apprenticeships.
          </p>
        </div>

        <div className="mt-7 rounded-3xl border-2 border-amber-300 bg-amber-50 px-5 py-5 shadow-sm sm:px-7">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-900">Limited-time enrollment offer</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">$300 off the deposit to start</h3>
          <p className="mt-2 max-w-4xl text-base font-semibold leading-7 text-slate-800">
            Barber, Cosmetology, Nail Technician, and Esthetician programs usually require $600 to get started. For a limited time, qualified applicants can receive $300 off the starting deposit.
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-600">
            Offer is subject to qualification and enrollment requirements. Program tuition and other charges are separate from this limited-time deposit offer.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {FEATURED_TRACKS.map(({ title, hours, focus, image, href, icon: Icon }) => (
            <article key={title} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <Link href={href} className="block h-full">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <Image src={image} alt={`${title} training`} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-slate-900 shadow-sm">
                    <Icon className="h-4 w-4 text-rose-700" /> Apprenticeship Pathway
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="text-2xl font-black text-slate-950">{title}</h3>
                  <p className="mt-3 text-sm font-bold text-rose-800">{hours}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{focus}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-rose-700">View pathway <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {MORE_TRACKS.map(({ title, hours, focus, href, icon: Icon }) => (
            <Link key={title} href={href} className="group rounded-2xl border border-rose-100 bg-rose-50/70 p-5 transition hover:border-rose-300 hover:bg-rose-50">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-rose-700"><Icon className="h-4 w-4" /> Additional Apprenticeship</div>
              <h3 className="mt-3 text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm font-bold text-rose-800">{hours}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{focus}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-rose-700">View pathway <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-900 bg-slate-950 px-5 py-5 text-white sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.14em] text-rose-300">Program-specific verification</div>
              <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-100">
                Apprenticeship, licensing, hour, funding, and credential requirements are evaluated for the exact occupation and program selected. Public funding is never assumed from provider-level status alone.
              </p>
            </div>
            <Link href="/approvals" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950">Review approvals <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
