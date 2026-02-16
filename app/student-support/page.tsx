import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { HeartHandshake, BookOpen, DollarSign, Briefcase, Users, Phone, MessageSquare, Calendar } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Student Support Services | Elevate for Humanity',
  description: 'Access academic support, financial aid, career services, counseling, and more. We are here to help you succeed throughout your educational journey.',
  keywords: ['student support', 'academic help', 'financial aid', 'career services', 'tutoring', 'counseling'],
  alternates: {
    canonical: `${SITE_URL}/student-support`,
  },
  openGraph: {
    title: 'Student Support Services | Elevate for Humanity',
    description: 'Access academic support, financial aid, career services, and counseling to help you succeed.',
    url: `${SITE_URL}/student-support`,
    siteName: 'Elevate for Humanity',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/og/student-support-og.jpg`,
        width: 1200,
        height: 630,
        alt: 'Student Support Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student Support Services | Elevate for Humanity',
    description: 'Access academic support, financial aid, career services, and counseling.',
  },
};

const services = [
  { icon: BookOpen, title: 'Academic Support', description: 'Tutoring, study groups, and academic advising', link: '/student-support/academic' },
  { icon: DollarSign, title: 'Financial Aid', description: 'Scholarships, grants, and payment plans', link: '/student-support/financial-aid' },
  { icon: Briefcase, title: 'Career Services', description: 'Job placement, resume help, and interview prep', link: '/student-support/career' },
  { icon: Users, title: 'Counseling', description: 'Personal counseling and wellness resources', link: '/student-support/counseling' },
  { icon: HeartHandshake, title: 'Accessibility', description: 'Accommodations and disability services', link: '/student-support/accessibility' },
  { icon: Calendar, title: 'Scheduling', description: 'Class scheduling and calendar management', link: '/student-support/scheduling' },
];

export default function StudentSupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Student Support' }]} />
        </div>
      </div>

      <div className="relative bg-green-800 text-white py-16">
        <Image
          src="/images/heroes/learners.jpg"
          alt="Student Support"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="relative max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Student Support Services</h1>
          <p className="text-xl text-green-100 max-w-2xl">
            We&apos;re here to help you succeed. Access resources and support throughout your educational journey.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service, index) => (
            <Link key={index} href={service.link} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <service.icon className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h2>
              <p className="text-gray-600">{service.description}</p>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Support</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Phone className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Phone Support</p>
                <p className="text-gray-600">1-800-ELEVATE</p>
                <p className="text-sm text-gray-500">Mon-Fri 8am-6pm</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <MessageSquare className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Live Chat</p>
                <p className="text-gray-600">Available 24/7</p>
                <Link href="/chat" className="text-sm text-green-600 hover:underline">Start Chat</Link>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Schedule Meeting</p>
                <p className="text-gray-600">Book an appointment</p>
                <Link href="/student-support/schedule" className="text-sm text-green-600 hover:underline">Book Now</Link>
              </div>
            </div>
          </div>
        </div>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Apply today for free career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
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
    </div>
  );
}
