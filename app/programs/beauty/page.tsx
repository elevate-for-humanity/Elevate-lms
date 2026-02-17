import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Beauty & Cosmetology Programs | Elevate',
  description: 'Beauty and cosmetology training in Indianapolis. Cosmetology apprenticeship, nail technician, esthetician. Earn while you learn.',
  alternates: { canonical: `${SITE_URL}/programs/beauty` },
  openGraph: {
    title: 'Beauty & Cosmetology Programs | Indianapolis',
    description: 'Cosmetology, nail technician, and esthetician training with apprenticeship options.',
    url: `${SITE_URL}/programs/beauty`,
    images: [{ url: `${SITE_URL}/images/beauty/program-beauty-training.jpg`, width: 1400, height: 788 }],
  },
};

export default function BeautyPage() {
  return (
    <div className="min-h-screen bg-white">
      <ProgramHeroBanner videoSrc="/videos/cosmetology-salon.mp4" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Beauty & Cosmetology' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/beauty/program-beauty-training.jpg" alt="Beauty & Cosmetology Programs" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Apprenticeships Available</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Beauty &amp; Cosmetology</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Cosmetology, nail technician, and esthetician programs. Apprenticeship options let you earn while you learn.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '6-18 Months', label: 'Program Length' },
            { val: 'State License', label: 'Certification' },
            { val: '$25K-$60K+', label: 'Earning Potential' },
            { val: 'Flexible', label: 'Schedule' },
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Choose Your Path</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'Cosmetology Apprenticeship', href: '/programs/cosmetology-apprenticeship', img: '/images/efh/programs/beauty.jpg', duration: '18 months' },
              { name: 'Nail Technician', href: '/programs/nail-technician-apprenticeship', img: '/images/pathways/beauty-hero.jpg', duration: '6-9 months' },
              { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship', img: '/images/hero/hero-barber.jpg', duration: '18 months' },
            ].map((p) => (
              <Link key={p.name} href={p.href} className="group">
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2">
                  <Image src={p.img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 33vw" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                <p className="text-slate-500 text-xs">{p.duration}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Career Outcomes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { title: 'Cosmetologist', salary: '$28K-$50K' },
              { title: 'Nail Technician', salary: '$25K-$40K' },
              { title: 'Esthetician', salary: '$30K-$50K' },
              { title: 'Salon Owner', salary: '$50K-$100K+' },
              { title: 'Beauty Educator', salary: '$35K-$55K' },
              { title: 'Booth Rental', salary: '$35K-$60K+' },
            ].map((c) => (
              <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                <div className="text-brand-red-600 font-bold text-sm">{c.salary}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Enroll</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Apply Online', desc: 'Submit your student application.' },
              { step: '2', title: 'Choose Your Program', desc: 'Cosmetology, nail tech, or barber apprenticeship.' },
              { step: '3', title: 'Start Training', desc: 'Hands-on instruction in a real salon environment.' },
              { step: '4', title: 'Get Licensed', desc: 'Pass your Indiana State Board exam.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-slate-50 rounded-lg p-4">
                <div className="w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-brand-red-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Beauty Career</h2>
          <p className="text-white mb-6 text-sm">Earn while you learn with apprenticeship options. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=beauty" className="bg-white text-brand-red-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-red-50 transition-colors text-center">
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
