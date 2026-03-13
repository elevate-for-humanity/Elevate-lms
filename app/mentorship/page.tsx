
import PageVideoHero from '@/components/ui/PageVideoHero';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Users, MessageSquare, Calendar, Star, ArrowRight,
  Phone
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mentorship Program | Elevate For Humanity',
  description: 'Connect with experienced mentors to guide your career journey.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/mentorship',
  },
};

const benefits = [
  'One-on-one guidance from industry professionals',
  'Career advice and job search support',
  'Networking opportunities',
  'Resume and interview coaching',
  'Industry insights and trends',
  'Accountability and motivation',
];

export default function MentorshipPage() {

  return (
    <div className="min-h-screen bg-gray-50">      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Mentorship Program' }]} />
        </div>
      </div>

      <section className="bg-indigo-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Users className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Mentorship Program</h1>
          <p className="text-xl text-indigo-100 mb-8">Get personalized guidance from experienced professionals in your field</p>
          <Link href="/mentorship" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-bold hover:bg-indigo-50">
            Find a Mentor <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Program Benefits</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Mentorship Focus Areas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Career Guidance', href: '/mentorship/career-guidance' },
              { label: 'Goal Setting', href: '/mentorship/goal-setting' },
              { label: 'Industry Insights', href: '/mentorship/industry-insights' },
              { label: 'Networking', href: '/mentorship/networking' },
              { label: 'Ongoing Support', href: '/mentorship/ongoing-support' },
              { label: 'Skill Development', href: '/mentorship/skill-development' },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
                {item.label}
                <ArrowRight className="w-4 h-4 flex-shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, title: 'Apply', desc: 'Tell us about your goals and what you\'re looking for in a mentor' },
              { step: 2, title: 'Match', desc: 'We\'ll connect you with a mentor who fits your needs' },
              { step: 3, title: 'Grow', desc: 'Meet regularly and work toward your career goals' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-indigo-600">{item.step}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Become a Mentor</h2>
          <p className="text-indigo-100 mb-8">Share your experience and help others succeed in their careers.</p>
          <Link href="/mentorship/become-mentor" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-indigo-50">
            Apply to Mentor
          </Link>
        </div>
      </section>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Check your eligibility for funded career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Get Help Online
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
