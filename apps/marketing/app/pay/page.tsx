export const revalidate = 3600;

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CreditCard, DollarSign, ShieldCheck } from 'lucide-react';
import {
  ACTIVE_BNPL_PROVIDERS,
  BNPL_PROVIDER_NAMES,
  DIRECT_PAYMENT_PROVIDERS,
} from '@/lib/bnpl-config';

export const metadata: Metadata = {
  title: 'Tuition Payment Options,
  description:
    'Review self-pay tuition options, Elevate installment estimates, and currently configured third-party payment providers. Public funding requires separate eligibility and written authorization.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/pay' },
};

export default function PayPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Pay' }]} />
      </div>
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">Tuition Payment Options</h1>
        <p className="text-slate-700 mb-6 leading-7">
          If third-party funding is not authorized for your enrollment, review the self-pay options configured for your program. Availability varies by program, amount, provider, and account configuration.
        </p>

        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue-700" />
            <div>
              <h2 className="text-xl font-bold text-brand-blue-900 mb-2">Check funding eligibility before choosing self-pay</h2>
              <p className="text-slate-800 mb-4 leading-6">
                WIOA, Workforce Ready Grant, employer, vocational-rehabilitation, or other assistance may be available for some participants and programs. The responsible agency determines eligibility, covered costs, available funds, and written authorization. Funding is not guaranteed.
              </p>
              <Link href="/check-eligibility" className="inline-block px-6 py-3 bg-brand-blue-700 text-white font-bold rounded-lg hover:bg-brand-blue-800">
                Review Eligibility Path
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border-2 border-brand-green-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center"><DollarSign className="w-6 h-6 text-brand-green-700" /></div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-black mb-2">Pay in Full</h3>
                <p className="text-slate-600 leading-6">
                  Programs with active self-pay pricing can use the program checkout flow. Enrollment activation occurs only after the applicable payment, agreements, documents, and onboarding controls are complete.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-brand-blue-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center"><CreditCard className="w-6 h-6 text-brand-blue-700" /></div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-black mb-2">Third-Party Installment Options</h3>
                <p className="text-slate-600 mb-4 leading-6">
                  {BNPL_PROVIDER_NAMES || 'Installment providers'} may be offered for eligible transactions. Approval, APR, payment schedule, limits, and other terms are determined by each provider and may differ by transaction.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVE_BNPL_PROVIDERS.map((provider) => (
                    <span key={provider.id} className={`px-3 py-1 ${provider.badgeBg} ${provider.badgeText} rounded-full text-sm font-medium`}>{provider.name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {DIRECT_PAYMENT_PROVIDERS.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center"><CreditCard className="w-6 h-6 text-slate-700" /></div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-black mb-2">Configured Direct Payment Methods</h3>
                  <p className="text-slate-600 mb-4 leading-6">These are direct payment rails, not financing products. The exact methods displayed in checkout depend on the transaction and active payment configuration.</p>
                  <div className="flex flex-wrap gap-2">
                    {DIRECT_PAYMENT_PROVIDERS.map((provider) => (
                      <span key={provider.id} className={`px-3 py-1 ${provider.badgeBg} ${provider.badgeText} rounded-full text-sm font-medium`}>{provider.name}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-lg font-bold text-black mb-3">Before paying</h3>
          <ul className="space-y-2 text-sm leading-6 text-slate-700">
            <li>• Verify the current tuition and required deposit on the exact program record.</li>
            <li>• Confirm whether any third-party funding has been authorized in writing.</li>
            <li>• Review the provider's terms before accepting an installment product.</li>
            <li>• Complete all program-specific enrollment and onboarding requirements before expecting course access.</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Link href="/programs" className="inline-block px-8 py-4 bg-brand-orange-600 text-white font-bold rounded-lg hover:bg-brand-orange-700 text-lg">View Programs & Tuition</Link>
          <p className="mt-4 text-slate-600">Questions? <Link href="/support" className="text-brand-orange-700 font-bold">Contact support</Link>.</p>
        </div>
      </section>
    </div>
  );
}
