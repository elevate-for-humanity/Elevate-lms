import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BEAUTY_TRADES } from '@/lib/programs/beauty-trade-navigation';

export const metadata: Metadata = {
  title: 'Barber, Cosmetology, Esthetics & Nail Programs | Elevate for Humanity',
  description: 'Choose one clear training pathway: barbering, cosmetology and hair, esthetics, or nail technology. Explore its own program, requirements, and approved Host Shops.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/barber-and-beauty-apprenticeships' },
  robots: { index: true, follow: true },
};

const images: Record<(typeof BEAUTY_TRADES)[number]['key'], string> = {
  barber: '/images/partners/top-shelf-barber-lounge/top-shelf-fade-profile-enhanced-2026.webp',
  cosmetology: '/images/partners/salon-saloon/team-interior-enhanced-2026.webp',
  esthetician: '/images/partners/mesmerized-by-beauty/downtown-esthetician-program.webp',
  'nail-technician': '/images/partners/mesmerized-by-beauty/downtown-nail-program.webp',
};

export default function BarberBeautyProgramsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-slate-950 px-4 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Elevate for Humanity · Personal services</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Choose your craft. Find your path.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">Four professional programs. Four dedicated pages. Select the field that interests you to see its specific training, admissions, and approved workplace options.</p>
        </div>
      </header>
      <section aria-labelledby="beauty-programs-heading" className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 id="beauty-programs-heading" className="text-3xl font-black tracking-tight">Explore your program</h2>
          <p className="mt-3 max-w-2xl text-slate-700">Program requirements and payment information belong on each individual program page—not mixed across unrelated professions.</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {BEAUTY_TRADES.map(trade => (
              <article key={trade.key} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <Image src={images[trade.key]} alt={`${trade.label} professional training`} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-2xl font-black">{trade.label}</h3>
                  <p className="mt-3 flex-1 leading-7 text-slate-700">{trade.description}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={trade.programHref} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800">
                      View {trade.title} →
                    </Link>
                    <Link href={trade.hostHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-900 hover:bg-slate-50">
                      {trade.label} Host Shops
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="border-t border-slate-200 bg-slate-50 px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black">Looking for a training location?</h2>
            <p className="mt-2 max-w-2xl text-slate-700">Browse approved businesses by trade. A public shop listing does not guarantee an available apprentice placement.</p>
          </div>
          <Link href="/partners/host-shops" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-red-700 px-6 font-bold text-white hover:bg-red-800">Browse Host Shop categories</Link>
        </div>
      </section>
    </main>
  );
}

