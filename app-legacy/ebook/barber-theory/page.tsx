import { Metadata } from 'next';
import Link from 'next/link';
import { Book, Scissors, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Barber Theory | Elevate for Humanity',
  description: 'Access barber theory coursework and study materials for your apprenticeship.',
};

export default function BarberTheoryPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Barber Theory Course</h1>
          <p className="text-blue-200">Online coursework to complement your hands-on apprenticeship training.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Course Overview</h2>
          <p className="text-slate-600 mb-6">This online theory course covers the foundational knowledge you need for your barber apprenticeship, including sanitation, hairstyling theory, and state board preparation.</p>
          <div className="bg-white rounded-xl p-6 shadow mb-6">
            <h3 className="font-bold mb-4">What You&apos;ll Learn</h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2"><Award className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />Sanitation and sterilization procedures</li>
              <li className="flex items-start gap-2"><Award className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />Hair structure and chemistry</li>
              <li className="flex items-start gap-2"><Award className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />State board exam preparation</li>
            </ul>
          </div>
          <div className="text-center">
            <Link href="/check-eligibility" className="bg-brand-orange-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-orange-700">Check Eligibility</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
