import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Monthly Giving | Elevate for Humanity',
  description: 'Make a recurring monthly gift to support workforce development and transform lives in your community.',
};

const amounts = [25, 50, 100, 250];

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Monthly Giving</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Your recurring gift creates lasting impact by funding workforce training programs month after month.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Choose Your Monthly Impact</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {amounts.map((amount) => (
                <button key={amount} className="p-6 border-2 border-slate-200 rounded-xl hover:border-brand-blue-600 hover:bg-brand-blue-50 transition-colors">
                  <div className="text-2xl font-bold text-slate-900">${amount}</div>
                  <div className="text-slate-500 text-sm">per month</div>
                </button>
              ))}
            </div>
            
            <div className="border-t border-slate-200 pt-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Your Monthly Impact</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-50 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-brand-blue-600 mb-2">$25/mo</div>
                  <p className="text-slate-600 text-sm">Provides study materials for one student</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-brand-blue-600 mb-2">$50/mo</div>
                  <p className="text-slate-600 text-sm">Covers certification exam fees</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-brand-blue-600 mb-2">$100/mo</div>
                  <p className="text-slate-600 text-sm">Funds a week of training</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <button className="bg-brand-blue-600 text-white font-bold py-4 px-12 rounded-lg hover:bg-brand-blue-700 transition-colors text-lg">
                Start Monthly Giving
              </button>
              <p className="text-slate-500 text-sm mt-4">Secure payment via Stripe. Cancel anytime.</p>
            </div>
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 text-white text-center mt-12">
            <h2 className="text-2xl font-bold mb-4">Other Ways to Give</h2>
            <p className="text-blue-100 mb-6">Consider a one-time donation or employer matching gift.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/donate" className="bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
                One-Time Donation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
