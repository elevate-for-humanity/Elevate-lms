export const revalidate = 3600;

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WIOA Eligibility Requirements',
  description: 'Find out if you qualify for WIOA-funded workforce training. Indiana residents may be eligible for free or subsidized career programs through WorkOne.',
};

export default function WIOAEligibilityPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Wioa Eligibility</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}

