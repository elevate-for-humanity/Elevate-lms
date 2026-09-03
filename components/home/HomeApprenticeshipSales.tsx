import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Banknote, BriefcaseBusiness, GraduationCap } from 'lucide-react';

const PROGRAMS = [
  { label: 'Barber', href: '/programs/barber-apprenticeship' },
  { label: 'Cosmetology', href: '/programs/cosmetology-apprenticeship' },
  { label: 'Esthetics', href: '/programs/esthetician-apprenticeship' },
  { label: 'Nail Technology', href: '/programs/nail-technician-apprenticeship' },
] as const;

export function HomeApprenticeshipSales() {
  return (
    <section className="overflow-hidden bg-slate-950 px-4 py-14 text-white sm:py-20" aria-labelledby="apprenticeship-sales-heading">
      <div className="mx-auto grid max-w-6xl gap-9 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-orange-300">Earn While You Learn</p>
          <h2 id="apprenticeship-sales-heading" className="mt-3 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
            Turn beauty and barbering talent into a licensed career.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Train with experienced professionals in a real workplace, complete related instruction, document your progress, and prepare for Indiana licensing requirements.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Benefit icon={Banknote} title="Earn while training" body="Paid employment depends on placement and the participating Host Shop." />
            <Benefit icon={BriefcaseBusiness} title="Real workplace skills" body="Practice in a supervised salon, spa, nail studio, or barbershop." />
            <Benefit icon={GraduationCap} title="Licensing preparation" body="Complete structured training and prepare for applicable state requirements." />
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {PROGRAMS.map((program) => (
              <Link key={program.href} href={program.href} className="rounded-full border border-white/25 bg-slate-800/80 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-slate-50 hover:text-slate-950">
                {program.label}
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/barber-and-beauty-apprenticeships" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-7 py-3.5 font-black text-white hover:bg-brand-red-700">
              Compare Apprenticeships <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/apply/student" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-white bg-white px-7 py-3.5 font-black text-slate-950 hover:bg-slate-100">
              Start My Application
            </Link>
          </div>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/20 sm:aspect-[4/3] lg:aspect-[4/5]">
          <Image
            src="/images/pages/barber-hands-on-bright.webp"
            alt="Barber apprentice building hands-on skills with professional supervision"
            fill
            className="object-cover brightness-110 contrast-105 saturate-110"
            sizes="(max-width: 1024px) 100vw, 46vw"
          />
        </div>
      </div>
    </section>
  );
}

function Benefit({ icon: Icon, title, body }: { icon: typeof BadgeCheck; title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-white/15 bg-white/10 p-4">
      <Icon className="h-6 w-6 text-orange-300" aria-hidden="true" />
      <h3 className="mt-3 font-black text-white">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-300">{body}</p>
    </article>
  );
}
