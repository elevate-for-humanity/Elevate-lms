import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Users, Heart, Target, Sparkles, Briefcase, GraduationCap } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Our Team | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Meet the dedicated professionals behind Elevate for Humanity who are committed to workforce development and career success.',
  keywords: ['team', 'staff', 'workforce development', 'career counselors', 'Indianapolis'],
};

const TEAM_MEMBERS = [
  {
    name: 'Elizabeth Greene',
    role: 'Founder & Executive Director',
    bio: 'Visionary leader with a passion for workforce development and community empowerment. Elizabeth founded Elevate for Humanity to bridge the gap between job seekers and meaningful careers.',
    image: '/images/team/elizabeth-greene.webp',
  },
  {
    name: 'Career Counselors',
    role: 'Student Success Team',
    bio: 'Our experienced career counselors guide students through every step of their journey — from program selection to job placement.',
    image: '/hero-images/career-services-hero.webp',
  },
  {
    name: 'Industry Instructors',
    role: 'Technical Training',
    bio: 'Licensed professionals with years of real-world experience in healthcare, trades, beauty, and technology industries.',
    image: '/images/hero/hero-hands-on-training.webp',
  },
];

const VALUES = [
  { icon: Heart, title: 'Compassion', desc: 'We treat every person with dignity and respect, meeting them where they are.' },
  { icon: Target, title: 'Results', desc: 'Our success is measured by employment outcomes, not just program completions.' },
  { icon: Sparkles, title: 'Innovation', desc: 'We continuously improve our methods to serve students and employers better.' },
  { icon: Briefcase, title: 'Partnership', desc: 'We work together with employers, agencies, and community organizations.' },
];

export default function AboutTeamPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/pages/team-collaboration.webp" alt="Elevate for Humanity leadership team" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-blue-300 font-semibold mb-4 uppercase tracking-wide text-sm">Meet the Team</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Passionate Professionals Dedicated to Your Success
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Our team combines decades of experience in workforce development, education, and industry 
              to help you achieve your career goals.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              These principles guide everything we do at Elevate for Humanity.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((value) => (
              <div key={value.title} className="bg-white rounded-2xl p-8 shadow-lg text-center">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-brand-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h3>
                <p className="text-slate-600">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Leadership Team</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Meet the leaders who drive our mission forward.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="relative h-64 bg-slate-200">
                  <Image src={member.image} alt={member.name} fill className="object-cover" sizes="100vw" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{member.name}</h3>
                  <p className="text-brand-blue-600 font-medium mb-3">{member.role}</p>
                  <p className="text-slate-600 text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Our Team CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Users className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Team</h2>
          <p className="text-xl text-blue-100 mb-8">
            Are you passionate about workforce development? We're always looking for dedicated 
            professionals to join our growing team.
          </p>
          <Link href="/careers" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
            View Career Opportunities <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
