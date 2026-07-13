'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Play } from 'lucide-react';

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
  primaryCta = { label: 'Apply Now', href: '/apply' },
  secondaryCta = { label: 'Learn More', href: '#program' },
  stats = [],
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[90vh] flex items-end overflow-hidden bg-white">
      {/* Background Media */}
      <div className="absolute inset-0">
        {heroVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster={heroImage}
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        ) : (
          <Image src={heroImage} alt={title} fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-20 w-full">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-amber-400 font-bold uppercase tracking-widest text-sm mb-4">
              {tagline}
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              {title}
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              {subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                href={primaryCta.href}
                className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors"
              >
                {primaryCta.label}
                <ArrowRight className="w-5 h-5" />
              </Link>
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl border border-white/30 transition-colors"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          </motion.div>

          {/* Stats */}
          {stats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-wrap gap-8 mt-12"
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
