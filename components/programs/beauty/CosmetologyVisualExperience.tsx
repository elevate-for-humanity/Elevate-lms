'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const slides = [
  {
    src: '/images/partners/generations-hair/dimensional-color.webp',
    alt: 'Dimensional color work created at Generations Hair LLC',
    title: 'Build salon-ready technique',
    copy: 'Practice texture, finishing, client consultation, and professional service inside a supervised salon environment.',
  },
  {
    src: '/images/partners/generations-hair/extensions.webp',
    alt: 'Professional extension work by Generations Hair Co',
    title: 'Develop creative color confidence',
    copy: 'Connect classroom theory to color formulation, application, safety, and finished results.',
  },
  {
    src: '/images/partners/generations-hair/premium-curls.jpg',
    alt: 'Finished curl styling by Generations Hair Co',
    title: 'Learn in the rhythm of a real salon',
    copy: 'Strengthen workplace habits, client care, time management, and documented on-the-job learning.',
  },
  {
    src: '/images/partners/generations-hair/look-book.webp',
    alt: 'Professional cosmetology look book by Generations Hair Co',
    title: 'Work toward a professional standard',
    copy: 'See the range of technical outcomes apprentices build toward through structured practice and coaching.',
  },
] as const;

const supportingImages = [
  {
    src: '/images/partners/generations-hair/cutting.webp',
    alt: 'Professional haircut portfolio by Generations Hair Co',
    label: 'Texture & finishing',
  },
  {
    src: '/images/partners/generations-hair/brunettes.webp',
    alt: 'Brunette color portfolio by Generations Hair Co',
    label: 'Color formulation',
  },
  {
    src: '/images/partners/generations-hair/color-transformation.webp',
    alt: 'Dimensional color transformation by Generations Hair LLC',
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
        className="overflow-hidden border-b border-slate-200 bg-[#f7f3ed] text-slate-950"
        aria-roledescription="carousel"
        aria-label="Cosmetology apprenticeship experience"
        data-scroll-narration
        data-narration="The cosmetology apprenticeship combines related instruction with supervised salon training. Apply and complete intake, confirm funding or a payment option, secure an approved host salon, complete orientation, then track hours and competencies in your portal. Apprentices learn sanitation, client consultation, hair cutting, texture, color, styling, professional service, and workplace habits. Host-site availability, wages, funding, registration, and licensing are confirmed for each participant and are not guaranteed by an application."
        data-narration-src="/audio/heroes/cosmetology.mp3"
      >
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="flex items-center px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-red-700">
                Cosmetology apprenticeship pathway
              </p>
              <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                Earn your Indiana cosmetology license while getting paid.
              </h1>
              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-700">
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
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-blue-700 bg-white px-6 py-3 font-black text-brand-blue-900 hover:bg-sky-50"
                >
                  View all Host Sites
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-slate-700">
                {[
                  '2,000 supervised hours',
                  'Paid on-the-job learning',
                  'Progress tracked in your portal',
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-700" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="relative min-h-[430px] bg-white sm:min-h-[560px] lg:min-h-[680px]">
            {slides.map((item, index) => (
              <Image
                key={item.src}
                src={item.src}
                alt={index === active ? item.alt : ''}
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 55vw, 100vw"
                className={`object-contain object-center transition-opacity duration-1000 ${index === active ? 'opacity-100' : 'opacity-0'}`}
                aria-hidden={index !== active}
              />
            ))}
            <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 rounded-full border border-slate-300 bg-white/95 p-1.5 text-slate-950 shadow-lg">
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Previous cosmetology image"
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100"
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
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100"
              >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Next cosmetology image"
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
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
