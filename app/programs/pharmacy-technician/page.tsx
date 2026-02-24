import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Pharmacy Technician Training | Elevate for Humanity',
  description: 'Pharmacy technician training in Indianapolis. Learn medication dispensing, inventory management, and pharmacy operations. Funding available.',
  alternates: { canonical: `${SITE_URL}/programs/pharmacy-technician` },
};

export default function PharmacyTechnicianPage() {
  return (
    <div className="min-h-screen bg-white">
      <ProgramHeroBanner videoSrc="/videos/program-hero.mp4" voiceoverSrc="/audio/heroes/programs.mp3" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Healthcare', href: '/programs/healthcare' }, { label: 'Pharmacy Technician' }]} />
        </div>
      </div>

      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/programs-hq/healthcare-hero.jpg" alt="Pharmacy technician training" fill sizes="100vw" className="object-cover" priority />
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '12-16 Weeks', label: 'Program Length' },
            { val: 'PTCB Prep', label: 'Certification' },
            { val: '$32K-$45K', label: 'Salary Range' },
            { val: 'High Demand', label: 'Job Market' },
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Pharmacy Technician Training</h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Prepare for a career in pharmacy operations. This program covers medication dispensing, prescription processing, inventory management, pharmacy law, and patient interaction. Graduates are prepared to sit for the PTCB (Pharmacy Technician Certification Board) exam.
          </p>
          <h2 className="text-xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
          <div className="space-y-2">
            {['Prescription processing and verification', 'Medication dispensing and compounding basics', 'Pharmacy law and regulations', 'Drug classification and interactions', 'Inventory management and ordering', 'Insurance billing and claims processing', 'Patient communication and confidentiality (HIPAA)', 'Sterile and non-sterile compounding', 'Pharmacy math and dosage calculations'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-brand-blue-600 rounded-full flex-shrink-0" />
                <span className="text-slate-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Career Paths</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: 'Retail Pharmacy Tech', salary: '$30K-$38K' },
              { title: 'Hospital Pharmacy Tech', salary: '$35K-$45K' },
              { title: 'Compounding Tech', salary: '$36K-$48K' },
              { title: 'Lead Pharmacy Tech', salary: '$40K-$52K' },
            ].map((c) => (
              <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                <div className="text-brand-blue-600 font-bold text-sm">{c.salary}</div>
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
              { step: '1', title: 'Apply Online', desc: 'Submit your student application.' },
              { step: '2', title: 'Check Funding', desc: 'Register at indianacareerconnect.com for WIOA eligibility.' },
              { step: '3', title: 'Complete Training', desc: 'Classroom instruction and pharmacy lab practice.' },
              { step: '4', title: 'Get Certified', desc: 'Prepare for the PTCB exam and start your pharmacy career.' },
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

      <section className="py-8 sm:py-14 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Pharmacy Career</h2>
          <p className="text-white/90 mb-6 text-sm">PTCB certification prep included. Funding available for eligible students.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=pharmacy-technician" className="bg-white text-brand-blue-700 font-bold px-6 py-3 rounded-lg text-base hover:bg-blue-50 transition-colors text-center">
              Apply Now →
            </Link>
            <Link href="/funding" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              Explore Funding
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
