import { Metadata } from 'next';
import Link from 'next/link';
import { Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Team | Elevate for Humanity',
  description: 'Meet the Elevate for Humanity team.',
};

export default function AboutTeamPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Our Team</h1>
          <p className="text-blue-200">Passionate professionals dedicated to your success.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center">Meet Our Team</h2>
          <p className="text-slate-600 text-center mb-8">Our team includes educators, career counselors, workforce development specialists, and administrative professionals.</p>
          <div className="text-center">
            <Link href="/about" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">About Elevate</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
