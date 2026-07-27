import { Metadata } from 'next';
import Link from 'next/link';
import { CreditCard, Calendar, Check, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Subscription | Host Shop Portal',
  keywords: ["subscription", "platform access", "host shop"],
  description: 'Manage your host shop subscription and billing.',
};

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl font-bold text-slate-900">Subscription</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your host shop subscription and billing</p>
        </div>
      </section>

      {/* Current Plan */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Current Plan</h2>
                  <p className="text-sm text-slate-500">Your active subscription</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  Active
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-slate-900">$99</span>
                <span className="text-slate-500">/month</span>
              </div>
              <p className="text-sm text-slate-600 mb-6">Host Shop Portal License</p>
              <div className="space-y-3 mb-6">
                {['Up to 5 apprentices', 'Apprentice hour tracking', 'Competency verification', 'OJL logging', 'Email support'].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                Next billing date: Next month
              </div>
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Billing History</h2>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center" />
                  <div>
                    <p className="font-medium text-slate-900">Host Shop License</p>
                    <p className="text-sm text-slate-500">July 2025</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">$99.00</p>
                  <p className="text-sm text-green-600">Paid</p>
                </div>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Need to upgrade or cancel?</p>
              <p className="text-amber-700 mt-1">Contact our support team to modify your subscription.</p>
              <Link href="/contact" className="text-amber-800 font-medium hover:underline mt-2 inline-block">
                Contact Support →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}