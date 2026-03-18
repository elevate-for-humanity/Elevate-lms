import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Phone, MessageSquare, Calendar } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import HeroVideo from '@/components/marketing/HeroVideo';

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
  { title: 'Academic Support', description: 'One-on-one tutoring, study groups, and academic advising. Get help with coursework, exam prep, and staying on track in your program.', link: '/student-support/academic', image: '/images/pages/employment-support-page-1.jpg' },
  { title: 'Financial Aid', description: 'WIOA funding, scholarships, grants, and flexible payment plans. Our team helps you find and apply for every dollar available.', link: '/student-support/financial-aid', image: '/images/pages/employment-support-page-1.jpg' },
  { title: 'Career Services', description: 'Job placement assistance, resume writing, interview coaching, and employer connections. We stay with you through your first 90 days on the job.', link: '/student-support/career', image: '/images/pages/employment-support-page-1.jpg' },
  { title: 'Counseling & Wellness', description: 'Personal counseling, mental health resources, and crisis support. Confidential services available to all enrolled students at no cost.', link: '/student-support/counseling', image: '/images/pages/employment-support-page-1.jpg' },
  { title: 'Accessibility Services', description: 'Accommodations for students with disabilities, assistive technology, and individualized support plans. ADA-compliant facilities and programs.', link: '/student-support/accessibility', image: '/images/pages/employment-support-page-1.jpg' },
  { title: 'Scheduling & Advising', description: 'Class scheduling, program advising, and calendar management. Flexible scheduling for working adults and parents.', link: '/student-support/scheduling', image: '/images/pages/employment-support-page-1.jpg' },
];

export default function StudentSupportPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Student Support' }]} />
        </div>
      </div>

      {/* Video Hero */}
      <HeroVideo
        videoSrcDesktop="/videos/student-portal-hero.mp4"
        posterImage="/images/pages/student-support-hero.jpg"
        voiceoverSrc="/audio/heroes/programs.mp3"
        microLabel="Student Support"
        analyticsName="student-support"
      >
        <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">Elevate for Humanity</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
          Student Support Services
        </h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-6 max-w-2xl">
          Academic help, financial aid, career services, and counseling — everything you need to succeed from enrollment through employment.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/start" className="inline-flex items-center gap-2 bg-brand-green-600 text-white px-7 py-3 rounded-lg font-bold hover:bg-brand-green-700 transition text-sm">
            Apply Now <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/student-support/schedule" className="border border-slate-300 text-slate-700 font-bold px-7 py-3 rounded-lg hover:bg-slate-50 transition text-sm">
            Schedule Appointment
          </Link>
        </div>
      </HeroVideo>

      {/* Services — Image Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How We Support You</h2>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
              From your first day in class to your first day on the job — and beyond.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.title} className="group bg-white rounded-xl overflow-hidden border hover:shadow-lg transition">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute bottom-3 left-4">
                    <h3 className="text-lg font-bold text-slate-900">{service.title}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                  <Link
                    href={service.link}
                    className="inline-flex items-center gap-2 bg-brand-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-green-700 transition"
                  >
                    Learn More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Contact Support</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center">
              <Phone className="w-10 h-10 text-brand-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-1">Phone Support</h3>
              <a href="tel:+13173143757" className="text-brand-green-600 font-semibold hover:underline">(317) 314-3757</a>
              <p className="text-sm text-gray-500 mt-1">Mon–Fri 8am–6pm EST</p>
              <Link
                href="tel:+13173143757"
                className="inline-flex items-center gap-2 mt-4 bg-brand-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-green-700 transition"
              >
                Call Now
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <MessageSquare className="w-10 h-10 text-brand-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-1">Live Chat</h3>
              <p className="text-gray-600">Available 24/7</p>
              <p className="text-sm text-gray-500 mt-1">Average response: under 2 minutes</p>
              <Link
                href="/support/chat"
                className="inline-flex items-center gap-2 mt-4 bg-brand-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-green-700 transition"
              >
                Start Chat
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <Calendar className="w-10 h-10 text-brand-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-1">Schedule Meeting</h3>
              <p className="text-gray-600">Book a one-on-one</p>
              <p className="text-sm text-gray-500 mt-1">In-person or virtual available</p>
              <Link
                href="/student-support/schedule"
                className="inline-flex items-center gap-2 mt-4 bg-brand-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-green-700 transition"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <Image
          src="/images/pages/student-support-page-1.jpg"
          alt="Students succeeding in workforce training"
          fill
          className="object-cover"
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Ready to Start Your Career?</h2>
          <p className="text-brand-green-100 text-lg mb-8">Check your eligibility for funded career training programs. Most students pay $0 out of pocket.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-green-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-white transition"
            >
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition"
            >
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
