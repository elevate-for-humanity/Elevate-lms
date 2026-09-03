import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Briefcase, FileText, Users, Target, Clock, CheckCircle, Phone } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Career Services | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Career coaching, job placement, resume building, and interview prep services to help you launch your career after training.',
  keywords: ['career services', 'job placement', 'resume help', 'interview prep', 'career coaching'],
};

const SERVICES = [
  {
    icon: Briefcase,
    title: 'Job Placement Assistance',
    desc: 'We connect graduates with employers actively hiring. Our employer partnerships mean direct pathways to employment.',
    image: '/images/pages/career-coaching.webp',
  },
  {
    icon: FileText,
    title: 'Resume & Portfolio Building',
    desc: 'Professional resume reviews, cover letter assistance, and portfolio development to make you stand out.',
    image: '/images/pages/resume-building-hero.webp',
  },
  {
    icon: Target,
    title: 'Interview Preparation',
    desc: 'Mock interviews, feedback sessions, and tips to help you confidently land the job.',
    image: '/hero-images/career-services-hero.webp',
  },
  {
    icon: Users,
    title: 'Career Coaching',
    desc: 'One-on-one guidance to help you navigate your career path, set goals, and overcome challenges.',
    image: '/hero-images/career-services-hero.webp',
  },
];

const EMPLOYER_BENEFITS = [
  'Pre-screened candidates with verified skills',
  'Industry-recognized certifications',
  'Ongoing retention support',
  'Customized hiring events',
  'Apprenticeship pipeline access',
];

export default function CareerServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/pages/career-services-page-1.webp" alt="Career Services - Elevate for Humanity" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-blue-300 font-semibold mb-4 uppercase tracking-wide text-sm">Career Services</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              From Training to Career — We Stay With You
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Our career services don't end when your program does. We provide ongoing support to help you 
              land a job, advance in your career, and achieve your professional goals.
            </p>
            <Link href="/contact" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Schedule a Consultation <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Career Services</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Comprehensive support at every stage of your career journey.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {SERVICES.map((service) => (
              <div key={service.title} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="relative h-48 bg-slate-200">
                  <Image src={service.image} alt={service.title} fill className="object-cover" sizes="100vw" />
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                      <service.icon className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{service.title}</h3>
                  </div>
                  <p className="text-slate-600">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Timeline */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Your Path to Employment</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              We guide you every step of the way from enrollment to your first day on the job.
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { step: 1, title: 'Enroll', desc: 'Start your training program' },
              { step: 2, title: 'Learn', desc: 'Develop your skills' },
              { step: 3, title: 'Certify', desc: 'Earn your credentials' },
              { step: 4, title: 'Prepare', desc: 'Build resume & practice interviews' },
              { step: 5, title: 'Hired', desc: 'Start your new career' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Employers */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">For Employers</h2>
              <p className="text-lg text-slate-700 mb-8">
                Partner with us to access a pipeline of skilled, certified workers ready to contribute 
                to your team from day one.
              </p>
              <ul className="space-y-4 mb-8">
                {EMPLOYER_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link href="/for-employers" className="inline-flex items-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Learn About Hiring <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <Image src="/images/pages/team-collaboration.webp" alt="Employer partnership" fill className="object-cover" sizes="100vw" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Career Journey?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Whether you're finishing a program or looking for your next opportunity, we're here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Us <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <a href="tel:+13173141234" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              <Phone className="mr-2 w-5 h-5" /> Call (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
