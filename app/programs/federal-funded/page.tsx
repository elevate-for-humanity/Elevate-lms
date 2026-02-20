
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Federally Funded Programs | WIOA & JRI Training | Elevate',
  description: 'Federally funded career training programs. WIOA and JRI funding covers tuition for qualifying students. Register at indianacareerconnect.com.',
  alternates: { canonical: `${SITE_URL}/programs/federal-funded` },
};

export default function FederalFundedPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Federally Funded Programs' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/homepage/funded-programs.jpg" alt="Federally Funded Programs" fill sizes="100vw" className="object-cover" priority quality={90} />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Funding Available</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Federally Funded Programs</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              WIOA and JRI funding can cover tuition for qualifying students. Not all programs are free — check your eligibility.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Eligible Programs</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { name: 'Healthcare', href: '/programs/healthcare', img: '/images/hero/hero-healthcare.jpg' },
              { name: 'Skilled Trades', href: '/programs/skilled-trades', img: '/images/homepage/funded-programs.jpg' },
              { name: 'CDL Training', href: '/programs/cdl-training', img: '/images/homepage/funded-programs-optimized.jpg' },
              { name: 'Technology', href: '/programs/technology', img: '/images/hero/hero-tech-careers.jpg' },
              { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship', img: '/images/barber-hero-new.jpg' },
              { name: 'Culinary', href: '/programs/culinary-apprenticeship', img: '/images/culinary/hero-program-culinary.jpg' },
            ].map((p) => (
              <Link key={p.name} href={p.href} className="group">
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2">
                  <Image src={p.img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 33vw" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Check Eligibility</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Register Online', desc: 'Create an account at indianacareerconnect.com.' },
              { step: '2', title: 'Schedule WorkOne Appointment', desc: 'Meet with a WorkOne counselor to determine funding eligibility.' },
              { step: '3', title: 'Choose Your Program', desc: 'Select from WIOA/JRI-eligible training programs.' },
              { step: '4', title: 'Start Training', desc: 'Begin your funded career training program.' },
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
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Check Your Funding Eligibility</h2>
          <p className="text-white mb-6 text-sm">WIOA and JRI funding available for qualifying students.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=federal-funded" className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center">
              Apply Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              Register at Indiana Career Connect
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
