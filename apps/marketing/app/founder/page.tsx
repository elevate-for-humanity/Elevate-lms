import { Metadata } from 'next';
import Link from 'next/link';
import { User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Founder',
  keywords: ["founder", "leadership", "Elevate for Humanity"], description: 'Meet the founder of Elevate for Humanity.',
};

export default function FounderPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Our Founder</h1>
          <p className="text-blue-200">Leading with purpose and vision.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-32 h-32 bg-brand-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <User className="w-16 h-16 text-brand-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Elevate for Humanity</h2>
            <p className="text-slate-600 mb-6">Our founder established Elevate for Humanity with a vision to create pathways from unemployment to employment.</p>
            <Link href="/about" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Our Story</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
