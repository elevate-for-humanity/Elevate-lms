"use client";

import React from 'react';
// components/marketing/HeroCarousel.tsx

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type Slide = {
  id: number;
  label: string;
  title: string;
  highlight: string;
  body: string;
  image: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

const slides: Slide[] = [
  {
    id: 1,
    label: "Funded training · No debt",
    title: "Free career paths for real people.",
    highlight: "Healthcare, trades, CDL, barbering.",
    body: "Most learners qualify for $0 tuition through workforce grants and justice-aligned funding. We help with paperwork, approvals, and the hard parts.",
    image: "/media/programs/efh-cna-hero.jpg",
    primaryCtaLabel: "Check my eligibility",
    primaryCtaHref: "/apply",
    secondaryCtaLabel: "See all programs",
    secondaryCtaHref: "/programs",
  },
  {
    id: 2,
    label: "Re-entry & second chances",
    title: "From incarceration to income.",
    highlight: "Coaching + apprenticeships + employers.",
    body: "Barber, trades, and other pathways built specifically with re-entry in mind — structure, accountability, and real earning potential.",
    image: "/images/barber-hero.jpg",
    primaryCtaLabel: "Explore re-entry pathways",
    primaryCtaHref: "/reentry",
    secondaryCtaLabel: "Watch 2-minute story",
    secondaryCtaHref: "/videos/barber-reentry",
  },
  {
    id: 3,
    label: "Employers · Courts · Workforce",
    title: "An engine for talent pipelines.",
    highlight: "OJT · WEX · apprenticeships · JRI.",
    body: "Elevate plugs into courts, boards, and HR so funded training actually turns into staffed positions and measurable outcomes.",
    image: "/images/programs-hq/training-classroom.jpg",
    primaryCtaLabel: "Partner with Elevate",
    primaryCtaHref: "/employers",
    secondaryCtaLabel: "View employer one-pager",
    secondaryCtaHref: "/employers/resources",
  },
];

const AUTO_ROTATE_MS = 7000;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  // Au
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  const activeSlide = slides[index];

  const goTo = (i: number) => setIndex(i);
  const next = () => setIndex((prev) => (prev + 1) % slides.length);
  const prev = () =>
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0    " />
      <div className="relative mx-auto flex min-h-[72vh] max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:px-8">
        {/* LEFT: text / CTAs with animation */}
        <div className="max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-6"
            >
              <p className="inline-flex items-center rounded-full bg-brand-orange-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange-300 ring-1 ring-brand-orange-500/40">
                {activeSlide.label}
              </p>
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                {activeSlide.title}
                <span className="block text-brand-orange-300">
                  {activeSlide.highlight}
                </span>
              </h1>
              <p className="text-balance text-base text-zinc-100 sm:text-lg">
                {activeSlide.body}
              </p>

              {/* CTAs */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={activeSlide.primaryCtaHref}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-brand-orange-400 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-brand-orange-500/30 transition hover:-translate-y-0.5 hover:bg-brand-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    {activeSlide.primaryCtaLabel}
                  </Link>
                  <Link
                    href={activeSlide.secondaryCtaHref}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-zinc-500/60 px-6 py-3 text-sm font-semibold text-zinc-50 transition hover:-translate-y-0.5 hover:border-brand-orange-300 hover:bg-zinc-900"
                  >
                    {activeSlide.secondaryCtaLabel}
                  </Link>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-2 text-xs text-zinc-200 ring-1 ring-zinc-700">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange-400 text-[10px] font-bold text-zinc-950">
                    ★
                  </span>
                  <span>
                    Designed with workforce boards, courts, and employers — not
                    just a school in a silo.
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Rotating dot controls */}
          <div className="mt-6 flex items-center gap-3 text-xs text-zinc-400">
            <button
              type="button"
              onClick={prev}
              className="rounded-full border border-zinc-700 px-2 py-2 hover:border-brand-orange-300 hover:text-brand-orange-200"
            >
              ⟵
            </button>
            <div className="flex gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    i === index
                      ? "bg-brand-orange-400"
                      : "bg-zinc-700 hover:bg-zinc-500"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              className="rounded-full border border-zinc-700 px-2 py-2 hover:border-brand-orange-300 hover:text-brand-orange-200"
            >
              ⟶
            </button>
          </div>
        </div>

        {/* RIGHT: animated image panel */}
        <div className="flex-1">
          <div className="relative rounded-3xl bg-zinc-900/60 p-3 shadow-2xl ring-1 ring-zinc-700/80 backdrop-blur">
            <div className="relative aspect-video overflow-hidden rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide.image}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={activeSlide.image}
                    alt={activeSlide.title}
                    fill
                    priority
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Floating "live feel" strip */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-200">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-lime-400" />
                <span>Live cohorts forming now</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Use this hero for your QR codes, flyers, and social promos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
