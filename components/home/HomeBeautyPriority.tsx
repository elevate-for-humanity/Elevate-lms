import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Building2, Scissors, Sparkles } from 'lucide-react';

const TRACKS = [
  {
    title: 'Barbering Apprenticeship',
    hours: '2,000 OJL hours + 144 hours of Related Technical Instruction',
    focus: 'Fades, clipper work, shaving, sanitation, shop operations',
    image: '/images/pages/barber-apprenticeship-hero.jpg',
    href: '/barber-apprenticeship',
    icon: Scissors,
  },
  {
    title: 'Cosmetology Apprenticeship',
    hours: '2,000 hours of supervised salon training',
    focus: 'Haircutting, styling, color, chemical services, client care',
    image: '/images/pexels/cosmetology.webp',
    href: '/cosmetology-apprenticeship',
    icon: Sparkles,
  },
  {
    title: 'Nail Technician Apprenticeship',
    hours: '600 hours of supervised training',
    focus: 'Manicuring, pedicuring, nail enhancements, sanitation',
    image: '/images/pexels/nail-tech.webp',
    href: '/nail-technician-apprenticeship',
    icon: BadgeCheck,
  },
] as const;

export function HomeBeautyPriority() {
  return (
    <section className="border-y border-rose-100 bg-gradient-to-b from-rose-50 via-white to-white px-4 py-12 sm:py-16" aria-labelledby="beauty-pathways-heading">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-7 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-rose-700">Beauty & Grooming Apprenticeships</p>
            <h2 id="beauty-pathways-heading" className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Earn while you learn inside an approved Indiana host shop.
            </h2>
            <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-700 sm:text-lg">
              Choose the license path you want, apply directly to that track, and complete supervised on-the-job learning with related technical instruction. Funding is reviewed by program, participant, region, and current authorization—never assumed.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Building2 className="mt-1 h-6 w-6 shrink-0 text-rose-700" />
              <div>
                <div className="font-black text-slate-950">Own a salon, spa, or barbershop?</div>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-600">Apply to become an Elevate Host Site. Elevate supports sponsor governance, RTI coordination, hour tracking, and apprenticeship workflows.</p>
                <Link href="/partners/host-shops" className="mt-3 inline-flex items-center gap-2 text-sm font-black text-rose-700 hover:text-rose-900">
                  Become a Host Shop <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {TRACKS.map(({ title, hours, focus, image, href, icon: Icon }) => (
            <article key={title} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <Link href={href} className="block h-full">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <Image src={image} alt={`${title} training`} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 33vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-slate-900 shadow-sm">
                    <Icon className="h-4 w-4 text-rose-700" /> Earn While You Learn
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="text-xl font-black text-slate-950">{title}</h3>
                  <p className="mt-3 text-sm font-bold text-rose-800">{hours}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{focus}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-rose-700">Learn More & Apply <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-900 bg-slate-950 px-5 py-5 text-white sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.14em] text-rose-300">Trust & verification</div>
              <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-100">
                Elevate operates Registered Apprenticeship pathways and is an Indiana ETPL-listed training provider. ETPL/WIOA eligibility is program-specific; applicants should use the funding review process for the exact track they select.
              </p>
            </div>
            <Link href="/approvals" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950">Verify approvals <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
