'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { SafeHeroVideo } from '@/components/hero/SafeHeroVideo';

interface HeroSectionProps {
  title: string;
  tagline: string;
  subtitle: string;
  heroVideo?: string;
  heroImage: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  stats?: Array<{ value: string; label: string }>;
}

export function HeroSection({
  title,
  tagline,
  subtitle,
  heroVideo,
  heroImage,
  primaryCta = { label: 'Apply Now', href: '/apply/student' },
  secondaryCta = { label: 'Learn More', href: '#program' },
  stats = [],
}: HeroSectionProps) {
  return (
    <section className="overflow-hidden bg-white">
      <div className="relative h-[clamp(220px,42vw,520px)] w-full overflow-hidden bg-slate-100">
        {heroVideo ? (
          <SafeHeroVideo
            src={heroVideo}
            poster={heroImage}
            className="absolute inset-0 h-full w-full object-cover"
            ariaLabel={`${title} program overview video`}
          />
        ) : (
          <Image src={heroImage} alt={`${title} training`} fill className="object-cover" priority sizes="100vw" />
        )}
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl"
        >
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
            {tagline}
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-slate-950 md:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg font-medium leading-8 text-slate-700 md:text-xl">
            {subtitle}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={primaryCta.href}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-7 py-3 font-extrabold text-white hover:bg-brand-red-700"
            >
              {primaryCta.label}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-7 py-3 font-bold text-slate-950 hover:bg-slate-50"
              >
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </motion.div>

        {stats.length > 0 ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={`${title} program facts`}>
            {stats.map((stat) => (
              <div key={`${stat.label}-${stat.value}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-2xl font-black text-slate-950">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{stat.label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default HeroSection;
