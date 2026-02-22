
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, DollarSign, Users, Award } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Donate | Elevate for Humanity',
  description: 'Support workforce development and help transform lives. Your donation helps provide training, certifications, and career opportunities.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/donations' },
};

export default function DonationsPage() {

  const impactStats = [
    { number: '20+', label: 'Training Programs' },
    { number: '100%', label: 'Free with WIOA' },
    { number: 'ETPL', label: 'Listed Provider' },
    { number: 'DOL', label: 'Registered' },
  ];

  const donationLevels = [
    { amount: 50, impact: 'Provides study materials for one student' },
    { amount: 100, impact: 'Covers certification exam fees' },
    { amount: 250, impact: 'Sponsors a week of training' },
    { amount: 500, impact: 'Provides full program supplies' },
    { amount: 1000, impact: 'Sponsors a student scholarship' },
  ];

  return (
    <div className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Donate' }]} />
        </div>
      </div>

      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/hero/hero-community.jpg" alt="Donate" fill className="object-cover" priority sizes="100vw" />
        
      </section>

      <section className="py-12 bg-brand-red-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {impactStats.map((stat, i) => (
              <div key={i}>
                <p className="text-4xl font-bold text-brand-red-600">{stat.number}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="donate" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Make a Donation</h2>
          
          <div className="bg-gray-50 rounded-xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {donationLevels.map((level, i) => (
                <button key={i} className="bg-white border-2 border-gray-200 hover:border-brand-red-500 rounded-lg p-4 text-center transition">
                  <p className="text-2xl font-bold text-gray-900">${level.amount}</p>
                </button>
              ))}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="number" placeholder="Enter amount" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red-500" />
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-brand-red-600 border-gray-300 rounded focus:ring-brand-red-500" />
                <span className="ml-2 text-gray-700">Make this a monthly donation</span>
              </label>
            </div>

            <button className="w-full bg-brand-red-600 hover:bg-brand-red-700 text-white py-4 rounded-lg text-lg font-bold transition">
              Complete Donation
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Elevate for Humanity is a 501(c)(3) nonprofit. Your donation is tax-deductible.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Your Impact</h2>
          <div className="space-y-4">
            {donationLevels.map((level, i) => (
              <div key={i} className="bg-white rounded-lg p-4 flex items-center shadow-sm">
                <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-brand-red-600">${level.amount}</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{level.impact}</p>
                </div>
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-red-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Other Ways to Give</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 rounded-lg p-6">
              <Users className="w-10 h-10 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Volunteer</h3>
              <p className="text-brand-red-100 text-sm">Share your expertise as a mentor or instructor</p>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <Award className="w-10 h-10 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Corporate Sponsorship</h3>
              <p className="text-brand-red-100 text-sm">Partner with us to support workforce development</p>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <Heart className="w-10 h-10 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Planned Giving</h3>
              <p className="text-brand-red-100 text-sm">Include Elevate in your estate planning</p>
            </div>
          </div>
          <Link href="/contact" className="mt-8 inline-block bg-white hover:bg-gray-100 text-brand-red-700 px-8 py-4 rounded-lg text-lg font-bold transition">
            Contact Us to Learn More
          </Link>
        </div>
      </section>
    </div>
  );
}
