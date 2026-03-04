
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ArrowRight, MessageSquare, Calendar, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ongoing Support Mentorship | Elevate for Humanity',
  description: 'Receive continuous support throughout your career journey. Your mentor is there for you every step of the way.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/mentorship/ongoing-support' },
};

export default function OngoingSupportPage() {

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Mentorship", href: "/mentorship" }, { label: "Ongoing Support" }]} />
      </div>
<div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-brand-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/mentorship" className="hover:text-brand-blue-600">Mentorship</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Ongoing Support</span>
          </nav>
        </div>
      </div>

      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/pages/mentorship-page-3.jpg" alt="Ongoing Support" fill className="object-cover" priority sizes="100vw" />
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Support When You Need It</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-teal-50 rounded-xl p-6 text-center">
              <MessageSquare className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Regular Check-ins</h3>
              <p className="text-gray-600">Scheduled sessions to discuss progress and challenges</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-6 text-center">
              <Calendar className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Flexible Scheduling</h3>
              <p className="text-gray-600">Meet when it works for you - in person or virtual</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-6 text-center">
              <Shield className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confidential Space</h3>
              <p className="text-gray-600">A safe environment to discuss any concerns</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Types of Support</h2>
          <div className="space-y-4">
            {[
              'Career transition guidance and emotional support',
              'Help navigating workplace challenges',
              'Encouragement during difficult times',
              'Celebration of your wins and milestones',
              'Advice on work-life balance',
              'Long-term career planning support',
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-lg p-4 flex items-center shadow-sm">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">You Do Not Have to Do This Alone</h2>
          <p className="text-xl text-teal-100 mb-8">Get the ongoing support you need to succeed.</p>
          <Link href="/apply" className="bg-white hover:bg-gray-100 text-teal-700 px-8 py-4 rounded-lg text-lg font-bold transition inline-flex items-center">
            Apply for Mentorship <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
