import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import { QUICK_STATS } from '../barber-program-data';

export function BarberHero() {
  return (
    <>
      {/* Hero — image only, no text on frame */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] overflow-hidden">
        <Image
          src="/images/pages/programs-barber-hero-new.jpg"
          alt="Barber apprentice cutting hair in a licensed barbershop"
          fill sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      {/* Headline — below the image frame */}
      <section className="pt-8 pb-2">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-2">Barber Apprenticeship Program</h1>
          <p className="text-slate-600 text-lg max-w-2xl">2,000-hour licensed training. Earn while you learn. Funding and payment options available.</p>
        </div>
      </section>

      {/* Waitlist Notice Banner */}
      <section className="bg-amber-50 border-y border-amber-300">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="font-bold text-amber-900 text-sm uppercase tracking-wide">Waitlist Open</span>
          </div>
          <p className="text-amber-800 text-sm leading-snug">
            Classes are scheduled to begin <strong>late May – early June 2025</strong>. We are currently gathering barbershops to participate as placement sites. You are on the waitlist — we will be in contact with next steps as soon as placements are confirmed.
          </p>
        </div>
      </section>

      {/* CTAs below hero */}
      <section className="py-6 border-b">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap gap-3">
            <a href="#program-overview" className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">
              Learn More <ArrowRight className="w-4 h-4" />
            </a>
            <Link href="/inquiry?subject=Barber+Apprenticeship" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">
              Join Waitlist <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-6 border-t">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {QUICK_STATS.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-white">{s.val}</div>
                <div className="text-slate-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 1 — Program Overview */}
      <section id="program-overview"className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Program Overview</h2>
              <p className="text-slate-700 leading-relaxed text-lg mb-6">
                The Barber Apprenticeship Program is a competency-based workforce training program designed to prepare participants for employment in the barbering industry through structured Related Technical Instruction (RTI) and supervised On-the-Job Training (OJT) in licensed barbershop environments. This program follows an apprenticeship-style training model combining classroom instruction, LMS-based modules, and real-world client service under licensed supervision.
              </p>
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  INTraining Program ID: #10004637 &middot; Provider: 2Exclusive LLC-S &middot; Location: Elevate for Humanity Training Center, Indianapolis, Indiana (Marion County)
                </p>
              </div>
            </div>
            <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/pages/programs-barber-training.jpg"
                alt="Barber apprentice training in licensed shop"
                fill sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
