import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Business & Entrepreneurship Programs | Elevate',
  description: 'Business and entrepreneurship training in Indianapolis. Tax preparation, financial services, and business startup programs.',
  alternates: { canonical: `${SITE_URL}/programs/business` },
  openGraph: {
    title: 'Business & Entrepreneurship Programs | Elevate',
    description: 'Tax preparation, financial services, and business startup programs in Indianapolis.',
    url: `${SITE_URL}/programs/business`,
    images: [{ url: `${SITE_URL}/images/hero/hero-business.jpg`, width: 1200, height: 630 }],
  },
};

export default function BusinessPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Business & Entrepreneurship' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/hero/hero-business.jpg" alt="Business & Entrepreneurship Programs" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Business Training</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Business &amp; Entrepreneurship</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Tax preparation, financial services, and business startup training. Learn to run your own business.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '4-8 Weeks', label: 'Program Length' },
            { val: 'IRS PTIN', label: 'Certification' },
            { val: '$30K-$80K+', label: 'Earning Potential' },
            { val: 'Own Business', label: 'Opportunity' },
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
            <Link href="/programs/tax-entrepreneurship" className="group">
              <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2">
                <Image src="/images/programs-hq/business-training.jpg" alt="Tax Prep & Entrepreneurship" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="50vw" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Tax Prep &amp; Entrepreneurship</h3>
              <p className="text-slate-500 text-xs">4-8 weeks — Start your own tax office</p>
            </Link>
            <Link href="/programs/tax-entrepreneurship" className="group">
              <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2">
                <Image src="/images/pathways/business-hero.jpg" alt="Business Startup" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="50vw" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Business Startup</h3>
              <p className="text-slate-500 text-xs">Business plan, marketing, and financial literacy</p>
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
              { step: '2', title: 'Complete Training', desc: 'Tax prep coursework and business fundamentals.' },
              { step: '3', title: 'Get Certified', desc: 'Earn your IRS PTIN and business certifications.' },
              { step: '4', title: 'Start Earning', desc: 'Work for a firm or open your own business.' },
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
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Business Career</h2>
          <p className="text-white/90 mb-6 text-sm">Learn tax prep and start your own business. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=business" className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center">
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
