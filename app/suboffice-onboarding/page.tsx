import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  Upload,
  FileText,
  Users,
  DollarSign,
  AlertCircle,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Suboffice Onboarding | Partner with Elevate for Humanity',
  description:
    'Open a tax preparation suboffice. Complete onboarding, upload PTIN/EFIN, pass compliance test, and start earning revenue share.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/suboffice-onboarding',
  },
};

export default function SubofficeOnboardingPage() {
  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Suboffice Onboarding" }]} />
      </div>
{/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/suboffice-onboarding-page-1.jpg"
          alt="Suboffice Onboarding"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        

      </section>

      {/* How You Get Paid - CRITICAL */}
      <section className="py-16 bg-brand-blue-900">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <DollarSign className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How You Get Paid
            </h2>
            <p className="text-xl">
              Understanding Revenue Share & Payment Timing
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-lg p-8 mb-8">
            <h3 className="text-2xl font-bold mb-6">Revenue Share Structure</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <div>
                  <strong>40/60 Split:</strong> Main office gets 40%, you keep
                  60% of base tax prep fee
                </div>
              </div>
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0 mt-1 text-yellow-300" />
                <div>
                  <strong>Add-On Fees:</strong> Main office keeps 100% of all
                  add-on fees (refund advances, prepaid cards, etc.)
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <div>
                  <strong>Software Included:</strong> Professional tax software, training,
                  and support included - NO extra costs to you
                </div>
              </div>
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0 mt-1 text-yellow-300" />
                <div>
                  <strong>Payment Timing:</strong> You get paid ONLY after IRS
                  releases client refunds
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/20 border-2 border-yellow-300 rounded-lg p-6 mb-8">
            <h4 className="text-xl font-bold mb-4 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2" />
              IMPORTANT: IRS Payment Release Process
            </h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white text-brand-blue-900 rounded-full flex items-center justify-center font-bold mr-3">
                  1
                </div>
                <span>Client files tax return</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white text-brand-blue-900 rounded-full flex items-center justify-center font-bold mr-3">
                  2
                </div>
                <span>IRS reviews and processes return</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white text-brand-blue-900 rounded-full flex items-center justify-center font-bold mr-3">
                  3
                </div>
                <span>IRS releases refund to client</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white text-brand-blue-900 rounded-full flex items-center justify-center font-bold mr-3">
                  4
                </div>
                <span>Payment released to main office</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-brand-orange-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  5
                </div>
                <span>
                  <strong>Your revenue share distributed</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-brand-red-500/20 border-2 border-brand-red-300 rounded-lg p-6">
            <p className="text-lg">
              <strong>
                If IRS delays or offsets a refund, your payout for that client
                is delayed.
              </strong>{' '}
              This is standard industry practice and protects both parties.
            </p>
          </div>
        </div>
      </section>

      {/* Onboarding Steps */}
      <section id="start" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-12 text-center">
            Onboarding Process
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3 text-center">
                Step 1: Business Info
              </h3>
              <ul className="space-y-2 text-black">
                <li>• Legal business name</li>
                <li>• EIN/FEIN number</li>
                <li>• Business address</li>
                <li>• Contact information</li>
                <li>• Office hours</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-brand-green-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3 text-center">
                Step 2: Upload Documents
              </h3>
              <ul className="space-y-2 text-black">
                <li>
                  • <strong>PTIN</strong> for each preparer
                </li>
                <li>
                  • <strong>EFIN</strong> (IRS E-File ID)
                </li>
                <li>• Business license</li>
                <li>• Insurance certificate</li>
                <li>• ID verification</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3 text-center">
                Step 3: Staff & Payroll
              </h3>
              <ul className="space-y-2 text-black">
                <li>• Add preparers/admins</li>
                <li>• PTIN for each staff</li>
                <li>• Payroll information</li>
                <li>• ACH setup</li>
                <li>• W-9 forms</li>
              </ul>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-brand-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-brand-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3 text-center">
                Step 4: Compliance Test
              </h3>
              <ul className="space-y-2 text-black">
                <li>• IRS ethics & privacy</li>
                <li>• Data security</li>
                <li>• PTIN requirements</li>
                <li>• E-file procedures</li>
                <li>• Pass/fail with retake</li>
              </ul>
            </div>

            {/* Step 5 */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-3 text-center">
                Step 5: Training
              </h3>
              <ul className="space-y-2 text-black">
                <li>• Software training</li>
                <li>• Workflow procedures</li>
                <li>• Quality standards</li>
                <li>• Support resources</li>
                <li>• Certificate issued</li>
              </ul>
            </div>

            {/* Step 6 */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3 text-center">
                Step 6: Agreements
              </h3>
              <ul className="space-y-2 text-black">
                <li>• Revenue share agreement</li>
                <li>• Software license</li>
                <li>• Privacy policy</li>
                <li>• E-signature required</li>
                <li>• Activation!</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Required Acknowledgments */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-8 text-center">
            Required Acknowledgments
          </h2>

          <div className="space-y-6">
            <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
              <label className="flex items-start cursor-pointer">
                <input type="checkbox" className="mt-1 mr-4 w-5 h-5" required />
                <span className="text-black">
                  <strong>I understand revenue is shared 40/60</strong> (main
                  office 40%, suboffice 60%) and payments are only made after
                  IRS releases the refund to main office.
                </span>
              </label>
            </div>

            <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
              <label className="flex items-start cursor-pointer">
                <input type="checkbox" className="mt-1 mr-4 w-5 h-5" required />
                <span className="text-black">
                  <strong>
                    I understand all add-on fees go to main office
                  </strong>{' '}
                  (refund advances, prepaid cards, bank products, etc.).
                </span>
              </label>
            </div>

            <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
              <label className="flex items-start cursor-pointer">
                <input type="checkbox" className="mt-1 mr-4 w-5 h-5" required />
                <span className="text-black">
                  <strong>
                    I understand software, training, and support are included
                  </strong>{' '}
                  with no additional monthly fees.
                </span>
              </label>
            </div>

            <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
              <label className="flex items-start cursor-pointer">
                <input type="checkbox" className="mt-1 mr-4 w-5 h-5" required />
                <span className="text-black">
                  <strong>
                    I understand payroll/commissions cannot be run
                  </strong>{' '}
                  until IRS has processed and released each client's refund.
                </span>
              </label>
            </div>

            <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
              <label className="flex items-start cursor-pointer">
                <input type="checkbox" className="mt-1 mr-4 w-5 h-5" required />
                <span className="text-black">
                  <strong>I have downloaded and reviewed</strong> the complete
                  payout policy and billing schedule.
                </span>
              </label>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/suboffice-onboarding/payout-policy.pdf"
              className="text-brand-blue-600 hover:text-brand-blue-800 font-semibold underline"
              target="_blank"
            >
              Download Complete Payout Policy (PDF)
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8">
            Complete onboarding and start earning revenue share today.
          </p>
          <Link
            href="/suboffice-onboarding"
            className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all inline-block"
          >
            Begin Application
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-2">
                What is a PTIN?
              </h3>
              <p className="text-black">
                A Preparer Tax Identification Number (PTIN) is required by the
                IRS for anyone who prepares federal tax returns for
                compensation. Each preparer must have their own PTIN.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-2">
                What is an EFIN?
              </h3>
              <p className="text-black">
                An Electronic Filing Identification Number (EFIN) is issued by
                the IRS to tax professionals who want to file returns
                electronically. Your business needs one EFIN.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-2">
                How long until I get paid?
              </h3>
              <p className="text-black">
                Payment is released after the IRS processes and releases the
                client's refund. This typically takes 21 days for e-filed
                returns with direct deposit, but can vary.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-2">
                What if a client's refund is delayed?
              </h3>
              <p className="text-black">
                If the IRS delays or offsets a refund, your payout for that
                specific client is delayed. This protects both parties and is
                standard industry practice.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-2">
                Can I change the revenue split?
              </h3>
              <p className="text-black">
                The 70/30 split is standard for all suboffices. High-volume
                offices may qualify for better terms after the first year.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
