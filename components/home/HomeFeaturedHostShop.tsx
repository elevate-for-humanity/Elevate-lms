import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';

export function HomeFeaturedHostShop() {
  return (
    <section className="border-y border-slate-200 bg-slate-950 px-4 py-10 text-white" aria-labelledby="featured-host-shop-heading">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-white/15 bg-slate-900 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative min-h-[300px] lg:min-h-[440px]">
          <Image
            src="/images/partners/kountry-kutz/interior-active.webp"
            alt="Barbers and customers inside Kountry Kutz Barbershop in New Palestine, Indiana"
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Featured Host Shop</p>
          <h2 id="featured-host-shop-heading" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Meet Kountry Kutz Barbershop.</h2>
          <p className="mt-4 text-base leading-7 text-slate-200">
            See a real workplace connected to Elevate&apos;s Barber Apprenticeship pathway. Host-shop placement, employment, and final approval are confirmed during enrollment.
          </p>
          <p className="mt-5 flex items-start gap-2 text-sm font-bold text-slate-200"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />56 W Main St, Suite A, New Palestine, Indiana</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/host-shops/kountry-kutz-barbershop" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700">Tour the Shop <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/programs/barber-apprenticeship" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white px-6 py-3 font-black text-white hover:bg-white hover:text-slate-950">Explore Barber Apprenticeship</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
