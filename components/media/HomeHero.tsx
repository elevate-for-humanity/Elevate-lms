"use client";

import React from 'react';

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HeroImage } from "@/lms-data/media";

interface HomeHeroProps {
  images: HeroImage[];
}

export function HomeHero({ images }: HomeHeroProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 8000);
    return () => clearInterval(id);
  }, [images.length]);

  const current = images[index];

  return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-3 py-4 md:px-4 md:py-6">
        {/* IMAGE ON TOP FOR MOBILE */}
        <div className="md:hidden">
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-white aspect-[4/3]">
              <Image
                src={current.src}
                alt={current.alt}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.3fr,1.7fr] md:items-center">
          {/* TEXT SIDE */}
          <div className="space-y-3 text-white">
            {current.badge && (
              <span className="inline-flex items-center rounded-full bg-brand-orange-500/15 px-3 py-2 text-[11px] font-semibold text-brand-orange-300">
                {current.badge}
              </span>
            )}
            <h1 className="text-xl font-bold leading-snug md:text-3xl">
              {current.headline}
            </h1>
            <p className="text-xs text-slate-200 md:text-sm">
              {current.subheadline}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {current.ctaHref && current.ctaLabel && (
                <Link
                  href={current.ctaHref}
                  className="rounded-md bg-brand-orange-500 px-4 py-2 font-semibold text-white shadow-sm hover:bg-brand-orange-600"
                >
                  {current.ctaLabel}
                </Link>
              )}
              <Link
                href="/funding"
                className="rounded-md border border-slate-600 px-4 py-2 font-semibold text-slate-100 hover:bg-slate-800"
              >
                See Funding & Stipends
              </Link>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              JRI, WRG, WEX, OJT, apprenticeships, and employer sponsorship are
              braided together so you can focus on learning and earning.
            </p>
          </div>

          {/* IMAGE SIDE FOR DESKTOP / TABLET */}
          <div className="relative hidden md:block">
            <div className="relative h-full w-full max-w-xl md:ml-auto">
              <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-white aspect-[16/9]">
                <Image
                  src={current.src}
                  alt={current.alt}
                  fill
                  sizes="(max-width: 1024px) 60vw, 40vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE DOTS */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 pb-2">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setIndex(i)}
                className={
                  "h-1.5 w-6 rounded-full " +
                  (i === index ? "bg-brand-orange-500" : "bg-slate-700")
                }
                aria-label={`Show hero image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
