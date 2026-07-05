import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Users, Handshake, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Partners | Elevate for Humanity',
  description: 'Elevate for Humanity partners with employers, workforce agencies, and training providers.',
};

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Partners</h1>
          <p className="text-xl text-blue-100">
            Working together to build a stronger workforce.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-brand-blue-50 rounded-xl p-6">
              <Building2 className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Employers</h2>
              <p className="text-gray-600 mb-4">
                We partner with employers across healthcare, skilled trades, technology, and business 
                to create pathways from training to employment.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li>• Pre-screened, trained candidates</li>
                <li>• Customized training programs</li>
                <li>• Apprenticeship sponsorship</li>
                <li>• WOTC tax credit assistance</li>
              </ul>
              <Link href="/for-employers" className="inline-block mt-4 text-brand-blue-600 font-semibold hover:underline">
                Partner as an Employer →
              </Link>
            </div>

            <div className="bg-green-50 rounded-xl p-6">
              <Users className="w-10 h-10 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Workforce Agencies</h2>
              <p className="text-gray-600 mb-4">
                We collaborate with WIOA partners, vocational rehabilitation, and workforce 
                development boards to serve shared clients.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li>• WIOA-approved training provider</li>
                <li>• ETPL listed</li>
                <li>• RAPIDS/DOL registered</li>
                <li>• Reporting and compliance support</li>
              </ul>
              <Link href="/for-agencies" className="inline-block mt-4 text-green-600 font-semibold hover:underline">
                Partner as an Agency →
              </Link>
            </div>

            <div className="bg-purple-50 rounded-xl p-6">
              <Handshake className="w-10 h-10 text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Training Providers</h2>
              <p className="text-gray-600 mb-4">
                We work with other training providers through our platform licensing and 
                program holder partnerships.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li>• Platform licensing</li>
                <li>• Curriculum sharing</li>
                <li>• White-label options</li>
                <li>• Compliance automation</li>
              </ul>
              <Link href="/for-providers" className="inline-block mt-4 text-purple-600 font-semibold hover:underline">
                Partner as a Provider →
              </Link>
            </div>

            <div className="bg-amber-50 rounded-xl p-6">
              <Award className="w-10 h-10 text-amber-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Certification Bodies</h2>
              <p className="text-gray-600 mb-4">
                We maintain partnerships with leading certification providers to ensure 
                our graduates earn recognized credentials.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li>• NHA authorized testing center</li>
                <li>• Certiport authorized</li>
                <li>• EPA 608 certified</li>
                <li>• ACT WorkKeys/NCRC provider</li>
              </ul>
              <Link href="/testing" className="inline-block mt-4 text-amber-600 font-semibold hover:underline">
                View Testing Options →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Become a Partner</h2>
          <p className="text-gray-600 mb-8">
            Join our network of employers, agencies, and providers working together 
            to build Indiana's workforce.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact" className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700">
              Contact Us
            </Link>
            <Link href="/partners" className="px-6 py-3 border-2 border-brand-blue-600 text-brand-blue-600 font-semibold rounded-lg hover:bg-brand-blue-50">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
