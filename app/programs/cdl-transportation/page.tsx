import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'CDL & Transportation Programs | Elevate',
  description: 'CDL and transportation training in Indianapolis. Class A CDL, delivery driver, and logistics training. Funding available.',
  alternates: { canonical: `${SITE_URL}/programs/cdl-transportation` },
  openGraph: {
    title: 'CDL & Transportation Programs | Indianapolis',
    description: 'CDL training, delivery driver, and logistics career programs.',
    url: `${SITE_URL}/programs/cdl-transportation`,
    images: [{ url: `${SITE_URL}/images/programs-hq/hvac-technician.jpg`, width: 1200, height: 630 }],
  },
};

export default function CDLTransportationPage() {
  return (
    <div className="min-h-screen bg-white">
      <ProgramHeroBanner videoSrc="/videos/cdl-hero.mp4" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'CDL & Transportation' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/programs-hq/cdl-trucking.jpg" alt="CDL & Transportation Programs" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Funding Available</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">CDL &amp; Transportation</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Class A CDL, delivery driver, and logistics training. Start earning $50K+ in weeks.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '4-8 Weeks', label: 'CDL Training' },
            { val: 'Class A/B', label: 'CDL License' },
            { val: '$50K-$80K', label: 'Salary Range' },
            { val: 'Nationwide', label: 'Job Market' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-lg sm:text-xl font-bold text-white">{s.val}</div>
              <div className="text-slate-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Programs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/programs/cdl-training" className="group">
              <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2">
                <Image src="/images/programs-hq/cdl-trucking.jpg" alt="CDL Training" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="50vw" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">CDL Training (Class A)</h3>
              <p className="text-slate-500 text-xs">4-8 weeks — $50K-$80K salary range</p>
            </Link>
            <Link href="/programs/diesel-mechanic" className="group">
              <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2">
                <Image src="/images/transportation/hero-program-automotive.jpg" alt="Diesel Mechanic" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="50vw" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Diesel Mechanic</h3>
              <p className="text-slate-500 text-xs">12-16 weeks — $42K-$65K salary range</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Enroll</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Apply Online', desc: 'Submit your student application.' },
              { step: '2', title: 'Check Funding', desc: 'Register at indianacareerconnect.com for WIOA/JRI eligibility.' },
              { step: '3', title: 'Start Training', desc: 'Behind-the-wheel or shop instruction.' },
              { step: '4', title: 'Get Licensed & Hired', desc: 'Pass your CDL exam and connect with employers.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-white rounded-lg p-4">
                <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Transportation Career</h2>
          <p className="text-white mb-6 text-sm">High demand nationwide. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=cdl-transportation" className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center">
              Apply Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <Link href="/funding" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              Explore Funding Options
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
