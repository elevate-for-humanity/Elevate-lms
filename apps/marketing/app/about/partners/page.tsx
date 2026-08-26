import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowRight, Building2, Users, Handshake, Award, Globe } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Our Partners | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Discover the employers, workforce agencies, and organizations that partner with Elevate for Humanity to create career pathways.',
  keywords: ['partners', 'employers', 'workforce agencies', 'WorkOne', 'collaborations'],
};

const PARTNER_TYPES = [
  {
    icon: Building2,
    title: 'Employer Partners',
    desc: 'Local businesses across healthcare, trades, beauty, and technology who hire our graduates.',
    examples: ['Hospitals & Healthcare Facilities', 'Salon & Spa Networks', 'Manufacturing Companies', 'Tech Firms'],
  },
  {
    icon: Users,
    title: 'Workforce Agencies',
    desc: 'Indiana workforce development organizations including WorkOne centers across the state.',
    examples: ['WorkOne Indianapolis', 'Region 6 Workforce Board', 'WorkOne Northeast Indiana', 'Indiana Department of Workforce Development'],
  },
  {
    icon: Handshake,
    title: 'Training Partners',
    desc: 'Educational institutions and training organizations we collaborate with to expand opportunities.',
    examples: ['Community Colleges', 'Vocational Schools', 'Industry Associations', 'Certification Bodies'],
  },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/pages/workone-partners.webp" alt="WorkOne partnership - Elevate for Humanity workforce partners" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-blue-300 font-semibold mb-4 uppercase tracking-wide text-sm">Our Network</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Partners in Workforce Excellence
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              We work alongside employers, workforce agencies, and training organizations to create 
              meaningful career pathways for Hoosiers across Indiana.
            </p>
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Partner Network</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Together with our partners, we're building a workforce ecosystem that benefits everyone.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {PARTNER_TYPES.map((type) => (
              <div key={type.title} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <type.icon className="w-8 h-8 text-brand-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{type.title}</h3>
                <p className="text-slate-600 mb-6">{type.desc}</p>
                <ul className="space-y-2">
                  {type.examples.map((ex) => (
                    <li key={ex} className="flex items-center gap-2 text-slate-700">
                      <div className="w-1.5 h-1.5 bg-brand-blue-500 rounded-full" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Partner With Us */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Why Partner With Us?</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Pre-Screened Candidates</h4>
                    <p className="text-slate-600">Our students complete background checks, drug screenings, and skills assessments before placement.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Industry-Recognized Credentials</h4>
                    <p className="text-slate-600">Graduates earn certifications that meet employer standards across healthcare, trades, and technology.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Handshake className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Ongoing Support</h4>
                    <p className="text-slate-600">We provide retention support to help ensure long-term success for both employers and employees.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <Image src="/images/pages/business-meeting.webp" alt="Business partnership" fill className="object-cover" sizes="100vw" />
            </div>
          </div>
        </div>
      </section>

      {/* Become a Partner CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Handshake className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Become a Partner</h2>
          <p className="text-xl text-blue-100 mb-8">
            Whether you're an employer seeking talent, a workforce agency, or a training organization — 
            we'd love to explore how we can work together.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Us <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/for-employers" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Employer Info
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
