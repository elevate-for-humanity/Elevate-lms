import { Metadata } from 'next';
import Link from 'next/link';
import { DollarSign } from 'lucide-react';
export const metadata: Metadata = { title: 'Pricing | Elevate', keywords: ["tuition", "pricing", "WIOA funding", "financial aid", "Indiana"], description: 'Program pricing.' };
export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Tuition & Funding</h1>
          <p className="text-green-200">Most programs may be covered through WIOA.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <DollarSign className="w-16 h-16 text-green-600 mx-auto mb-6" />
          <p className="text-slate-600 mb-6">Check your eligibility for free training.</p>
          <Link href="/check-eligibility" className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700">Check Eligibility</Link>
        </div>
      </section>
    </div>
  );
}
