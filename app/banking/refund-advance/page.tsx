import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  DollarSign,
  Shield,
  Clock,
  ArrowRight,
  AlertCircle,
  Zap,
  FileText,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund Advance Loan - Get Up to $6,000 Today | Elevate for Humanity',
  description:
    'Get a tax refund advance loan up to $6,000 with no credit check. Same-day funding available. Repaid automatically from your IRS refund.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/banking/refund-advance',
  },
};

export default function RefundAdvancePage() {
  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Banking", href: "/banking" }, { label: "Refund Advance" }]} />
      </div>
{/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-brand-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/banking" className="hover:text-brand-blue-600">Banking</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Refund Advance</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/banking-page-4.jpg"
          alt="Refund Advance"
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
              <DollarSign className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Up to $6,000</h3>
              <p className="text-sm text-gray-600">Based on your expected refund amount</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <Shield className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">No Credit Check</h3>
              <p className="text-sm text-gray-600">Approval based on your tax refund</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <Zap className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Same-Day Funding</h3>
              <p className="text-sm text-gray-600">Get your money within hours</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <span className="text-slate-500 flex-shrink-0">•</span>
              <h3 className="font-bold text-gray-900 mb-2">Auto Repayment</h3>
              <p className="text-sm text-gray-600">Repaid from your IRS refund</p>
            </div>
          </div>
        </div>
      </section>

      {/* Loan Amounts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Advance Amounts Available
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center border-2 border-gray-200 hover:border-brand-blue-400 transition">
              <p className="text-4xl font-bold text-brand-blue-600 mb-2">$500</p>
              <p className="text-gray-600 mb-4">Minimum refund: $1,000</p>
              <p className="text-sm text-gray-500">Quick cash for immediate needs</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center border-2 border-gray-200 hover:border-brand-blue-400 transition">
              <p className="text-4xl font-bold text-brand-blue-600 mb-2">$1,500</p>
              <p className="text-gray-600 mb-4">Minimum refund: $3,000</p>
              <p className="text-sm text-gray-500">Cover bills and expenses</p>
            </div>

            <div className="bg-brand-blue-700 rounded-xl p-6 text-center text-white transform scale-105 shadow-lg">
              <div className="bg-yellow-400 text-brand-blue-900 text-xs font-bold px-3 py-1 rounded-full inline-block mb-2">
                MOST POPULAR
              </div>
              <p className="text-4xl font-bold mb-2">$3,000</p>
              <p className="text-white mb-4">Minimum refund: $5,000</p>
              <p className="text-sm text-white">Best value for most filers</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center border-2 border-gray-200 hover:border-brand-blue-400 transition">
              <p className="text-4xl font-bold text-brand-blue-600 mb-2">$6,000</p>
              <p className="text-gray-600 mb-4">Minimum refund: $10,000</p>
              <p className="text-sm text-gray-500">Maximum advance available</p>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-8 text-sm">
            Advance amounts are subject to approval and may vary based on your expected refund.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            How Refund Advance Works
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                  1
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">File Your Tax Return</h3>
                  <p className="text-gray-600">
                    Complete your tax return with our professional preparers. We will calculate 
                    your expected refund amount.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                  2
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Apply for Advance</h3>
                  <p className="text-gray-600">
                    Choose your advance amount based on your expected refund. No credit check 
                    required - approval is based on your tax return.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                  3
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Get Your Money</h3>
                  <p className="text-gray-600">
                    Once approved, receive your advance same-day via direct deposit or prepaid card. 
                    Funds available within hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                  4
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Automatic Repayment</h3>
                  <p className="text-gray-600">
                    When the IRS releases your refund, the advance is automatically repaid. 
                    The remaining balance is deposited to you.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Example Scenario</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Expected IRS Refund</span>
                  <span className="font-bold text-gray-900">$5,500</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Refund Advance Received</span>
                  <span className="font-bold text-brand-blue-600">$3,000</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Advance Fee</span>
                  <span className="font-bold text-gray-900">$0*</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-brand-green-50 px-4 rounded-lg">
                  <span className="text-gray-900 font-semibold">Remaining Refund</span>
                  <span className="font-bold text-brand-green-600 text-xl">$2,500</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                *0% APR advances available for qualifying returns. Some advances may have fees. 
                See terms and conditions for details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Eligibility Requirements
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-brand-green-50 rounded-xl p-6 border border-brand-green-200">
              <h3 className="text-xl font-bold text-brand-green-800 mb-4 flex items-center">
                <span className="text-slate-500 flex-shrink-0">•</span>
                What You Need
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-gray-700">Valid government-issued ID</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-gray-700">Social Security card or ITIN</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-gray-700">W-2s, 1099s, or other income documents</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-gray-700">Expected refund of at least $1,000</span>
                </li>
              </ul>
            </div>

            <div className="bg-brand-red-50 rounded-xl p-6 border border-brand-red-200">
              <h3 className="text-xl font-bold text-brand-red-800 mb-4 flex items-center">
                <AlertCircle className="w-6 h-6 mr-2" />
                May Not Qualify If
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-brand-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">IRS owes you back taxes or child support</span>
                </li>
                <li className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-brand-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Previous refund advance was not repaid</span>
                </li>
                <li className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-brand-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Return requires additional IRS review</span>
                </li>
                <li className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-brand-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Refund amount is uncertain</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Important Disclosures */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Important Information
          </h2>

          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                  <FileText className="w-5 h-5 text-brand-blue-600 mr-2" />
                  This is a Loan
                </h3>
                <p className="text-gray-600">
                  A refund advance is a loan based on your anticipated tax refund. It is not your 
                  actual refund. The loan must be repaid from your refund when it is received from the IRS.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                  <Clock className="w-5 h-5 text-brand-blue-600 mr-2" />
                  Timing
                </h3>
                <p className="text-gray-600">
                  Refund advances are typically available from January through mid-February. 
                  Availability may vary by location and is subject to change.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                  <DollarSign className="w-5 h-5 text-brand-blue-600 mr-2" />
                  Fees and APR
                </h3>
                <p className="text-gray-600">
                  Some refund advances have 0% APR and no fees. Others may have fees depending on 
                  the advance amount and your tax situation. All fees will be disclosed before you accept.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-yellow-800">
                  <strong>Disclaimer:</strong> Refund advances are provided by EPS Financial, Member FDIC. 
                  Approval and advance amounts are subject to underwriting criteria. Not all applicants 
                  will qualify. See your tax professional for complete terms and conditions.
                </p>
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
              <h3 className="font-bold text-gray-900 mb-2">Will this affect my credit score?</h3>
              <p className="text-gray-600">
                No. Refund advances do not require a credit check and are not reported to credit bureaus. 
                Your credit score will not be affected.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">What if my refund is less than expected?</h3>
              <p className="text-gray-600">
                If your actual refund is less than the advance amount, you may be responsible for 
                repaying the difference. This is why we carefully estimate your refund before approval.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">How fast can I get my money?</h3>
              <p className="text-gray-600">
                Most approved advances are funded the same day. Funds can be deposited to your bank 
                account or loaded onto a prepaid card within hours of approval.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Can I get an advance if I owe back taxes?</h3>
              <p className="text-gray-600">
                If you owe back taxes, the IRS may offset your refund to pay the debt. This could 
                affect your eligibility for an advance or the amount you can receive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Need Cash Now?
          </h2>
          <p className="text-xl mb-8 text-white">
            Get up to $6,000 today with a refund advance. No credit check required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tax"
              className="bg-white hover:bg-white text-brand-blue-700 px-8 py-4 rounded-lg text-lg font-bold transition-all inline-flex items-center justify-center"
            >
              Apply Now <ArrowRight className="ml-2 w-5 h-5" />
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
