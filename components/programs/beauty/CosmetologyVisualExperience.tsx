'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const slides = [
  {
    src: '/images/partners/generations-hair/highlighted-curls-home.webp',
    alt: 'Dimensional highlighted curls created at Generations Hair LLC',
    title: 'Build salon-ready technique',
    copy: 'Practice texture, finishing, client consultation, and professional service inside a supervised salon environment.',
  },
  {
    src: '/images/partners/generations-hair/vivids.webp',
    alt: 'Professional vivid color work by Generations Hair Co',
    title: 'Develop creative color confidence',
    copy: 'Connect classroom theory to color formulation, application, safety, and finished results.',
  },
  {
    src: '/images/partners/generations-hair/premium-stylist-at-work.jpg',
    alt: 'A Generations Hair Co stylist working with a salon client',
    title: 'Learn in the rhythm of a real salon',
    copy: 'Strengthen workplace habits, client care, time management, and documented on-the-job learning.',
  },
  {
    src: '/images/partners/generations-hair/blondes.webp',
    alt: 'Professional blonde hair portfolio by Generations Hair Co',
    title: 'Work toward a professional standard',
    copy: 'See the range of technical outcomes apprentices build toward through structured practice and coaching.',
  },
] as const;

const supportingImages = [
  {
    src: '/images/partners/generations-hair/curls.webp',
    alt: 'Curly hair portfolio by Generations Hair Co',
    label: 'Texture & finishing',
  },
  {
    src: '/images/partners/generations-hair/reds-coppers.webp',
    alt: 'Red and copper color portfolio by Generations Hair Co',
    label: 'Color formulation',
  },
  {
    src: '/images/partners/generations-hair/special-event-styling.webp',
    alt: 'Special event styling portfolio by Generations Hair Co',
    label: 'Styling & client service',
  },
] as const;

export default function CosmetologyVisualExperience() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[active] ?? slides[0];
  const move = useCallback((delta: number) => {
    setActive((current) => (current + delta + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => move(1), 8000);
    return () => window.clearInterval(timer);
  }, [move, paused]);

  return (
    <>
      <section
        className="relative isolate overflow-hidden bg-[#171412] text-white"
        aria-roledescription="carousel"
        aria-label="Cosmetology apprenticeship experience"
      >
        <div
          className="absolute inset-0 bg-[#171412] bg-cover bg-center"
          style={{ backgroundImage: `url(${slides[0].src})` }}
          aria-hidden="true"
        />
        {slides.map((item, index) => (
          <Image
            key={item.src}
            src={item.src}
            alt={index === active ? item.alt : ''}
            fill
            priority={index === 0}
            sizes="100vw"
            className={`object-cover object-center transition-opacity duration-1000 ${index === active ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={index !== active}
          />
        ))}
        <div
          className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/58 to-slate-950/15"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/10"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto flex min-h-[560px] max-w-7xl items-end px-5 pb-16 pt-24 sm:px-8 lg:min-h-[680px] lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
              Indiana registered apprenticeship pathway
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
              Earn your Indiana cosmetology license while getting paid.
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-100">
              {slide.title}. {slide.copy}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/apply/student?program=cosmetology-apprenticeship"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700"
              >
                Enroll now <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/partners/host-shops"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-white/70 bg-white/10 px-6 py-3 font-black text-white backdrop-blur hover:bg-white/20"
              >
                View all Host Sites
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-white/90">
              {[
                '2,000 supervised hours',
                'Paid on-the-job learning',
                'Progress tracked in your portal',
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 rounded-full border border-white/30 bg-slate-950/55 p-1.5 backdrop-blur">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous cosmetology image"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-12 text-center text-xs font-black">
            {active + 1} / {slides.length}
          </span>
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? 'Play cosmetology slideshow' : 'Pause cosmetology slideshow'}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15"
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next cosmetology image"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="bg-[#f7f3ed] px-4 py-14 sm:px-6 sm:py-18">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700">
              See the work. Learn the craft.
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Training becomes real when technique meets the salon floor.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Move through a visual pathway of texture, color, styling, and client service before
              reviewing the detailed program requirements below.
            </p>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {supportingImages.map((item) => (
              <figure
                key={item.src}
                className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <figcaption className="px-5 py-4 text-lg font-black text-slate-950">
                  {item.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
