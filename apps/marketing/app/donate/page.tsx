import { Metadata } from 'next';
import Link from 'next/link';
import { Heart } from 'lucide-react';
export const metadata: Metadata = { title: 'Donate', keywords: ["donate", "charity", "support", "workforce development", "Indiana"], description: 'Support workforce development.' };
export default function DonatePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-orange-500 to-brand-orange-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Support Our Mission</h1>
          <p className="text-orange-100">Help individuals achieve economic mobility through workforce training.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Heart className="w-16 h-16 text-brand-orange-500 mx-auto mb-6" />
          <p className="text-slate-600 mb-6">Your donation helps fund training programs for individuals who need it most.</p>
          <Link href="/contact" className="bg-brand-orange-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-orange-700">Contact Us to Donate</Link>
        </div>
      </section>
    </div>
  );
}
