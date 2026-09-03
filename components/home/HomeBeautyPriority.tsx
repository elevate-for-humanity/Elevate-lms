import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Sparkles } from 'lucide-react';

const TRACKS = [
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
    hours: 'Supervised work-based training with related technical instruction',
    focus: 'Skin care, sanitation, client consultation, services, safety, and professional practice',
    image: '/images/beauty/esthetics-hero.webp',
    href: '/programs/esthetician-apprenticeship',
    icon: Sparkles,
  },
  {
    title: 'Nail Technician Apprenticeship',
    hours: '600 hours of supervised training',
    focus: 'Manicuring, pedicuring, nail enhancements, sanitation, and client safety',
    image: '/images/pexels/nail-tech.webp',
    href: '/programs/nail-technician-apprenticeship',
    icon: BadgeCheck,
  },
] as const;

export function HomeBeautyPriority() {
  return (
    <section className="border-y border-rose-100 bg-gradient-to-b from-rose-50 via-white to-white px-4 py-12 sm:py-16" aria-labelledby="beauty-pathways-heading">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-rose-700">Beauty & Grooming Apprenticeships</p>
          <h2 id="beauty-pathways-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Continue into a licensed beauty pathway.
          </h2>
          <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-700 sm:text-lg">
            Barber and host-shop entry points are featured above. This section completes the beauty pathway with cosmetology, esthetics, and nail technician options so each discipline has a distinct destination instead of repeating the same cards.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {TRACKS.map(({ title, hours, focus, image, href, icon: Icon }) => (
            <article key={title} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <Link href={href} className="block h-full">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <Image src={image} alt={`${title} training`} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 33vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-slate-900 shadow-sm">
                    <Icon className="h-4 w-4 text-rose-700" /> Apprenticeship Pathway
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="text-xl font-black text-slate-950">{title}</h3>
                  <p className="mt-3 text-sm font-bold text-rose-800">{hours}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{focus}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-rose-700">View pathway <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            </article>
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
