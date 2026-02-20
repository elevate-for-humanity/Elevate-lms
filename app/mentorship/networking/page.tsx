export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Circle, ArrowRight, Briefcase, MessageSquare, Globe } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Networking Mentorship | Elevate for Humanity',
  description: 'Build your professional network with mentor guidance. Learn networking strategies and make valuable connections.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/mentorship/networking' },
};

export default async function NetworkingPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('mentors').select('*').limit(50);

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Mentorship", href: "/mentorship" }, { label: "Networking" }]} />
      </div>
<div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-brand-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/mentorship" className="hover:text-brand-blue-600">Mentorship</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Networking</span>
          </nav>
        </div>
      </div>

      <section className="relative h-[350px] flex items-center justify-center text-white overflow-hidden">
        <Image src="/images/gallery/image4.jpg" alt="Professional Networking" fill className="object-cover" priority sizes="100vw" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-white/80" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Professional Networking</h1>
          <p className="text-xl text-brand-blue-100">Build connections that advance your career</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Networking Support</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-brand-blue-50 rounded-xl p-6 text-center">
              <Briefcase className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Industry Introductions</h3>
              <p className="text-gray-600">Get introduced to professionals in your target industry</p>
            </div>
            <div className="bg-brand-blue-50 rounded-xl p-6 text-center">
              <MessageSquare className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Networking Coaching</h3>
              <p className="text-gray-600">Learn effective networking strategies and techniques</p>
            </div>
            <div className="bg-brand-blue-50 rounded-xl p-6 text-center">
              <Globe className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Event Access</h3>
              <p className="text-gray-600">Attend exclusive networking events and meetups</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What You Will Learn</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'How to introduce yourself professionally',
              'Building and maintaining professional relationships',
              'Leveraging LinkedIn and social media',
              'Following up after networking events',
              'Asking for informational interviews',
              'Building your personal brand',
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-lg p-4 flex items-center shadow-sm">
                <Circle className="w-5 h-5 text-brand-blue-600 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Expand Your Network</h2>
          <p className="text-xl text-brand-blue-100 mb-8">Get guidance on building meaningful professional connections.</p>
          <Link href="/apply" className="bg-white hover:bg-gray-100 text-brand-blue-700 px-8 py-4 rounded-lg text-lg font-bold transition inline-flex items-center">
            Apply for Mentorship <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
