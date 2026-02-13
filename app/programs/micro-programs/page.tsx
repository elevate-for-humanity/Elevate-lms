import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Micro Programs | Short-Term Certifications | Elevate',
  description: 'Short-term certification programs in Indianapolis. CPR, First Aid, sanitation, food handler, and more. Get certified in days, not months.',
  alternates: { canonical: `${SITE_URL}/programs/micro-programs` },
};

export default function MicroProgramsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Micro Programs' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/hero/hero-certifications.jpg" alt="Micro Programs" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Quick Certifications</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Micro Programs</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Short-term certifications you can complete in days. CPR, First Aid, sanitation, food handler, and more.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Available Certifications</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { name: 'CPR & First Aid', href: '/programs/cpr-first-aid-hsi', img: '/images/programs/cpr-group-training-hd.jpg', duration: '1 day' },
              { name: 'Sanitation & Infection Control', href: '/programs/sanitation-infection-control', img: '/images/healthcare/emergency-safety.jpg', duration: '1-2 weeks' },
              { name: 'Food Handler', href: '/programs/culinary-apprenticeship', img: '/images/culinary/program-culinary-overview.jpg', duration: '1 day' },
              { name: 'OSHA 10/30', href: '/programs/skilled-trades', img: '/images/trades/program-building-construction.jpg', duration: '1-4 days' },
              { name: 'Forklift Certification', href: '/programs/skilled-trades', img: '/images/trades/hero-program-carpentry.jpg', duration: '1 day' },
              { name: 'Bloodborne Pathogens', href: '/programs/sanitation-infection-control', img: '/images/healthcare/hero-programs-healthcare.jpg', duration: '1 day' },
            ].map((p) => (
              <Link key={p.name} href={p.href} className="group">
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2">
                  <Image src={p.img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 33vw" />
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Enroll</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Choose Your Certification', desc: 'Pick the certification you need.' },
              { step: '2', title: 'Register Online', desc: 'Sign up for an available class date.' },
              { step: '3', title: 'Attend Class', desc: 'Complete the in-person training.' },
              { step: '4', title: 'Get Certified', desc: 'Receive your certification same day or within a week.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-white rounded-lg p-4">
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
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Get Certified Fast</h2>
          <p className="text-white/90 mb-6 text-sm">Same-day certifications available. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=micro-programs" className="bg-white text-brand-red-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-red-50 transition-colors text-center">
              Apply Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <Link href="/programs" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              View All Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
