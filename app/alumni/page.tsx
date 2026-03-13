import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Briefcase, Award, Calendar, ArrowRight, MapPin } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Alumni Network | Elevate For Humanity',
  description: 'Join our alumni network. Connect with graduates, access job opportunities, and continue your professional development.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/alumni',
  },
};

const stats = [
  { label: 'Programs Available', value: '10+' },
  { label: 'Placement Goal', value: '85%' },
  { label: 'Funded Training', value: '100%' },
  { label: 'Support', value: '24/7' },
];

const benefits = [
  {
    icon: Briefcase,
    title: 'Job Board Access',
    description: 'Exclusive access to job postings from our employer partners specifically for Elevate graduates.',
  },
  {
    icon: Users,
    title: 'Networking Events',
    description: 'Monthly virtual and in-person networking events to connect with fellow alumni and industry professionals.',
  },
  {
    icon: Award,
    title: 'Continued Learning',
    description: 'Discounted access to advanced certifications and continuing education courses.',
  },
  {
    icon: Calendar,
    title: 'Mentorship Program',
    description: 'Give back by mentoring current students or receive guidance from experienced professionals.',
  },
];

// Alumni profiles will be added as students graduate and provide consent
const featuredAlumni: { name: string; program: string; company: string; image: string; quote: string }[] = [];

export default function AlumniPage() {
  return (
    <div className="min-h-screen bg-white">      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Alumni' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 bg-brand-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Elevate Alumni Network
            </h1>
            <p className="text-xl text-brand-blue-100 mb-8">
              Graduates across Indiana have transformed their careers. Access exclusive job opportunities, networking events, and continued learning resources.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-white text-brand-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-50 transition-colors"
              >
                Sign In to Alumni Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Contact Alumni Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-brand-blue-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Alumni Benefits</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
                <benefit.icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Alumni */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Alumni Network</h2>
          {featuredAlumni.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredAlumni.map((alumni) => (
                <div key={alumni.name} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={alumni.image}
                      alt={alumni.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg">{alumni.name}</h3>
                    <p className="text-brand-blue-600 text-sm mb-2">{alumni.program}</p>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mb-4">
                      <MapPin className="w-3 h-3" /> {alumni.company}
                    </p>
                    <p className="text-gray-600 italic text-sm">&quot;{alumni.quote}&quot;</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Building Our Alumni Network</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                As our first cohorts graduate, their success stories will be featured here. 
                Be part of our founding class of graduates.
              </p>
              <Link
                href="/start"
                className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors"
              >
                Start Your Journey
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join Our Network?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            All Elevate graduates automatically become part of our alumni network. Sign in to access your benefits.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-50 transition-colors"
          >
            Access Alumni Portal
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
