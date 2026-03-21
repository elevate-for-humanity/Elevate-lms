import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  CreditCard,
  Shield,
  Circle,
  MapPin,
  Smartphone,
  ArrowRight,
  DollarSign,
  Globe,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Prepaid Debit Card - No Bank Account Needed | Elevate for Humanity',
  description:
    'Receive your tax refund on a prepaid Visa debit card. No bank account required. Use anywhere Visa is accepted. FDIC insured.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/banking/prepaid-card',
  },
};

export default function PrepaidCardPage() {
  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Banking", href: "/banking" }, { label: "Prepaid Card" }]} />
      </div>
{/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-brand-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/banking" className="hover:text-brand-blue-600">Banking</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Prepaid Card</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/banking-page-3.jpg"
          alt="Prepaid Card"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        

      </section>

      {/* Key Benefits */}
      <section className="py-12 bg-brand-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <Circle className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">No Bank Required</h3>
              <p className="text-sm text-gray-600">Get your refund without a bank account</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <Globe className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Use Anywhere</h3>
              <p className="text-sm text-gray-600">Accepted wherever Visa is accepted</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <MapPin className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">ATM Access</h3>
              <p className="text-sm text-gray-600">Withdraw cash at ATMs nationwide</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <Shield className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">FDIC Insured</h3>
              <p className="text-sm text-gray-600">Your money is protected</p>
            </div>
          </div>
        </div>
      </section>

      {/* Card Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Card Features
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-brand-blue-700 rounded-2xl p-8 text-white">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <p className="text-brand-blue-200 text-sm">Prepaid Visa</p>
                  <p className="text-2xl font-bold">EPS Financial</p>
                </div>
                <CreditCard className="w-12 h-12 text-brand-blue-200" />
              </div>
              <div className="mb-8">
                <p className="text-brand-blue-200 text-sm mb-1">Card Number</p>
                <p className="text-xl tracking-widest">**** **** **** 1234</p>
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="text-brand-blue-200 text-xs">VALID THRU</p>
                  <p>12/28</p>
                </div>
                <div className="text-right">
                  <p className="text-brand-blue-200 text-xs">CVV</p>
                  <p>***</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Everything You Need</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Circle className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Shop Online & In-Store</p>
                    <p className="text-gray-600">Use your card anywhere Visa is accepted worldwide</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Circle className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Pay Bills</p>
                    <p className="text-gray-600">Set up automatic payments for utilities, rent, and more</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Circle className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Get Cash</p>
                    <p className="text-gray-600">Withdraw cash at any ATM displaying the Visa logo</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Circle className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Mobile App</p>
                    <p className="text-gray-600">Check balance, view transactions, and manage your card</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            How to Get Your Card
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">File Your Taxes</h3>
              <p className="text-gray-600">Complete your tax return with our preparers</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Choose Prepaid Card</h3>
              <p className="text-gray-600">Select the prepaid card option for your refund</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Receive Your Card</h3>
              <p className="text-gray-600">Card mailed to you or pick up at our office</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Start Using It</h3>
              <p className="text-gray-600">Refund loaded automatically when IRS releases it</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fees */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Transparent Fees
          </h2>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
            <table className="w-full">
              <thead className="bg-brand-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Fee Type</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4">Monthly Maintenance Fee</td>
                  <td className="px-6 py-4 text-right font-bold text-brand-green-600">$0</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4">In-Network ATM Withdrawal</td>
                  <td className="px-6 py-4 text-right font-bold text-brand-green-600">$0</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Out-of-Network ATM Withdrawal</td>
                  <td className="px-6 py-4 text-right">$2.50</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4">Purchase Transactions</td>
                  <td className="px-6 py-4 text-right font-bold text-brand-green-600">$0</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Balance Inquiry (ATM)</td>
                  <td className="px-6 py-4 text-right font-bold text-brand-green-600">$0</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4">Overdraft Fee</td>
                  <td className="px-6 py-4 text-right font-bold text-brand-green-600">$0 (No overdraft)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Card Replacement</td>
                  <td className="px-6 py-4 text-right">$5.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-center text-gray-600 mt-4 text-sm">
            ATM operator may charge additional fees. See cardholder agreement for complete fee schedule.
          </p>
        </div>
      </section>

      {/* Mobile App */}
      <section className="py-16 bg-brand-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Manage Your Card On-the-Go
              </h2>
              <p className="text-gray-600 mb-8">
                Download the mobile app to manage your prepaid card from anywhere. 
                Check your balance, view transactions, find ATMs, and more.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Smartphone className="w-6 h-6 text-brand-blue-600 mr-3" />
                  <span className="text-gray-700">Real-time balance updates</span>
                </li>
                <li className="flex items-center">
                  <MapPin className="w-6 h-6 text-brand-blue-600 mr-3" />
                  <span className="text-gray-700">Find fee-free ATMs nearby</span>
                </li>
                <li className="flex items-center">
                  <Shield className="w-6 h-6 text-brand-blue-600 mr-3" />
                  <span className="text-gray-700">Lock/unlock your card instantly</span>
                </li>
                <li className="flex items-center">
                  <DollarSign className="w-6 h-6 text-brand-blue-600 mr-3" />
                  <span className="text-gray-700">Set up direct deposit for paychecks</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-center">
                <Smartphone className="w-24 h-24 text-brand-blue-600 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">Download the App</h3>
                <p className="text-gray-600 mb-6">Available for iOS and Android</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact" className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-medium transition text-center">
                    Contact Us to Enroll
                  </Link>
                </div>
                <p className="text-gray-500 text-sm mt-3">Mobile app in development — manage your card online today.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">How long does it take to get my card?</h3>
              <p className="text-gray-600">
                Cards are typically mailed within 7-10 business days. You can also pick up your card 
                at our office location for faster access.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Can I reload my card after the refund?</h3>
              <p className="text-gray-600">
                Yes! You can reload your card with direct deposit from your employer, cash loads at 
                participating retailers, or bank transfers.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">What if my card is lost or stolen?</h3>
              <p className="text-gray-600">
                Call the number on the back of your card immediately to report it. Your card will be 
                deactivated and a replacement issued. Your funds are protected.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Can I use the card internationally?</h3>
              <p className="text-gray-600">
                Yes, the card can be used anywhere Visa is accepted worldwide. Foreign transaction 
                fees may apply for purchases made outside the United States.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Get Your Prepaid Card Today
          </h2>
          <p className="text-xl mb-8 text-brand-blue-100">
            No bank account needed. Start using your refund right away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tax"
              className="bg-white hover:bg-white text-brand-blue-700 px-8 py-4 rounded-lg text-lg font-bold transition-all inline-flex items-center justify-center"
            >
              File Your Taxes <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/banking"
              className="bg-brand-blue-600 hover:bg-brand-blue-500 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all border-2 border-white"
            >
              View All Banking Options
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
