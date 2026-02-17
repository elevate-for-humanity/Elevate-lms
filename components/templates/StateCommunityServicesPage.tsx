'use client';

import Link from 'next/link';
import Image from 'next/image';
import { StateConfig, getOtherStates } from '@/config/states';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Heart, Briefcase, DollarSign, Home, Users, Bus, ArrowRight, Phone } from 'lucide-react';

interface StateCommunityServicesPageProps {
  state: StateConfig;
}

const SERVICES = [
  { icon: Briefcase, title: 'Job Placement', desc: 'Resume building, interview prep, employer connections, and career coaching to help you land the right job.' },
  { icon: DollarSign, title: 'Financial Literacy', desc: 'Budgeting workshops, credit repair guidance, savings programs, and financial planning assistance.' },
  { icon: Home, title: 'Housing Assistance', desc: 'Rental support, homebuyer education, emergency housing aid, and utility assistance programs.' },
  { icon: Users, title: 'Family Services', desc: 'Childcare resources, parenting support, youth mentorship programs, and family counseling referrals.' },
  { icon: Heart, title: 'Benefits Navigation', desc: 'SNAP, Medicaid, TANF application assistance, and help connecting to all available benefits.' },
  { icon: Bus, title: 'Transportation', desc: 'Bus passes, car repair assistance, rideshare programs, and transportation vouchers for work and training.' },
];

export default function StateCommunityServicesPage({ state }: StateCommunityServicesPageProps) {
  const otherStates = getOtherStates(state.slug);

  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community Services', href: '/community-services' }, { label: state.name }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/hero-images/services-hero.jpg" alt={`Community Services in ${state.name}`} fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <span className="text-brand-green-300 font-medium text-sm uppercase tracking-wider">Community Services</span>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 mt-2">{state.communityServices.headline}</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-6">{state.communityServices.description}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/contact" className="px-8 py-4 bg-white text-brand-green-700 font-bold rounded-lg hover:bg-brand-green-50 transition">Get Help Now</Link>
              <Link href={`/career-training-${state.slug}`} className="px-8 py-4 bg-brand-green-600 text-white font-bold rounded-lg hover:bg-brand-green-500 transition">Career Training</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How We Help</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Free support services to help you and your family achieve stability and self-sufficiency.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <div key={service.title} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition">
                <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-brand-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities Served */}
      <section className="py-16 bg-brand-green-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Cities We Serve in {state.name}</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {state.majorCities.map((city) => (
              <span key={city} className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-gray-700 text-sm font-medium shadow-sm">
                <span className="text-slate-400 flex-shrink-0">•</span> {city}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-brand-green-600 text-white p-10 rounded-2xl text-center">
            <Phone className="w-12 h-12 mx-auto mb-4 text-brand-green-200" />
            <h2 className="text-3xl font-bold mb-4">Need Support? We&apos;re Here to Help</h2>
            <p className="text-brand-green-100 text-lg mb-8 max-w-xl mx-auto">
              Connect with our team to find the resources you need. All services are free and confidential.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/contact" className="bg-white text-brand-green-600 px-8 py-4 rounded-lg font-bold hover:bg-brand-green-50 transition inline-flex items-center gap-2">
                Contact Us <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/check-eligibility" className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition">
                Check Eligibility
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl border">
              <h3 className="font-bold text-gray-900 mb-4">Also in {state.name}</h3>
              <Link href={`/career-training-${state.slug}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition mb-2">
                <span className="text-gray-700">Career Training Programs</span>
                <ArrowRight className="w-4 h-4 text-brand-green-600" />
              </Link>
              <Link href="/programs" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <span className="text-gray-700">All Programs</span>
                <ArrowRight className="w-4 h-4 text-brand-green-600" />
              </Link>
            </div>
            <div className="bg-white p-6 rounded-xl border">
              <h3 className="font-bold text-gray-900 mb-4">Other States</h3>
              <div className="space-y-2">
                {otherStates.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/community-services-${s.slug}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <span className="text-gray-700">{s.name}</span>
                    <ArrowRight className="w-4 h-4 text-brand-green-600" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer links */}
      <section className="py-8 border-t">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="space-x-6">
            <Link href="/locations" className="text-brand-green-600 hover:underline text-sm">All Locations</Link>
            <Link href="/programs" className="text-brand-green-600 hover:underline text-sm">All Programs</Link>
            <Link href="/contact" className="text-brand-green-600 hover:underline text-sm">Contact Us</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
