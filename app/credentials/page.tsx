import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, Award, Shield, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Credentials & Certifications | Elevate for Humanity',
  description: 'Industry-recognized credentials and certifications earned through Elevate for Humanity training programs. OSHA, HSI, CNA, CDL, and more.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/credentials' },
};

const credentials = [
  { name: 'OSHA 10 / OSHA 30', field: 'Construction & Trades', issuer: 'OSHA', desc: 'Workplace safety certification required by most employers in construction and manufacturing.' },
  { name: 'HSI CPR/AED/First Aid', field: 'Healthcare & General', issuer: 'Health & Safety Institute', desc: 'Same-day certification. Valid for 2 years. Required for healthcare, childcare, and many trades.' },
  { name: 'Certified Nursing Assistant (CNA)', field: 'Healthcare', issuer: 'Indiana State Dept. of Health', desc: 'State-certified credential for patient care in hospitals, nursing homes, and home health.' },
  { name: 'Commercial Driver License (CDL)', field: 'Transportation', issuer: 'Indiana BMV', desc: 'Class A or Class B CDL for commercial truck driving. Includes pre-trip, skills, and road test.' },
  { name: 'EPA 608 Certification', field: 'HVAC', issuer: 'EPA', desc: 'Required for handling refrigerants. Universal, Type I, II, or III certification.' },
  { name: 'Barber License', field: 'Cosmetology', issuer: 'Indiana PLA', desc: 'State barber license earned through DOL Registered Apprenticeship. 1,500 hours of training.' },
  { name: 'Phlebotomy Technician', field: 'Healthcare', issuer: 'NHA / ASCP', desc: 'National certification for blood draw and specimen collection.' },
  { name: 'Medical Assistant', field: 'Healthcare', issuer: 'NHA', desc: 'Clinical and administrative skills for physician offices and outpatient clinics.' },
];

export default function CredentialsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Credentials' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[300px] sm:h-[380px] overflow-hidden">
        <Image src="/images/hero/hero-certifications.jpg" alt="Industry certifications" fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-6xl mx-auto px-4 w-full pb-10 sm:pb-14">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">Credentials & Certifications</h1>
            <p className="text-lg text-white/90 max-w-2xl">Industry-recognized credentials that employers require. Earn yours in weeks, not years.</p>
          </div>
        </div>
      </section>

      {/* Credentials Grid */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Available Certifications</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Each credential is nationally or state recognized and accepted by employers across Indiana and beyond.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {credentials.map((cred) => (
              <div key={cred.name} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <Award className="w-8 h-8 text-brand-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{cred.name}</h3>
                    <p className="text-sm text-brand-blue-600 font-medium mb-2">{cred.field} — Issued by {cred.issuer}</p>
                    <p className="text-slate-600 text-sm">{cred.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Credentials Matter */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Why Credentials Matter</h2>
              <div className="space-y-4">
                {[
                  'Employers require specific certifications before hiring',
                  'Certified workers earn 20-40% more than non-certified peers',
                  'Credentials are portable — they follow you to any employer',
                  'Many certifications can be earned in 2-12 weeks',
                  'Funding may cover all certification and exam fees',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[300px] rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/trades/program-hvac-technician.jpg" alt="Earning industry credentials" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-10 h-10 text-white/80 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Get Certified. Get Hired.</h2>
          <p className="text-xl text-white/90 mb-10">Training may be free for eligible Indiana residents.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/apply/student" className="bg-white text-brand-red-600 px-10 py-5 rounded-full font-bold text-xl hover:bg-slate-50 transition hover:scale-105 shadow-lg">Apply Now</Link>
            <Link href="/programs" className="border-2 border-white text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-white/10 transition">View Programs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
