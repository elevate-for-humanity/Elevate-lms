import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workforce Training | Elevate for Humanity',
  keywords: ["security", "data protection", "privacy", "FERPA"], description: 'Workforce training programs with WIOA funding available.',
};

export default function ProgramPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Workforce Training</h1>
          <p className="text-xl text-blue-100">Get job-ready skills with WIOA funding available.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-slate-600 mb-6">Check your eligibility for WIOA funding.</p>
          <Link href="/check-eligibility" className="bg-brand-orange-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-orange-600">Check Eligibility</Link>
        </div>
      </section>
    </div>
  );
}
