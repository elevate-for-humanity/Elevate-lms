
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';
import { Users, MapPin, Calendar } from 'lucide-react';

export const metadata = {
  title: 'Free Tax Preparation | VITA Program',
  description: 'Free tax preparation for individuals and families earning $64,000 or less through the VITA program.',
};

export default function FreeTaxPage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax", href: "/tax" }, { label: "Free" }]} />
      </div>
{/* Hero */}
      <section className="relative h-[400px] w-full overflow-hidden">
        <Image src="/images/pages/tax-free-hero.jpg" alt="Free Tax Preparation" fill sizes="100vw" className="object-cover" quality={85} loading="lazy" />
        
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">Who Qualifies?</h2>
              <p className="text-black mb-6">
                The Volunteer Income Tax Assistance (VITA) program offers free tax preparation to individuals and families who:
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <div>
                    <h3 className="font-semibold mb-1">Income Limit</h3>
                    <p className="text-black">Earn $64,000 or less per year</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <div>
                    <h3 className="font-semibold mb-1">Disabilities</h3>
                    <p className="text-black">Persons with disabilities</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <div>
                    <h3 className="font-semibold mb-1">Limited English</h3>
                    <p className="text-black">Limited English-speaking taxpayers</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-brand-blue-50 rounded-lg p-8 border border-brand-blue-200">
              <h3 className="text-2xl font-bold mb-4">What's Included</h3>
              <ul className="space-y-3 text-black">
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span>Funded tax preparation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span>IRS-certified volunteers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span>Electronic filing (e-file)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span>Direct deposit setup</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span>All federal and state forms</span>
                </li>
              </ul>
              <Link
                href="/tax/rise-up-foundation/site-locator"
                className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center px-8 py-3 rounded-lg font-semibold transition-colors mt-6"
              >
                Find a VITA Site
              </Link>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">How It Works</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-brand-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">1. Find a Site</h4>
                <p className="text-sm text-black">Locate a VITA site near you</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-brand-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">2. Schedule</h4>
                <p className="text-sm text-black">Book your appointment</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-brand-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">3. Meet Volunteer</h4>
                <p className="text-sm text-black">Work with certified preparer</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                </div>
                <h4 className="font-semibold mb-2">4. File Free</h4>
                <p className="text-sm text-black">E-file at no cost</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
