'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, MapPin, Phone, Calendar } from 'lucide-react';
import { StateConfig, getOtherStates } from '@/config/states';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface StateTaxPreparationPageProps {
  state: StateConfig;
}

export default function StateTaxPreparationPage({ state }: StateTaxPreparationPageProps) {
  const otherStates = getOtherStates(state.slug);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Tax Preparation', href: '/tax-services' }, { label: state.name }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 text-blue-200 mb-4">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">
              VITA Sites Across {state.name}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
            {state.taxPreparation.headline}
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl">
            {state.taxPreparation.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/tax" 
              className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-lg font-bold transition-colors"
            >
              <Calendar className="mr-2 w-5 h-5" />
              Schedule Appointment
            </Link>
            <Link 
              href="/tax" 
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 rounded-lg text-lg font-bold transition-colors"
            >
              Find a Location
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Why Choose Our VITA Services?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {state.taxPreparation.features.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Who Qualifies for Free Tax Preparation?
          </h2>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Households earning $64,000 or less annually</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Persons with disabilities</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Limited English speaking taxpayers</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Senior citizens (60+)</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            VITA Locations in {state.name}
          </h2>
          <div className="flex flex-wrap gap-3">
            {state.majorCities.map((city) => (
              <span 
                key={city} 
                className="px-4 py-2 bg-blue-50 rounded-full text-gray-700"
              >
                {city}
              </span>
            ))}
          </div>
          <p className="mt-6 text-gray-600">
            Plus many more locations throughout {state.name}.{' '}
            <Link href="/tax" className="text-blue-600 hover:underline">
              View all locations →
            </Link>
          </p>
        </div>
      </section>

      {/* Other States */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Tax Services in Other States
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {otherStates.map((s) => (
              <Link
                key={s.slug}
                href={`/tax-services/tax-preparation-${s.slug}`}
                className="p-4 bg-white rounded-lg hover:bg-blue-50 transition-colors text-center shadow-sm"
              >
                <span className="font-medium text-gray-900">{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Get Your Maximum Refund
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Our IRS-certified volunteers ensure you get every credit and deduction you deserve.
            Schedule your free appointment today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tax"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
            >
              <Calendar className="mr-2 w-5 h-5" />
              Book Appointment
            </Link>
            <a
              href="/support"
              className="inline-flex items-center px-8 py-4 bg-blue-500 text-white rounded-lg text-lg font-bold hover:bg-blue-400 transition-colors"
            >
              <Phone className="mr-2 w-5 h-5" />
              Call Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
