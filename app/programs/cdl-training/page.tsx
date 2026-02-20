
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import PageAvatar from '@/components/PageAvatar';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'CDL Training | Truck Driving School Indianapolis | Elevate',
  description: 'Get your Class A CDL in 4-8 weeks. CDL training in Indianapolis with funding available for qualifying students. Job placement assistance included.',
  alternates: { canonical: `${SITE_URL}/programs/cdl-training` },
  openGraph: {
    title: 'CDL Training | Truck Driving School Indianapolis',
    description: 'Get your Class A CDL in 4-8 weeks with job placement assistance.',
    url: `${SITE_URL}/programs/cdl-training`,
    images: [{ url: `${SITE_URL}/images/programs-hq/electrical.jpg`, width: 1200, height: 630 }],
  },
};

export default function CDLTrainingPage() {

  return (
    <>
    <ProgramStructuredData program={{
      id: 'cdl-training',
      name: 'CDL Commercial Driving Training',
      slug: 'cdl-training',
      description: 'Get your Class A CDL in 4-8 weeks. DOT-compliant training with job placement assistance. WIOA funding available.',
      duration_weeks: 8,
      price: 0,
      image_url: `${SITE_URL}/images/programs-hq/cdl-trucking.jpg`,
      category: 'Transportation',
      outcomes: ['Class A Commercial Driver License (CDL)', 'DOT Medical Card'],
    }} />
    <div className="min-h-screen bg-white">
      <ProgramHeroBanner videoSrc="/videos/cdl-hero.mp4" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Skilled Trades', href: '/programs/skilled-trades' }, { label: 'CDL Training' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/programs-hq/cdl-trucking.jpg" alt="CDL Training Program" fill sizes="100vw" className="object-cover" priority />
      </section>

      {/* Avatar Guide */}
      <section className="py-8 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <PageAvatar videoSrc="/videos/avatars/trades-guide.mp4" title="CDL Training Guide" />
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '4-8 Weeks', label: 'Program Length' },
            { val: 'Class A', label: 'CDL License' },
            { val: '$50K-$80K', label: 'Salary Range' },
            { val: '160+', label: 'Training Hours' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-lg sm:text-xl font-bold text-white">{s.val}</div>
              <div className="text-slate-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What You Learn + Image */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative w-full h-[200px] sm:w-72 sm:h-[280px] rounded-xl overflow-hidden flex-shrink-0">
              <Image src="/images/trades/program-cdl-commercial-driving.jpg" alt="CDL student training" fill sizes="100vw" className="object-cover" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">Behind-the-wheel training to pass your CDL exam and start driving.</p>
              <div className="space-y-2">
                {['Vehicle control, backing, and parking', 'Pre-trip inspection (DOT required)', 'Highway driving and traffic navigation', 'Air brake systems and emergency procedures', 'DOT regulations, hours of service, logbooks', 'Route planning and fuel management'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-blue-600 rounded-full flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Career Paths */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Career Paths</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: 'OTR Driver', salary: '$55K-$80K', desc: 'Long-haul cross-country' },
              { title: 'Regional Driver', salary: '$50K-$70K', desc: 'Multi-state routes' },
              { title: 'Local Driver', salary: '$45K-$60K', desc: 'Home daily' },
              { title: 'Owner-Operator', salary: '$100K+', desc: 'Run your own business' },
            ].map((c) => (
              <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                <div className="text-brand-blue-600 font-bold text-sm">{c.salary}</div>
                <p className="text-slate-500 text-xs mt-1">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring Companies */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Companies Hiring CDL Drivers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Werner Enterprises', 'Schneider', 'J.B. Hunt', 'Swift Transportation', 'FedEx Freight', 'UPS Freight', 'Amazon', 'Local Carriers'].map((e) => (
              <div key={e} className="bg-slate-50 rounded-lg px-4 py-3 text-slate-700 font-medium text-sm text-center">{e}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Requirements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {['21+ years old (interstate driving)', 'Valid driver\'s license', 'Clean driving record', 'Pass DOT physical exam', 'Pass drug screening', 'No DUI in past 5 years'].map((item) => (
              <div key={item} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                <span className="w-1.5 h-1.5 bg-brand-blue-600 rounded-full flex-shrink-0" />
                <span className="text-slate-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Enroll */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Enroll</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Apply Online', desc: 'Submit your student application.' },
              { step: '2', title: 'DOT Physical', desc: 'Pass the required medical exam.' },
              { step: '3', title: 'Get Your Permit', desc: 'Pass the CDL learner permit test.' },
              { step: '4', title: 'Start Training', desc: 'Begin behind-the-wheel training.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-slate-50 rounded-lg p-4">
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

      {/* CTA */}
      <section className="py-8 sm:py-14 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Trucking Career</h2>
          <p className="text-white mb-6 text-sm">Classes starting soon. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=cdl-training" className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center">
              Apply Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <Link href="/funding" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              Explore Funding Options
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
