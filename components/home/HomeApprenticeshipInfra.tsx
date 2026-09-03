import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Scissors } from 'lucide-react';

export function HomeApprenticeshipInfra() {
  return (
    <section className="bg-slate-50 px-4 py-14 sm:py-18" aria-labelledby="home-apprenticeship-heading">
      <div className="mx-auto grid max-w-6xl gap-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
        <div className="relative aspect-[3/2] bg-slate-950 lg:aspect-auto lg:min-h-[480px]">
          <Image
            src="/images/partners/salon-saloon/team-sign.webp"
            alt="Salon Saloon team at an Elevate participating Host Salon"
            fill
            className="object-contain object-center"
            sizes="(max-width: 1024px) 100vw, 55vw"
            loading="lazy"
          />
          <div className="absolute left-4 top-4 rounded-full bg-black/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg backdrop-blur-sm sm:left-6 sm:top-6">
            Salon Saloon • Elevate Host Salon
          </div>
        </div>

        <div className="flex items-center px-6 py-9 sm:px-9 sm:py-12 lg:px-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.15em] text-brand-red-700">Registered Apprenticeships</p>
            <h2 id="home-apprenticeship-heading" className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
              Learn the job by doing the job.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Apprenticeship is for people who want hands-on training in a real workplace. You learn from experienced professionals, build documented skills, and can earn wages while you progress through the program.
            </p>

            <div className="mt-7 space-y-4">
              <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                <Scissors className="mt-0.5 h-6 w-6 shrink-0 text-brand-red-700" aria-hidden="true" />
                <div>
                  <h3 className="font-black text-slate-950">Looking for an apprenticeship?</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Explore barber and beauty pathways and see what training in a real shop can look like.</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                <BriefcaseBusiness className="mt-0.5 h-6 w-6 shrink-0 text-brand-red-700" aria-hidden="true" />
                <div>
                  <h3 className="font-black text-slate-950">Own a shop or business?</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Become a Host Site and help train apprentices while Elevate supports onboarding and program administration.</p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/apprenticeships" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 text-sm font-black text-white hover:bg-brand-red-700">
                Explore Apprenticeships <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/partners/host-shops" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 px-6 py-3 text-sm font-black text-slate-950 hover:bg-slate-50">
                Become a Host Shop <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
