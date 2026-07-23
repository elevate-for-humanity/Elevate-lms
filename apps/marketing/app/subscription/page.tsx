export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { CreditCard, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Subscription',
  keywords: ["subscription", "platform access", "workforce LMS"], description: 'Manage your Elevate platform subscription.',
};

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-blue-200">Manage your platform subscription.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Current Subscription</h2>
            <div className="bg-slate-50 rounded-xl p-6 mb-6">
              <p className="text-slate-600">Contact our team to discuss subscription options for your organization.</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3"><Check className="w-5 h-5 text-green-600" /><span className="text-slate-600">Unlimited students</span></div>
              <div className="flex items-center gap-3"><Check className="w-5 h-5 text-green-600" /><span className="text-slate-600">Admin dashboard access</span></div>
              <div className="flex items-center gap-3"><Check className="w-5 h-5 text-green-600" /><span className="text-slate-600">WIOA reporting tools</span></div>
            </div>
            <div className="text-center">
              <Link href="/contact" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
