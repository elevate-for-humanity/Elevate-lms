// components/marketing/PhotoCTA.tsx
import Image from "next/image";
import Link from "next/link";

export function PhotoCTA() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
          {/* Photo collage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative h-40 overflow-hidden rounded-2xl sm:h-48">
              <Image
                src="/images/pages/comp-photo-cta-1.jpg"
                alt="Barber apprenticeship in action"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-40 overflow-hidden rounded-2xl sm:h-48">
              <Image
                src="/media/programs/efh-cna-hero.jpg"
                alt="Healthcare student in lab coat"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-40 overflow-hidden rounded-2xl sm:h-48">
              <Image
                src="/images/pages/comp-photo-cta-2.jpg"
                alt="HVAC technician training"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-40 overflow-hidden rounded-2xl sm:h-48">
              <Image
                src="/images/pages/comp-photo-cta-3.jpg"
                alt="Classroom and coaching"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Text + CTA */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-orange-600">
              Real spaces, real people
            </h2>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-black">
              Show courts, case managers, and employers what Elevate feels like.
            </p>
            <p className="mt-3 text-sm text-black">
              These aren&apos;t stock photos. They&apos;re the environments,
              partners, and energy your learners actually experience — from the
              shop floor to the clinic to the classroom.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/apply"
                className="inline-flex w-full items-center justify-center rounded-full bg-brand-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-orange-200 transition hover:bg-brand-orange-400"
              >
                Start my Elevate journey
              </Link>
              <Link
                href="/employers"
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-black shadow-sm hover:border-brand-orange-300 hover:bg-brand-orange-50"
              >
                I&apos;m an employer / court / partner
              </Link>
              <p className="text-xs text-slate-500">
                We work with workforce boards, courts, re-entry programs,
                community orgs, and employers to line training up with real
                opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
