import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, Users, Award, Clock, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Become a Mentor | Elevate for Humanity',
  description: 'Volunteer as a mentor for workforce training students. Share your industry experience and help shape careers in healthcare, trades, CDL, and technology.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/mentorship/become-mentor' },
};

export default function BecomeMentorPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Mentorship', href: '/mentorship' }, { label: 'Become a Mentor' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Heart className="w-12 h-12 text-brand-red-400 mx-auto mb-4" />
          <h1 className="text-4xl font-black text-slate-900 mb-4">Become a Mentor</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">Share your industry experience with students building new careers. A few hours a month can change someone&apos;s trajectory.</p>
        </div>
      </section>

      {/* What Mentors Do */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">What Mentors Do</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Career Guidance', desc: 'Help students understand industry expectations, workplace culture, and career pathways.' },
              { icon: Award, title: 'Skills Coaching', desc: 'Share practical knowledge from your field — interview tips, resume feedback, professional conduct.' },
              { icon: Clock, title: 'Flexible Commitment', desc: '2-4 hours per month. Meet in person, by phone, or video. Work around your schedule.' },
              { icon: Heart, title: 'Community Impact', desc: 'Many of our students are first-generation professionals. Your guidance has outsized impact.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 border border-slate-200">
                <item.icon className="w-8 h-8 text-brand-red-600 mb-3" />
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Mentor Requirements</h2>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <ul className="space-y-3">
              {[
                'At least 2 years of professional experience in your field',
                'Willingness to commit 2-4 hours per month for at least 6 months',
                'Pass a basic background check',
                'Attend a 1-hour mentor orientation session',
                'Genuine interest in helping others build careers',
              ].map((req, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700">
                  <span className="w-6 h-6 bg-brand-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Ready to Make a Difference?</h2>
          <p className="text-slate-600 mb-8">Fill out the mentor interest form and our team will reach out within a week.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/forms/host-shop-inquiry" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors">
              Apply to Mentor <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/mentorship" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-lg transition-colors border border-white/30">
              Back to Mentorship
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
