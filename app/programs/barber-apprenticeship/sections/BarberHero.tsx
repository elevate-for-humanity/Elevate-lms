import Link from 'next/link';
import Image from 'next/image';
import { Award, Clock, BookOpen, DollarSign, ArrowRight } from 'lucide-react';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import PageAvatar from '@/components/PageAvatar';
import { QUICK_STATS } from '../barber-program-data';

export function BarberHero() {
  return (
    <>
      {/* Avatar Guide Video */}
      <ProgramHeroBanner videoSrc="/videos/barber-hero-final.mp4" />

      {/* Hero */}
      <section className="relative h-[55vh] min-h-[400px]">
        <Image
          src="/images/barber-hero-new.jpg"
          alt="Barber Apprenticeship training program"
          fill sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Award className="w-4 h-4" /> Earn While You Learn &middot; Licensure Pathway
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
              Barber Apprenticeship
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mb-6">
              A competency-based 2,000-hour apprenticeship program with licensed shop training, structured RTI, and a pathway toward Indiana barber licensure.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/apply?program=barber-apprenticeship" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105">
                Apply Now <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-full font-bold text-lg transition-all border border-white/40">
                Register at Indiana Career Connect
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Program Overview Video */}
      <section className="py-8 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <PageAvatar videoSrc="/videos/avatars/barber-guide.mp4" title="Barber Apprenticeship Program Overview" />
        </div>
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
