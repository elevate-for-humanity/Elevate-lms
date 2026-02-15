import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import PageAvatar from '@/components/PageAvatar';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Barber Apprenticeship | Earn While You Learn | Elevate',
  description: 'Barber apprenticeship in Indianapolis. Earn while you learn — get paid during training. Licensed barber in 18 months. JRI funding available.',
  alternates: { canonical: `${SITE_URL}/programs/barber-apprenticeship` },
  openGraph: {
    title: 'Barber Apprenticeship | Earn While You Learn',
    description: 'Get paid during your barber apprenticeship. Licensed in 18 months.',
    url: `${SITE_URL}/programs/barber-apprenticeship`,
    images: [{ url: `${SITE_URL}/images/barber-hero-new.jpg`, width: 1200, height: 630 }],
  },
};

export default function BarberApprenticeshipPage() {
  return (
    <div className="min-h-screen bg-white">
      <ProgramHeroBanner videoSrc="/videos/barber-hero-final.mp4" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Barber Apprenticeship' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/barber-hero-new.jpg" alt="Barber Apprenticeship Program" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Earn While You Learn</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Barber Apprenticeship</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Get paid during your apprenticeship. Become a licensed barber in 18 months with hands-on training.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <PageAvatar videoSrc="/videos/avatars/barber-guide.mp4" title="Barber Apprenticeship Guide" />
        </div>
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '18 Months', label: 'Apprenticeship' },
            { val: 'State License', label: 'Barber License' },
            { val: '$30K-$60K+', label: 'Earning Potential' },
            { val: 'Paid', label: 'During Training' },
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
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative w-full h-[200px] sm:w-72 sm:h-[280px] rounded-xl overflow-hidden flex-shrink-0">
              <Image src="/images/hero/hero-barber.jpg" alt="Barber training" fill className="object-cover" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">Hands-on training in a real barbershop environment under a licensed instructor.</p>
              <div className="space-y-2">
                {['Haircutting techniques (fades, tapers, lineups)', 'Clipper and shear mastery', 'Shaving and beard grooming', 'Sanitation and safety (Indiana State Board)', 'Client consultation and customer service', 'Business management and booth rental basics', 'Indiana barber license exam preparation'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-red-600 rounded-full flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Career Paths</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: 'Shop Barber', salary: '$30K-$50K', desc: 'Work at an established shop' },
              { title: 'Booth Rental', salary: '$40K-$60K+', desc: 'Rent your own chair' },
              { title: 'Shop Owner', salary: '$60K-$100K+', desc: 'Open your own barbershop' },
              { title: 'Instructor', salary: '$35K-$55K', desc: 'Teach the next generation' },
            ].map((c) => (
              <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                <div className="text-brand-red-600 font-bold text-sm">{c.salary}</div>
                <p className="text-slate-500 text-xs mt-1">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How It Works</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Apply Online', desc: 'Submit your apprenticeship application.' },
              { step: '2', title: 'Get Matched', desc: 'Paired with a licensed barber instructor at a real shop.' },
              { step: '3', title: 'Earn While You Learn', desc: 'Get paid while completing your 1,500 training hours.' },
              { step: '4', title: 'Get Licensed', desc: 'Pass the Indiana State Board barber exam.' },
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
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Barber Career</h2>
          <p className="text-white/90 mb-6 text-sm">Earn while you learn. JRI funding available for qualifying students.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=barber-apprenticeship" className="bg-white text-brand-red-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-red-50 transition-colors text-center">
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
