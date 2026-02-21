import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, Clock, Award, DollarSign, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Esthetician Apprenticeship | Skincare Training | Elevate for Humanity',
  description: 'Esthetician apprenticeship program in Indianapolis. 700-hour training in skincare, facials, and beauty services with licensure pathway.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/esthetician-apprenticeship' },
};

export default function EstheticianApprenticeshipPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Esthetician Apprenticeship' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[45vh] min-h-[320px] max-h-[500px]">
        <Image src="/images/programs-hq/healthcare-hero.jpg" alt="Esthetician performing skincare treatment" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3">Esthetician Apprenticeship</h1>
            <p className="text-lg text-white/90 max-w-2xl">700-hour skincare and beauty training with hands-on experience in licensed facilities.</p>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-6 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Clock, val: '700 Hours', label: 'Training Duration' },
              { icon: Award, val: 'State License', label: 'Credential Earned' },
              { icon: DollarSign, val: 'Funding Available', label: 'WIOA / JRI Eligible' },
              { icon: MapPin, val: 'Indianapolis', label: 'Location' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <s.icon className="w-5 h-5 text-brand-red-400" />
                <div className="text-xl font-bold text-white">{s.val}</div>
                <div className="text-slate-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-slate-900 mb-6">Program Overview</h2>
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                The Esthetician Apprenticeship prepares participants for Indiana state licensure through structured training in skincare science, facial treatments, hair removal, makeup application, and client consultation. Training combines classroom instruction with supervised hands-on practice in licensed facilities.
              </p>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                Indiana requires 700 hours of education for esthetician licensure. This program meets that requirement through a combination of Related Technical Instruction (RTI) and supervised On-the-Job Training (OJT).
              </p>
              <p className="text-slate-700 text-lg leading-relaxed">
                Graduates are eligible to sit for the PSI written examination administered by the Indiana Professional Licensing Agency (IPLA) Board of Cosmetology and Barber Examiners.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg mb-4">What You&apos;ll Learn</h3>
              <ul className="space-y-2">
                {[
                  'Skin analysis and consultation techniques',
                  'Facial treatments and protocols',
                  'Chemical peels and exfoliation',
                  'Hair removal (waxing, threading)',
                  'Makeup application and color theory',
                  'Sanitation and infection control',
                  'Business practices and client retention',
                  'Indiana state board exam preparation',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <span className="w-1.5 h-1.5 bg-brand-red-600 rounded-full flex-shrink-0 mt-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Funding */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Funding Options</h2>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-5 border border-slate-200 text-center">
              <h3 className="font-bold text-slate-900 mb-1">WIOA</h3>
              <p className="text-slate-600 text-sm">Covers tuition for eligible adults and dislocated workers</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 text-center">
              <h3 className="font-bold text-slate-900 mb-1">JRI</h3>
              <p className="text-slate-600 text-sm">Paid training for justice-involved individuals</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 text-center">
              <h3 className="font-bold text-slate-900 mb-1">Self-Pay / BNPL</h3>
              <p className="text-slate-600 text-sm">Payment plans and Klarna/Afterpay available</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Start Your Esthetician Career</h2>
          <p className="text-slate-300 text-lg mb-8">Apply today to check your eligibility for funded training.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply?program=professional-esthetician" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/pay" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-lg transition-colors border border-white/30">
              Payment Options
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
