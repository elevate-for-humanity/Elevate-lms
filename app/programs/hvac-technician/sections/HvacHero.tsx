import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import { QUICK_STATS } from '../hvac-program-data';

export function HvacHero() {
  return (
    <>
      {/* Hero Image */}
      <section className="relative h-[55vh] min-h-[400px]">
        <Image
          src="/images/trades/hero-program-hvac.jpg"
          alt="HVAC technician working on a residential air conditioning unit"
          fill sizes="100vw"
          className="object-cover"
          priority
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

      {/* Early CTA — right after stats */}
      <section className="py-10 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-white text-center sm:text-left">
            <h2 className="text-2xl md:text-3xl font-black">Ready to Start?</h2>
            <p className="text-white/80 mt-1">Workforce Ready Grant may cover full tuition. Check your eligibility.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/programs/hvac-technician/apply" className="inline-flex items-center gap-2 bg-white text-brand-red-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/support" className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-4 rounded-full font-bold border border-white/30 hover:bg-white/20 transition-all">
              <Phone className="w-4 h-4" /> Questions?
            </Link>
          </div>
        </div>
      </section>

      {/* Program Overview with images */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Program Overview</h2>
              <p className="text-slate-700 leading-relaxed text-lg mb-4">
                The HVAC Technician program prepares you for employment in heating, ventilation, and air conditioning through structured classroom instruction and hands-on training with real HVAC systems.
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
            <div className="space-y-4">
              <div className="relative h-64 rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/programs-hq/hvac-technician.jpg"
                  alt="HVAC training classroom with students working on equipment"
                  fill sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/images/trades/program-hvac-overview.jpg"
                  alt="HVAC technician inspecting a residential unit"
                  fill sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
