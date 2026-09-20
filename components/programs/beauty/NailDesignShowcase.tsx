'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const slides = [
  {
    src: '/images/programs/cosmetology/nail-art-bedazzled.webp',
    alt: 'Long coffin nails with crystal accents and fine black line art',
    eyebrow: 'Learn new designs',
    title: 'Turn creative ideas into polished nail art',
    description:
      'Explore current design techniques including clean shaping, fine line work, encapsulated details, crystal placement, and balanced finishing.'
  },
  {
    src: '/images/programs/cosmetology/nail-art-gemstone.webp',
    alt: 'Short sculpted nails with colorful line art and gemstone accents',
    eyebrow: '14 years of teaching experience',
    title: 'Learn with JoZanna',
    description:
      'JoZanna brings 14 years of experience teaching nail techniques and design, helping students understand each step and build skills with confidence.'
  },
  {
    src: '/images/programs/cosmetology/nail-art-crystal-lines.webp',
    alt: 'Crystal-covered and line-art coffin nails in a coordinated set',
    eyebrow: 'Technique meets creativity',
    title: 'Learn the “why” behind every design',
    description:
      'JoZanna connects inspiration to repeatable technique—from preparation and product control to symmetry, safe application, and professional finishing.'
  },
  {
    src: '/images/programs/cosmetology/nail-art-gold.webp',
    alt: 'Long neutral nails decorated with gold leaf and iridescent crystals',
    eyebrow: 'Build your confidence',
    title: 'Practice new looks and develop your own style',
    description:
      'Strengthen your eye for detail while building a portfolio, safe sanitation habits, and the client-service skills expected in a professional salon.'
  },
] as const;

export default function NailDesignShowcase({ asHero = false }: { asHero?: boolean }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  const select = (index: number) => {
    setActive((index + slides.length) % slides.length);
  };

  return (
    <section className={`overflow-hidden bg-gradient-to-b from-rose-50 via-white to-white px-4 ${asHero ? 'pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8' : 'py-12 sm:px-6 sm:py-16'}`}>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2 text-sm font-black text-rose-800">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Hands-on beauty skills
          </div>
          {asHero ? (
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Cosmetology Apprenticeship: learn in a real salon
            </h1>
          ) : (
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Learn nail design, artistry, and more
            </h2>
          )}
          <p className="mt-4 text-base font-medium leading-7 text-slate-700 sm:text-lg">
            Learn new nail designs and professional techniques with guidance shaped by JoZanna’s
            14 years of teaching experience, plus paid, supervised practice at an approved Host Salon.
          </p>
        </div>

        <div
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-rose-200 bg-slate-950 shadow-2xl"
          aria-roledescription="carousel"
          aria-label="Nail design learning showcase"
        >
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="relative aspect-[2/3] min-h-[28rem] w-full bg-slate-900 lg:min-h-[38rem]">
              {slides.map((slide, index) => (
                <Image
                  key={slide.src}
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1023px) 100vw, 44vw"
                  className={`object-contain transition-opacity duration-700 ${
                    index === active ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                  aria-hidden={index !== active}
                />
              ))}
            </div>

            <div className="flex min-w-0 flex-col justify-center bg-slate-950 p-6 text-white sm:p-10 lg:p-12">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-rose-300">
                {slides[active].eyebrow}
              </p>
              <h3 className="mt-3 text-2xl font-black leading-tight sm:text-4xl">
                {slides[active].title}
              </h3>
              <p className="mt-5 text-base font-medium leading-7 text-slate-300 sm:text-lg">
                {slides[active].description}
              </p>
              <p className="mt-5 text-sm leading-6 text-slate-400">
                Instruction and supervised practice vary by training phase, placement, and
                applicable licensing requirements.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/programs/cosmetology-apprenticeship/apply"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-rose-600 px-6 py-3 font-black text-white transition hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Apply for Cosmetology
                </Link>
                <Link
                  href="/programs/nail-technician-apprenticeship"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-400 px-6 py-3 font-black text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Explore Nail Technician
                </Link>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => select(active - 1)}
            aria-label="Show previous nail design"
            className="absolute left-3 top-[14rem] inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:top-1/2 lg:-translate-y-1/2"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => select(active + 1)}
            aria-label="Show next nail design"
            className="absolute right-3 top-[14rem] inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:top-1/2 lg:-translate-y-1/2"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 flex justify-center gap-2" aria-label="Choose a nail design slide">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => select(index)}
              aria-label={`Show slide ${index + 1}: ${slide.title}`}
              aria-current={index === active ? 'true' : undefined}
              className={`h-3 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 ${
                index === active ? 'w-9 bg-rose-600' : 'w-3 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
