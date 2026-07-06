import { Metadata } from 'next';
import Link from 'next/link';
import { DollarSign, Percent, CreditCard } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tuition & Funding | Elevate for Humanity',
  description: 'Learn about tuition costs and funding options for workforce training programs.',
};

export default function TuitionPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Tuition & Funding</h1>
          <p className="text-green-200">Most programs may be covered through WIOA and other funding sources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">WIOA Funding</h3>
              <p className="text-slate-600 text-sm">May cover 100% of tuition for eligible participants</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <Percent className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Payment Plans</h3>
              <p className="text-slate-600 text-sm">Affordable monthly payments available</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <CreditCard className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Employer Sponsorship</h3>
              <p className="text-slate-600 text-sm">Some employers cover training costs</p>
            </div>
          </div>
          <div className="bg-green-50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Check Your Eligibility</h2>
            <p className="text-slate-600 mb-6">Find out if you qualify for free or reduced-cost training.</p>
            <Link href="/check-eligibility" className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700">Check Eligibility</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
