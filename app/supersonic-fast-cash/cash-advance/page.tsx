import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  DollarSign, 
  Clock, 
  
  AlertCircle,
  ArrowRight,
  HelpCircle,
  Phone
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tax Refund Cash Advance | Supersonic Fast Cash LLC',
  description: 'Learn about optional refund advances. Access a portion of your tax refund early through our banking partners.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/cash-advance',
  },
};

export default function CashAdvancePage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Cash Advance" }]} />
      </div>
{/* Hero */}
      <section className="bg-brand-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            Tax Refund Cash Advance
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Access a portion of your expected refund early. Optional and eligibility-based.
          </p>
        </div>
      </section>

      {/* What Is It */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            What is a Tax Refund Cash Advance?
          </h2>
          <p className="text-gray-600 mb-6">
            A tax refund cash advance allows eligible filers to receive a portion of their 
            expected tax refund before the IRS processes their return. The advance is provided 
            through our banking partners and is repaid automatically when your refund arrives.
          </p>
          
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 mb-1">This is not a loan</p>
                <p className="text-gray-600 text-sm">
                  The advance is based on your expected refund and is repaid from that refund. 
                  You do not make separate payments.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
              <DollarSign className="w-8 h-8 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Advance Amounts</h3>
              <p className="text-2xl font-bold text-brand-blue-600 mb-1">$250 – $7,500</p>
              <p className="text-sm text-gray-500">Based on expected refund</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
              <Clock className="w-8 h-8 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Timing</h3>
              <p className="text-2xl font-bold text-brand-blue-600 mb-1">Same Day</p>
              <p className="text-sm text-gray-500">If approved</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <h3 className="font-semibold text-gray-900 mb-2">Repayment</h3>
              <p className="text-2xl font-bold text-brand-blue-600 mb-1">Automatic</p>
              <p className="text-sm text-gray-500">From your refund</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-10">
            How It Works
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Complete Your Tax Return</h3>
                <p className="text-gray-600">
                  File your tax return with us. The advance option is only available after 
                  your return is prepared and your expected refund is calculated.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Choose to Apply (Optional)</h3>
                <p className="text-gray-600">
                  If you want early access to your refund, you can apply for an advance. 
                  This step is completely optional.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Bank Reviews Your Application</h3>
                <p className="text-gray-600">
                  Our banking partner reviews your application and determines eligibility. 
                  Approval is not guaranteed.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Receive Funds</h3>
                <p className="text-gray-600">
                  If approved, receive your advance same day. When your full refund arrives 
                  from the IRS, the advance is automatically repaid.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Disclosures */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Important Information
          </h2>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Please Read Carefully</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Optional:</strong> Refund advances are not required to file your tax return</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Eligibility:</strong> Not all taxpayers qualify for an advance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Bank Decision:</strong> Approval is determined by the bank, not the tax preparer</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Fees:</strong> Bank fees may apply and are separate from tax preparation fees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Disclosure:</strong> All terms and costs are disclosed before you accept</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Eligibility Factors</h3>
            <p className="text-gray-600 mb-4">
              The bank considers several factors when reviewing advance applications:
            </p>
            <ul className="grid sm:grid-cols-2 gap-2 text-gray-700 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                Expected refund amount
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                Tax return accuracy
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                Filing history
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                Identity verification
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-10">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Is this a loan?</h3>
                  <p className="text-gray-600 text-sm">
                    No. The advance is based on your expected tax refund and is repaid 
                    automatically from that refund. You do not make separate payments.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">What if my refund is less than expected?</h3>
                  <p className="text-gray-600 text-sm">
                    If the IRS adjusts your refund, you may owe the difference. This is why 
                    advance amounts are typically less than your full expected refund.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Do I have to take the advance?</h3>
                  <p className="text-gray-600 text-sm">
                    No. The advance is completely optional. You can file your taxes and 
                    wait for your refund from the IRS without taking an advance.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">What are the fees?</h3>
                  <p className="text-gray-600 text-sm">
                    Fees vary by advance amount and are determined by the banking partner. 
                    All fees are disclosed before you accept the advance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Questions?
          </h2>
          <p className="text-gray-600 mb-8">
            Contact us to discuss your options and eligibility.
          </p>
          <a
            href="/support"
            className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Phone className="w-5 h-5" />
            Get Help Online
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold text-white mb-4">
            Ready to file your taxes?
          </h2>
          <p className="text-brand-blue-200 mb-8">
            Start your return first. Advance options are available after filing.
          </p>
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-flex items-center justify-center px-8 py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Start Tax Preparation
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
