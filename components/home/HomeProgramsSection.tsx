'use client';

import Link from 'next/link';
import Image from 'next/image';
import { programs } from '@/app/data/programs';

export default function HomeProgramsSection() {
  const featured = programs;

  return (
    <section className="bg-white py-12 sm:py-16 md:py-20 lg:py-12 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="mb-6 sm:mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-orange-500">
              Elevate For Humanity
            </p>
            <h2 className="mt-1 text-3xl sm:text-4xl md:text-5xl font-bold text-black">
              Training programs for real careers
            </h2>
            <p className="mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-black">
              Skilled trades, healthcare, and transportation
            </p>
          </div>
          <Link
            href="/programs"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-black hover:bg-slate-100 whitespace-nowrap"
          >
            View all programs
          </Link>
        </div>

        <div className="grid gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((program) => (
            <article
              key={program.slug}
              className="group flex h-full flex-col overflow-hidden rounded-lg bg-white border border-slate-200 transition hover:shadow-lg"
            >
              {/* Image */}
              <div className="relative h-48 sm:h-52 md:h-56 w-full bg-slate-50">
                {program.heroImage ? (
                  <Image
                    src={program.heroImage}
                    alt={program.heroImageAlt || program.name}
                    fill
                    className="object-cover brightness-105 transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    Program image Available Now
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-semibold text-black">
                  {program.name}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-black">
                  {program.shortDescription}
                </p>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>Workforce-ready training</span>
                  <span className="flex items-center gap-1 font-semibold text-brand-orange-600">
                    Learn more <span aria-hidden>→</span>
                  </span>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
                  <Link
                    href={`/programs/${program.slug}`}
                    className="inline-flex items-center justify-center rounded-full bg-brand-orange-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-brand-orange-600 min-h-[44px]"
                  >
                    View program
                  </Link>
                  <Link
                    href={`/apply?program=${encodeURIComponent(program.slug)}`}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs sm:text-sm font-semibold text-black hover:bg-slate-100 min-h-[44px]"
                  >
                    Start application
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
