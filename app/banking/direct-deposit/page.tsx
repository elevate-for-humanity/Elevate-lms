import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Zap,
  Shield,
  Clock,
  Building,
  ArrowRight,
  AlertCircle,
  FileText,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Direct Deposit - Get Your Refund Faster | Elevate for Humanity',
  description:
    'Set up direct deposit for your tax refund. The fastest, most secure way to receive your money. FDIC insured through EPS Financial.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/banking/direct-deposit',
  },
};

export default function DirectDepositPage() {
  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Banking", href: "/banking" }, { label: "Direct Deposit" }]} />
      </div>
{/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-brand-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/banking" className="hover:text-brand-blue-600">Banking</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Direct Deposit</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[350px] md:h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/programs/efh-business-startup-marketing-hero.jpg"
          alt="Direct Deposit"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Direct Deposit
          </h1>
          <p className="text-xl md:text-2xl mb-6">
            The fastest way to receive your tax refund
          </p>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-12 bg-brand-green-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <Zap className="w-10 h-10 text-brand-green-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Fastest Method</h3>
              <p className="text-sm text-gray-600">Get your refund 2-3 weeks faster than paper checks</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <Shield className="w-10 h-10 text-brand-green-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">100% Secure</h3>
              <p className="text-sm text-gray-600">FDIC insured and encrypted transfers</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <h3 className="font-bold text-gray-900 mb-2">No Fees</h3>
              <p className="text-sm text-gray-600">Direct deposit is completely free</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <Clock className="w-10 h-10 text-brand-green-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Track Status</h3>
              <p className="text-sm text-gray-600">Monitor your refund in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            How Direct Deposit Works
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-brand-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    1
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Provide Your Bank Info</h3>
                    <p className="text-gray-600">
                      During tax preparation, provide your bank routing number and your account number. 
                      You can find these on a check or through your bank online portal.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-brand-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    2
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">IRS Processes Your Return</h3>
                    <p className="text-gray-600">
                      Once your return is accepted, the IRS processes it and schedules your refund. 
                      E-filed returns with direct deposit are processed fastest.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-brand-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    3
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Funds Deposited</h3>
                    <p className="text-gray-600">
                      Your refund is electronically deposited directly into your bank account. 
                      Most refunds arrive within 21 days of acceptance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">What You Need</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Building className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Bank Routing Number</p>
                    <p className="text-sm text-gray-600">9-digit number identifying your bank</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <FileText className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Account Number</p>
                    <p className="text-sm text-gray-600">Your personal checking or savings account number</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <div>
                    <p className="font-semibold text-gray-900">Account Type</p>
                    <p className="text-sm text-gray-600">Checking or Savings designation</p>
                  </div>
                </li>
              </ul>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Double-check your account numbers. Incorrect information can delay your refund by weeks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Expected Timeline
          </h2>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-brand-green-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Filing Method</th>
                  <th className="px-6 py-4 text-left">Refund Method</th>
                  <th className="px-6 py-4 text-left">Expected Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-brand-green-50">
                  <td className="px-6 py-4 font-medium">E-File</td>
                  <td className="px-6 py-4">Direct Deposit</td>
                  <td className="px-6 py-4 text-brand-green-600 font-bold">~21 days</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">E-File</td>
                  <td className="px-6 py-4">Paper Check</td>
                  <td className="px-6 py-4">~4-6 weeks</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Paper File</td>
                  <td className="px-6 py-4">Direct Deposit</td>
                  <td className="px-6 py-4">~6-8 weeks</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Paper File</td>
                  <td className="px-6 py-4">Paper Check</td>
                  <td className="px-6 py-4">~8-12 weeks</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-center text-gray-600 mt-4 text-sm">
            Times are estimates. Actual processing may vary based on IRS workload and return complexity.
          </p>
        </div>
      </section>

      {/* Split Refund Option */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-brand-blue-50 border-2 border-brand-blue-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Split Your Refund
            </h2>
            <p className="text-gray-700 mb-6">
              Did you know you can split your refund into up to three different accounts? 
              This is a great way to automatically save a portion of your refund.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-brand-blue-600">50%</p>
                <p className="text-sm text-gray-600">Checking Account</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-brand-green-600">30%</p>
                <p className="text-sm text-gray-600">Savings Account</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-brand-blue-600">20%</p>
                <p className="text-sm text-gray-600">IRA or Investment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-2">Can I use any bank account?</h3>
              <p className="text-gray-600">
                Yes, you can use any U.S. bank account that accepts electronic deposits. This includes 
                checking accounts, savings accounts, and many prepaid debit card accounts.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-2">What if I enter the wrong account number?</h3>
              <p className="text-gray-600">
                If the account number is invalid, the bank will reject the deposit and the IRS will 
                mail you a paper check. If the account belongs to someone else, recovering the funds 
                can be difficult. Always double-check your information.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-2">Can I track my refund status?</h3>
              <p className="text-gray-600">
                Yes! Use the IRS Where is My Refund tool at irs.gov or the IRS2Go mobile app. 
                You will need your Social Security number, filing status, and exact refund amount.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-2">Is direct deposit safe?</h3>
              <p className="text-gray-600">
                Absolutely. Direct deposit is the most secure way to receive your refund. There is no 
                risk of a check being lost, stolen, or delayed in the mail. All transfers are encrypted 
                and FDIC insured.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to File Your Taxes?
          </h2>
          <p className="text-xl mb-8 text-brand-green-100">
            Set up direct deposit and get your refund faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tax"
              className="bg-white hover:bg-gray-100 text-brand-green-700 px-8 py-4 rounded-lg text-lg font-bold transition-all inline-flex items-center justify-center"
            >
              File Your Taxes <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/banking"
              className="bg-brand-green-600 hover:bg-brand-green-500 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all border-2 border-white"
            >
              View All Banking Options
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
