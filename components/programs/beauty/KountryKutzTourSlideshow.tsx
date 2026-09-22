'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

const slides = [
  {
    src: '/images/partners/kountry-kutz/interior-empty.webp',
    alt: 'Training stations inside Kountry Kutz Barbershop in New Palestine',
    label: 'Professional training stations',
  },
  {
    src: '/images/partners/kountry-kutz/interior-active.webp',
    alt: 'Barbers and clients inside Kountry Kutz Barbershop',
    label: 'A real working barbershop',
  },
  {
    src: '/images/partners/kountry-kutz-apprenticeship-flyer.webp',
    alt: 'Kountry Kutz barber apprenticeship host-shop announcement',
    label: 'An approved apprenticeship Host Shop',
  },
] as const;

export default function KountryKutzTourSlideshow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(
      () => setActive((current) => (current + 1) % slides.length),
      6000,
    );
    return () => window.clearTimeout(timer);
  }, [active, paused]);

  const select = (index: number) => {
    setActive((index + slides.length) % slides.length);
  };

  return (
    <section
      className="border-b border-slate-200 bg-slate-950 px-4 py-10 text-white sm:px-6 sm:py-14"
      aria-labelledby="kountry-kutz-tour-heading"
      data-narration-rate="0.95"
      data-narration-style="instructor"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">
              Featured Host Shop
            </p>
            <h2 id="kountry-kutz-tour-heading" className="mt-2 text-3xl font-black sm:text-4xl">
              Tour Kountry Kutz Barbershop
            </h2>
            <p className="mt-3 leading-7 text-slate-200">
              See the real New Palestine shop environment where approved apprentices can practice
              sanitation, client service, haircutting, grooming, and professional workplace routines
              under qualified supervision.
            </p>
          </div>
          <Link
            href="/host-shops/kountry-kutz-barbershop"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700"
          >
            Explore Kountry Kutz
          </Link>
        </div>

        <div
          className="overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl"
          aria-roledescription="carousel"
          aria-label="Kountry Kutz photo tour"
        >
          <div className="relative aspect-[4/3] min-h-[300px] sm:aspect-[16/9] sm:min-h-[420px]">
            {slides.map((slide, index) => (
              <Image
                key={slide.src}
                src={slide.src}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 1152px"
                className={`object-contain transition-opacity duration-700 ${
                  index === active ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                aria-hidden={index !== active}
              />
            ))}
            <button
              type="button"
              onClick={() => select(active - 1)}
              className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-white"
              aria-label="Previous Kountry Kutz photo"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => select(active + 1)}
              className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-white"
              aria-label="Next Kountry Kutz photo"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/15 bg-slate-900 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-bold text-slate-100">{slides[active].label}</p>
            <div className="flex items-center gap-3">
              <div className="flex gap-2" aria-label="Choose a Kountry Kutz photo">
                {slides.map((slide, index) => (
                  <button
                    key={slide.src}
                    type="button"
                    onClick={() => select(index)}
                    className={`h-3 rounded-full transition-all ${
                      index === active ? 'w-9 bg-red-500' : 'w-3 bg-slate-500'
                    }`}
                    aria-label={`Show photo ${index + 1}: ${slide.label}`}
                    aria-current={index === active ? 'true' : undefined}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 px-4 py-2 text-sm font-black"
                aria-label={paused ? 'Resume Kountry Kutz slideshow' : 'Pause Kountry Kutz slideshow'}
                aria-pressed={paused}
              >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {paused ? 'Play' : 'Pause'}
              </button>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-5 max-w-4xl text-center text-sm leading-6 text-slate-300">
          56 W Main St, Suite A, New Palestine, Indiana. Placement, employment, schedule,
          supervision, and enrollment approval are confirmed before training begins.
        </p>
      </div>
    </section>
  );
}
