import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import {
  DollarSign,
  Shield,
  Clock,
  CreditCard,
  Zap,
CheckCircle, } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Banking Services - Powered by EPS Financial | Elevate for Humanity',
  description:
    'Fast refund advances, direct deposit, and prepaid card services. FDIC-insured banking powered by EPS Financial.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/banking',
  },
};

export default async function BankingPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch banking services
  const { data: services } = await db
    .from('banking_services')
    .select('*')
    .order('order_index');

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Banking" }]} />
      </div>
{/* Hero */}
      <section className="relative h-[400px] md:h-[500px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/programs/efh-business-startup-marketing-hero.jpg"
          alt="Banking Services"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 uppercase">
            Banking Services
          </h1>
          <p className="text-xl md:text-2xl mb-4">
            Powered by EPS Financial - FDIC Insured
          </p>
          <p className="text-lg mb-8">
            Fast refund advances, direct deposit, and prepaid card services
          </p>
          <Link
            href="#products"
            className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all inline-block"
          >
            View Products
          </Link>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-brand-blue-600 mr-2" />
              <span className="font-semibold">FDIC Insured</span>
            </div>
            <div className="flex items-center">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span className="font-semibold">IRS Approved</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-8 h-8 text-yellow-600 mr-2" />
              <span className="font-semibold">Fast Processing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-12 text-center">
            Our Banking Products
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Refund Advance */}
            <div className="bg-white border-2 border-brand-blue-200 rounded-lg p-8 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4 text-center">
                Refund Advance
              </h3>
              <p className="text-black mb-6 text-center">
                Get your refund faster with an advance loan. No credit check
                required.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Up to $6,000 advance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>No credit check</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Same-day funding available</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Repaid from IRS refund</span>
                </li>
              </ul>
              <Link
                href="/banking/refund-advance"
                className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center px-6 py-3 rounded-lg font-bold transition-all"
              >
                Learn More
              </Link>
            </div>

            {/* Direct Deposit */}
            <div className="bg-white border-2 border-brand-green-200 rounded-lg p-8 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-brand-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4 text-center">
                Direct Deposit
              </h3>
              <p className="text-black mb-6 text-center">
                Get your refund deposited directly to your bank account.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Fastest refund method</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Secure and reliable</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>No check cashing fees</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Track your refund status</span>
                </li>
              </ul>
              <Link
                href="/banking/direct-deposit"
                className="block w-full bg-brand-green-600 hover:bg-brand-green-700 text-white text-center px-6 py-3 rounded-lg font-bold transition-all"
              >
                Learn More
              </Link>
            </div>

            {/* Prepaid Card */}
            <div className="bg-white border-2 border-brand-blue-200 rounded-lg p-8 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4 text-center">
                Prepaid Card
              </h3>
              <p className="text-black mb-6 text-center">
                Receive your refund on a prepaid debit card. No bank account
                needed.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>No bank account required</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Use anywhere Visa is accepted</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>ATM access nationwide</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>FDIC insured</span>
                </li>
              </ul>
              <Link
                href="/banking/prepaid-card"
                className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center px-6 py-3 rounded-lg font-bold transition-all"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-12 text-center">
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-black mb-3">
                File Your Taxes
              </h3>
              <p className="text-black">
                Complete your tax return with our professional preparers.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-black mb-3">
                Choose Your Option
              </h3>
              <p className="text-black">
                Select refund advance, direct deposit, or prepaid card.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-black mb-3">
                Get Approved
              </h3>
              <p className="text-black">
                Quick approval process, usually within minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-bold text-black mb-3">
                Receive Funds
              </h3>
              <p className="text-black">
                Get your money fast - same day or next day available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Info */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-brand-blue-50 border-2 border-brand-blue-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-black mb-4 text-center">
              Powered by EPS Financial
            </h2>
            <p className="text-black mb-6 text-center">
              All banking products are provided by EPS Financial, Member FDIC,
              with professional tax software integration.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <Shield className="w-12 h-12 text-brand-blue-600 mx-auto mb-2" />
                <p className="font-semibold">FDIC Insured</p>
                <p className="text-sm text-black">
                  Your deposits are protected
                </p>
              </div>
              <div>
                <span className="text-slate-400 flex-shrink-0">•</span>
                <p className="font-semibold">IRS Approved</p>
                <p className="text-sm text-black">
                  Authorized e-file provider
                </p>
              </div>
              <div>
                <Clock className="w-12 h-12 text-brand-orange-600 mx-auto mb-2" />
                <p className="font-semibold">Fast Service</p>
                <p className="text-sm text-black">Quick processing times</p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <a
                href="https://www.epstax.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue-600 hover:text-brand-blue-800 font-semibold underline"
              >
                Learn more about EPS Financial →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Fees & Disclosures */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-8 text-center">
            Fees & Disclosures
          </h2>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-bold text-black mb-4">
              Refund Advance Fees
            </h3>
            <ul className="space-y-2 mb-6 text-black">
              <li>• No application fee</li>
              <li>• No credit check</li>
              <li>• Interest rates vary by loan amount</li>
              <li>• Repaid automatically from IRS refund</li>
            </ul>

            <h3 className="text-xl font-bold text-black mb-4">
              Direct Deposit
            </h3>
            <ul className="space-y-2 mb-6 text-black">
              <li>• No fees for direct deposit</li>
              <li>• Fastest refund method available</li>
            </ul>

            <h3 className="text-xl font-bold text-black mb-4">
              Prepaid Card Fees
            </h3>
            <ul className="space-y-2 mb-6 text-black">
              <li>• No monthly maintenance fee</li>
              <li>• Free ATM withdrawals at network ATMs</li>
              <li>• $2.50 fee for out-of-network ATMs</li>
              <li>• No overdraft fees</li>
            </ul>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-black">
                <strong>Important:</strong> All banking products are provided by
                EPS Financial, Member FDIC. Refund advances are loans and must
                be repaid. Terms and conditions apply. See your tax professional
                for complete details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8">
            File your taxes and choose the banking option that works best for
            you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all"
            >
              File Your Taxes
            </Link>
            <Link
              href="/contact"
              className="bg-white hover:bg-gray-100 text-brand-blue-900 px-8 py-4 rounded-lg text-lg font-bold transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
