import Link from 'next/link';
import Image from 'next/image';
import { Thermometer, ArrowRight } from 'lucide-react';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import PageAvatar from '@/components/PageAvatar';
import { QUICK_STATS } from '../hvac-program-data';

export function HvacHero() {
  return (
    <>
      <ProgramHeroBanner videoSrc="/videos/avatars/trades-guide.mp4" />

      {/* Hero */}
      <section className="relative h-[55vh] min-h-[400px]">
        <Image
          src="/images/trades/hero-program-hvac.jpg"
          alt="HVAC Technician Training Program"
          fill sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Thermometer className="w-4 h-4" /> Workforce Ready Grant Eligible
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
              HVAC Technician
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mb-6">
              A competency-based 20-week workforce training program in heating, ventilation, and air conditioning. Includes 6 industry credentials: EPA 608, Residential HVAC Cert 1 &amp; 2, OSHA 30, CPR, and Rise Up.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/apply/intake?program=hvac-technician" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105">
                Apply Now <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-full font-bold text-lg transition-all border border-white/40">
                Register at Indiana Career Connect
              </a>
            </div>
          </div>
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

      {/* Program Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Program Overview</h2>
              <p className="text-slate-700 leading-relaxed text-lg mb-4">
                The HVAC Technician program is a competency-based workforce training program designed to prepare participants for employment in the heating, ventilation, and air conditioning industry through structured Related Technical Instruction (RTI) and hands-on training with real HVAC systems.
              </p>
              <p className="text-slate-700 leading-relaxed text-lg mb-6">
                Graduates earn 6 industry-recognized credentials including EPA 608 Universal, Residential HVAC Certification 1 &amp; 2, OSHA 30, CPR, and Rise Up. This program is accredited and eligible for the Indiana Workforce Ready Grant.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  INTraining Program ID: #10004322 &middot; Provider: 2Exclusive LLC-S &middot; Location: Elevate for Humanity Training Center, Indianapolis, Indiana (Marion County) &middot; Program is accredited.
                </p>
              </div>
            </div>
            <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/programs-hq/hvac-technician.jpg"
                alt="HVAC training classroom with equipment"
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
