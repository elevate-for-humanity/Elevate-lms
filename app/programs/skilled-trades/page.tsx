import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Skilled Trades Training | HVAC, Electrical, Welding, Plumbing | Elevate',
  description: 'Skilled trades training in Indianapolis. HVAC, Electrical, Welding, Plumbing, and CDL. Hands-on training with job placement. Funding available.',
  alternates: { canonical: `${SITE_URL}/programs/skilled-trades` },
  openGraph: {
    title: 'Skilled Trades Training | Indianapolis',
    description: 'HVAC, Electrical, Welding, Plumbing — hands-on training with real job placement.',
    url: `${SITE_URL}/programs/skilled-trades`,
    images: [{ url: `${SITE_URL}/images/trades/hero-program-hvac.jpg`, width: 1200, height: 630 }],
  },
};

export default function SkilledTradesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Skilled Trades' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/trades/hero-program-hvac.jpg" alt="Skilled Trades Training" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Funding Available</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Skilled Trades</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              HVAC, Electrical, Welding, Plumbing, and CDL. Hands-on training with real job placement assistance.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '4-16 Weeks', label: 'Program Length' },
            { val: 'Industry Certs', label: 'Included' },
            { val: '$40K-$80K', label: 'Salary Range' },
            { val: '5+', label: 'Trade Paths' },
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Choose Your Trade</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { name: 'HVAC Technician', href: '/programs/hvac', img: '/images/trades/hero-program-hvac.jpg', duration: '8-16 weeks' },
              { name: 'Electrical', href: '/programs/electrical', img: '/images/trades/hero-program-electrical.jpg', duration: '8-16 weeks' },
              { name: 'Welding', href: '/programs/welding', img: '/images/trades/hero-program-welding.jpg', duration: '8-12 weeks' },
              { name: 'Plumbing', href: '/programs/plumbing', img: '/images/trades/hero-program-plumbing.jpg', duration: '8-16 weeks' },
              { name: 'CDL Training', href: '/programs/cdl-training', img: '/images/trades/hero-program-cdl.jpg', duration: '4-8 weeks' },
              { name: 'Carpentry', href: '/programs/carpentry', img: '/images/trades/hero-program-carpentry.jpg', duration: '8-12 weeks' },
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
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative w-full h-[200px] sm:w-72 sm:h-[280px] rounded-xl overflow-hidden flex-shrink-0">
              <Image src="/images/trades/program-building-construction.jpg" alt="Trades training" fill className="object-cover" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">Hands-on shop and field training to prepare for industry certification exams.</p>
              <div className="space-y-2">
                {['Safety protocols and OSHA standards', 'Tool operation and equipment handling', 'Blueprint reading and technical drawings', 'Code compliance and inspection procedures', 'Troubleshooting and diagnostics', 'Customer service and job site professionalism'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Career Outcomes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { title: 'HVAC Technician', salary: '$42K-$70K' },
              { title: 'Electrician', salary: '$45K-$75K' },
              { title: 'Welder', salary: '$40K-$65K' },
              { title: 'Plumber', salary: '$45K-$75K' },
              { title: 'CDL Driver', salary: '$50K-$80K' },
              { title: 'Carpenter', salary: '$40K-$60K' },
            ].map((c) => (
              <div key={c.title} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                <div className="text-orange-500 font-bold text-sm">{c.salary}</div>
              </div>
            ))}
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
              { step: '3', title: 'Start Training', desc: 'Hands-on shop and field instruction.' },
              { step: '4', title: 'Get Certified & Hired', desc: 'Earn your industry certification and connect with employers.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-white rounded-lg p-4">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-orange-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Trades Career</h2>
          <p className="text-white/90 mb-6 text-sm">High demand, strong pay. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=skilled-trades" className="bg-white text-orange-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-orange-50 transition-colors text-center">
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
