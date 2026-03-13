
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Target, ArrowRight, Calendar, TrendingUp, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Goal Setting Mentorship | Elevate for Humanity',
  description: 'Set and achieve meaningful career goals with mentor support. Create actionable plans for your professional growth.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/mentorship/goal-setting' },
};

export default function GoalSettingPage() {

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Mentorship", href: "/mentorship" }, { label: "Goal Setting" }]} />
      </div>
<div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-brand-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/mentorship" className="hover:text-brand-blue-600">Mentorship</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Goal Setting</span>
          </nav>
        </div>
      </div>

      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/pages/goal-setting-hero.jpg" alt="Goal Setting" fill className="object-cover" priority sizes="100vw" />
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">SMART Goal Framework</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Your mentor will help you create goals that are Specific, Measurable, Achievable, Relevant, and Time-bound.
          </p>
          <div className="space-y-4">
            {[
              { letter: 'S', word: 'Specific', desc: 'Clearly define what you want to accomplish' },
              { letter: 'M', word: 'Measurable', desc: 'Establish criteria to track your progress' },
              { letter: 'A', word: 'Achievable', desc: 'Set realistic goals within your capabilities' },
              { letter: 'R', word: 'Relevant', desc: 'Align goals with your career aspirations' },
              { letter: 'T', word: 'Time-bound', desc: 'Set deadlines to create urgency and focus' },
            ].map((item, i) => (
              <div key={i} className="flex items-center bg-brand-orange-50 rounded-lg p-4">
                <div className="w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl mr-4">{item.letter}</div>
                <div>
                  <h3 className="font-bold text-gray-900">{item.word}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">What We Help With</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <Calendar className="w-12 h-12 text-brand-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Short-term Goals</h3>
              <p className="text-gray-600">Weekly and monthly objectives to build momentum</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <TrendingUp className="w-12 h-12 text-brand-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Long-term Vision</h3>
              <p className="text-gray-600">1-5 year career plans and milestones</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <Award className="w-12 h-12 text-brand-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Accountability</h3>
              <p className="text-gray-600">Regular check-ins to keep you on track</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Set Goals That Matter</h2>
          <p className="text-xl text-brand-orange-100 mb-8">Work with a mentor to create your roadmap to success.</p>
          <Link href="/start" className="bg-white hover:bg-gray-100 text-brand-orange-600 px-8 py-4 rounded-lg text-lg font-bold transition inline-flex items-center">
            Apply for Mentorship <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
