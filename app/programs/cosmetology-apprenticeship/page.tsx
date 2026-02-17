import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Cosmetology Apprenticeship | Earn While You Learn | Elevate',
  description: 'Cosmetology apprenticeship in Indianapolis. Earn while you learn. Get your Indiana cosmetology license in 18 months.',
  alternates: { canonical: `${SITE_URL}/programs/cosmetology-apprenticeship` },
  openGraph: {
    title: 'Cosmetology Apprenticeship | Earn While You Learn',
    description: 'Get paid during your cosmetology apprenticeship. Licensed in 18 months.',
    url: `${SITE_URL}/programs/cosmetology-apprenticeship`,
    images: [{ url: `${SITE_URL}/images/beauty/hero-program-cosmetology.jpg`, width: 1920, height: 1080 }],
  },
};

export default function CosmetologyApprenticeshipPage() {
  return (
    <div className="min-h-screen bg-white">
      <ProgramHeroBanner videoSrc="/videos/cosmetology-salon.mp4" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Beauty', href: '/programs/beauty' }, { label: 'Cosmetology Apprenticeship' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/beauty/hero-program-cosmetology.jpg" alt="Cosmetology Apprenticeship" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Earn While You Learn</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Cosmetology Apprenticeship</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Get paid during your apprenticeship. Become a licensed cosmetologist in 18 months with hands-on salon training.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '18 Months', label: 'Apprenticeship' },
            { val: 'State License', label: 'Cosmetology' },
            { val: '$28K-$50K+', label: 'Earning Potential' },
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
              <Image src="/images/beauty/program-beauty-training.jpg" alt="Cosmetology training" fill sizes="100vw" className="object-cover" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">Hands-on training in a real salon under a licensed instructor.</p>
              <div className="space-y-2">
                {['Hair cutting, coloring, and styling', 'Chemical services (perms, relaxers)', 'Skin care and facial treatments', 'Nail care and manicure/pedicure', 'Sanitation and infection control', 'Client consultation and salon management', 'Indiana State Board exam preparation'].map((item) => (
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
              { title: 'Salon Stylist', salary: '$28K-$45K' },
              { title: 'Booth Rental', salary: '$35K-$60K+' },
              { title: 'Salon Owner', salary: '$50K-$100K+' },
              { title: 'Beauty Educator', salary: '$35K-$55K' },
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
              { step: '1', title: 'Apply Online', desc: 'Submit your apprenticeship application.' },
              { step: '2', title: 'Get Matched', desc: 'Paired with a licensed cosmetology instructor at a salon.' },
              { step: '3', title: 'Earn While You Learn', desc: 'Get paid while completing your training hours.' },
              { step: '4', title: 'Get Licensed', desc: 'Pass the Indiana State Board cosmetology exam.' },
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
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Cosmetology Career</h2>
          <p className="text-white/90 mb-6 text-sm">Earn while you learn. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=cosmetology-apprenticeship" className="bg-white text-brand-red-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-red-50 transition-colors text-center">
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
