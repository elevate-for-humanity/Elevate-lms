'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, CheckCircle } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

const ROTATING_OUTCOMES = [
  'CNA earning $38K in 6 weeks',
  'CDL driver earning $65K in 8 weeks',
  'HVAC tech earning $52K in 12 weeks',
  'IT support earning $45K in 10 weeks',
  'Welder earning $48K in 14 weeks',
];

export default function HeroSection() {
  const [outcomeIndex, setOutcomeIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setOutcomeIndex(prev => (prev + 1) % ROTATING_OUTCOMES.length);
        setFade(true);
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[85vh] flex items-center bg-slate-950 overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          poster="/images/hero-banner-new.jpg"
        >
          <source src="/videos/hero-loop.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <div className="max-w-3xl">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-8">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-white/80">ETPL-Approved &middot; WIOA Funded &middot; Indiana DWD Partner</span>
          </div>

          {/* Outcome-first headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.05] mb-6">
            Train for a career<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue-400 via-brand-blue-300 to-emerald-400">
              that changes everything.
            </span>
          </h1>

          {/* Rotating outcome proof */}
          <div className="h-8 mb-8">
            <p
              className="text-xl text-white/60 transition-opacity duration-300"
              style={{ opacity: fade ? 1 : 0 }}
            >
              Right now, someone is becoming a{' '}
              <span className="text-white font-semibold">{ROTATING_OUTCOMES[outcomeIndex]}</span>
            </p>
          </div>

          {/* Objection neutralizers */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-10 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400/70" />
              $0 tuition for eligible students
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400/70" />
              6–16 weeks to credential
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400/70" />
              85% job placement rate
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              href="/wioa-eligibility"
              className="inline-flex items-center justify-center gap-3 bg-white text-slate-900 font-bold text-lg px-10 py-5 rounded-2xl hover:bg-slate-100 transition-all shadow-2xl shadow-white/10 hover:shadow-white/20 hover:-translate-y-0.5 group"
            >
              Check Eligibility — 60 Seconds
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center gap-3 border-2 border-white/20 text-white font-semibold text-lg px-10 py-5 rounded-2xl hover:bg-white/5 transition-all"
            >
              <Play className="w-5 h-5" />
              Browse Programs
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">
                <AnimatedCounter end={85} suffix="%" />
              </p>
              <p className="text-sm text-white/40 mt-1">Placement rate</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">
                <AnimatedCounter end={42} prefix="$" suffix="K" />
              </p>
              <p className="text-sm text-white/40 mt-1">Avg starting salary</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">
                <AnimatedCounter end={0} suffix=" cost" prefix="$" />
              </p>
              <p className="text-sm text-white/40 mt-1">For eligible students</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
