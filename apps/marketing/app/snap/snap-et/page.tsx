import { Metadata } from 'next';
import Link from 'next/link';
import { Users, DollarSign, Briefcase } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SNAP E&T',
  description: 'SNAP Employment and Training program for workforce development.',
};

export default function SNAPPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">SNAP Employment & Training</h1>
          <p className="text-green-200">Free job training for SNAP recipients in Indiana.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">About SNAP E&T</h2>
          <p className="text-slate-600 mb-6">The SNAP Employment and Training program provides free workforce training to eligible SNAP recipients.</p>
          <div className="bg-white rounded-xl p-6 shadow mb-6">
            <h3 className="font-bold mb-4">Program Benefits</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3"><DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" /><span className="text-slate-600">Free training and certifications</span></li>
              <li className="flex items-start gap-3"><Briefcase className="w-5 h-5 text-green-600 flex-shrink-0" /><span className="text-slate-600">Job placement assistance</span></li>
            </ul>
          </div>
          <div className="text-center">
            <Link href="/check-eligibility" className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700">Check Eligibility</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
