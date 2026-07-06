import { Metadata } from 'next';
import Link from 'next/link';
import { Users, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Team | Elevate for Humanity',
  keywords: ["team", "staff", "workforce development", "Elevate staff"], description: 'Meet the dedicated team at Elevate for Humanity working to empower individuals through workforce training.',
};

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Our Team</h1>
          <p className="text-blue-200">Dedicated professionals committed to workforce development.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center">Meet the Team</h2>
          <p className="text-slate-600 text-center mb-8">Our team brings together decades of experience in education, workforce development, and career services. We&apos;re united by a shared mission: helping individuals achieve economic mobility through quality training and employment.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow text-center">
              <div className="w-24 h-24 bg-brand-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-12 h-12 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-lg">Leadership Team</h3>
              <p className="text-slate-600 text-sm mt-2">Visionary leaders driving our mission forward.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow text-center">
              <div className="w-24 h-24 bg-brand-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Heart className="w-12 h-12 text-brand-orange-600" />
              </div>
              <h3 className="font-bold text-lg">Instructors</h3>
              <p className="text-slate-600 text-sm mt-2">Industry-experienced educators preparing students for careers.</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/about" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Learn More About Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
