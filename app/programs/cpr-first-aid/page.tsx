import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CPR & First Aid Certification | Elevate for Humanity',
  description: 'CPR, First Aid, and AED certification through CareerSafe. Required for healthcare, trades, and workforce programs. Same-day certification available.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/cpr-first-aid' },
};

const curriculum = [
  'Adult, child, and infant CPR techniques',
  'AED (Automated External Defibrillator) operation',
  'Choking response for conscious and unconscious victims',
  'First aid for bleeding, burns, and fractures',
  'Allergic reaction and anaphylaxis response',
  'Heat and cold emergency treatment',
  'Poison and substance exposure protocols',
  'Scene assessment and emergency action steps',
];

const whoNeeds = [
  'Healthcare workers (CNA, medical assistant, phlebotomy)',
  'Construction and trades workers (OSHA requirement)',
  'Childcare and education professionals',
  'Fitness trainers and coaches',
  'Workplace safety officers',
  'Anyone who wants life-saving skills',
];

export default function CPRFirstAidPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'CPR & First Aid Certification' },
          ]} />
        </div>
      </div>

      {/* Hero Image — no text overlay */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image
          src="/images/programs-hq/healthcare-hero.jpg"
          alt="CPR and First Aid training session"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      {/* Stats */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">1 Day</div>
              <div className="text-sm text-gray-500">Training Duration</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">2 Years</div>
              <div className="text-sm text-gray-500">Certification Valid</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">$75</div>
              <div className="text-sm text-gray-500">Tuition</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">Same Day</div>
              <div className="text-sm text-gray-500">Certification Issued</div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                CPR & First Aid Certification
              </h1>
              <p className="text-gray-700 leading-relaxed mb-4">
                This certification course covers adult, child, and infant CPR, AED use, and basic first aid skills. Training is delivered through CareerSafe and meets OSHA, healthcare employer, and state licensing requirements.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Certification is valid for 2 years and is recognized by employers across healthcare, construction, education, and fitness industries.
              </p>
              <p className="text-gray-600 text-sm">
                This certification is included at no additional cost in our HVAC, Electrical, CNA, and Barber programs.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">What You&apos;ll Learn</h3>
              <ul className="space-y-3">
                {curriculum.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-brand-red-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who Needs This */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Who Needs This Certification</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {whoNeeds.map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 bg-white rounded-xl">
                <span className="w-2 h-2 bg-brand-blue-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Get Certified Today</h2>
          <p className="text-brand-red-100 mb-8 max-w-2xl mx-auto">
            Same-day certification. No prerequisites. Walk in ready to save lives.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply/student?program=cpr-first-aid"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-red-600 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition"
            >
              Enroll Now — $75
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-brand-red-700 transition"
            >
              Group Training Inquiry
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
