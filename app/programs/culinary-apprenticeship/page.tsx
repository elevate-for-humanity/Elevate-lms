import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Culinary Apprenticeship | Earn While You Learn | Elevate',
  description: 'Culinary apprenticeship in Indianapolis. Earn while you learn in a professional kitchen. Food handler certification included.',
  alternates: { canonical: `${SITE_URL}/programs/culinary-apprenticeship` },
  openGraph: {
    title: 'Culinary Apprenticeship | Earn While You Learn',
    description: 'Get paid during your culinary apprenticeship. Professional kitchen training.',
    url: `${SITE_URL}/programs/culinary-apprenticeship`,
    images: [{ url: `${SITE_URL}/images/culinary/hero-program-culinary.jpg`, width: 1200, height: 630 }],
  },
};

export default function CulinaryApprenticeshipPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Culinary Apprenticeship' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/culinary/hero-program-culinary.jpg" alt="Culinary Apprenticeship" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Earn While You Learn</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Culinary Apprenticeship</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Get paid while training in a professional kitchen. Food handler and ServSafe certification included.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '6-12 Months', label: 'Apprenticeship' },
            { val: 'ServSafe', label: 'Certification' },
            { val: '$28K-$50K', label: 'Salary Range' },
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
              <Image src="/images/culinary/program-culinary-arts-training.jpg" alt="Culinary training" fill sizes="100vw" className="object-cover" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">Hands-on training in a professional kitchen environment.</p>
              <div className="space-y-2">
                {['Food preparation and cooking techniques', 'Kitchen safety and sanitation (ServSafe)', 'Menu planning and food costing', 'Knife skills and equipment operation', 'Baking and pastry fundamentals', 'Food presentation and plating'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-orange-500 rounded-full flex-shrink-0" />
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
              { title: 'Line Cook', salary: '$28K-$38K' },
              { title: 'Sous Chef', salary: '$35K-$50K' },
              { title: 'Head Chef', salary: '$45K-$70K' },
              { title: 'Restaurant Owner', salary: '$50K-$100K+' },
            ].map((c) => (
              <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                <div className="text-brand-orange-500 font-bold text-sm">{c.salary}</div>
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
              { step: '2', title: 'Get Placed', desc: 'Matched with a professional kitchen for training.' },
              { step: '3', title: 'Earn While You Learn', desc: 'Get paid while completing your training hours.' },
              { step: '4', title: 'Get Certified', desc: 'Earn your ServSafe and food handler certifications.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-slate-50 rounded-lg p-4">
                <div className="w-8 h-8 bg-brand-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-brand-orange-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Culinary Career</h2>
          <p className="text-white mb-6 text-sm">Earn while you learn in a professional kitchen. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=culinary-apprenticeship" className="bg-white text-brand-orange-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-orange-50 transition-colors text-center">
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
