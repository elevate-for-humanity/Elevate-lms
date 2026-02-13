import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Sanitation & Infection Control Training | Elevate',
  description: 'Sanitation and infection control training in Indianapolis. OSHA compliance, healthcare facility protocols. Certification included.',
  alternates: { canonical: `${SITE_URL}/programs/sanitation-infection-control` },
  openGraph: {
    title: 'Sanitation & Infection Control Training',
    description: 'OSHA-compliant sanitation and infection control certification.',
    url: `${SITE_URL}/programs/sanitation-infection-control`,
    images: [{ url: `${SITE_URL}/images/healthcare/emergency-safety.jpg`, width: 1200, height: 630 }],
  },
};

export default function SanitationInfectionControlPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Healthcare', href: '/programs/healthcare' }, { label: 'Sanitation & Infection Control' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/healthcare/emergency-safety.jpg" alt="Sanitation & Infection Control" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Certification</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Sanitation &amp; Infection Control</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Learn OSHA-compliant sanitation protocols for healthcare, food service, and cosmetology settings.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '1-2 Weeks', label: 'Program Length' },
            { val: 'OSHA', label: 'Compliant' },
            { val: 'Required', label: 'For Licensure' },
            { val: 'Multi-Industry', label: 'Application' },
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-3">Protocols and procedures to prevent the spread of infection in professional settings.</p>
          <div className="space-y-2">
            {['Bloodborne pathogen safety (BBP)', 'Hand hygiene and PPE usage', 'Surface disinfection and sterilization', 'Sharps handling and biohazard waste disposal', 'OSHA standards and regulatory compliance', 'Infection prevention in healthcare and cosmetology', 'Documentation and incident reporting'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0" />
                <span className="text-slate-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Who Needs This Training</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Healthcare Workers', 'Barbers & Cosmetologists', 'Food Service Staff', 'Childcare Providers', 'Dental Assistants', 'Tattoo Artists', 'Janitorial Staff', 'Anyone in Licensed Fields'].map((e) => (
              <div key={e} className="bg-white rounded-lg px-4 py-3 text-slate-700 font-medium text-sm text-center border border-slate-200">{e}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Enroll</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Apply Online', desc: 'Submit your application or register for a class date.' },
              { step: '2', title: 'Attend Training', desc: 'In-person instruction with hands-on practice.' },
              { step: '3', title: 'Get Certified', desc: 'Receive your sanitation and infection control certificate.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-slate-50 rounded-lg p-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Get Certified in Sanitation &amp; Infection Control</h2>
          <p className="text-white/90 mb-6 text-sm">Required for many licensed professions. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=sanitation-infection-control" className="bg-white text-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-blue-50 transition-colors text-center">
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
