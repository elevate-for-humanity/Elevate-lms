import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { QUICK_STATS } from '../barber-program-data';

export function BarberHero() {
  return (
    <>
      {/* Hero Video Banner */}
      <ProgramHeroBanner videoSrc="/videos/barber-hero-final.mp4" />

      {/* Hero Image — no text overlay */}
      <section className="relative h-[55vh] min-h-[400px]">
        <Image
          src="/images/barber-hero-new.webp"
          alt="Barber apprentice cutting hair in a licensed barbershop"
          fill sizes="100vw"
          className="object-cover"
          priority quality={90}
        />
      </section>

      {/* Quick Stats */}
      <section className="py-6 bg-slate-900">
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
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Program Overview</h2>
              <p className="text-slate-700 leading-relaxed text-lg mb-6">
                The Barber Apprenticeship Program is a competency-based workforce training program designed to prepare participants for employment in the barbering industry through structured Related Technical Instruction (RTI) and supervised On-the-Job Training (OJT) in licensed barbershop environments. This program follows an apprenticeship-style training model combining classroom instruction, LMS-based modules, and real-world client service under licensed supervision.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  INTraining Program ID: #10004637 &middot; Provider: 2Exclusive LLC-S &middot; Location: Elevate for Humanity Training Center, Indianapolis, Indiana (Marion County)
                </p>
              </div>
            </div>
            <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/programs-hq/barber-training.jpg"
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
