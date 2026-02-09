import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import {
  Heart,
  DollarSign,
  GraduationCap,
  Briefcase,
  Users,
  ArrowRight,
  CheckCircle,
  Phone,
  MapPin,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Free Community Services | VITA, Mental Wellness, Job Training | Elevate for Humanity',
  description:
    'Access free community services: VITA tax preparation, mental wellness support through Selfish Inc., and funded job training through WIOA for eligible participants.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/community-services',
  },
};

const services = [
  {
    title: 'Free Tax Preparation (VITA)',
    description: 'IRS-certified volunteers prepare your taxes for free if you earn under $64,000.',
    icon: DollarSign,
    color: 'green',
    href: '/tax',
    benefits: [
      'Save $200+ in tax prep fees',
      'Average refund $2,847',
      'IRS-certified preparers',
      'E-file included',
    ],
  },
  {
    title: 'Mental Wellness (Selfish Inc.)',
    description: 'Free counseling, stress management, and holistic healing support.',
    icon: Heart,
    color: 'blue',
    href: '/nonprofit/mental-wellness',
    benefits: [
      'Individual counseling',
      'Group therapy sessions',
      'Mindfulness workshops',
      'Holistic healing',
    ],
  },
  {
    title: 'Free Job Training',
    description: 'Funded career training through WIOA for eligible participants. Get certified, get hired.',
    icon: GraduationCap,
    color: 'blue',
    href: '/programs',
    benefits: [
      'Healthcare certifications',
      'Skilled trades training',
      'Technology programs',
      'Job placement assistance',
    ],
  },
  {
    title: 'Employment Services',
    description: 'Job placement, resume help, interview prep, and career coaching.',
    icon: Briefcase,
    color: 'amber',
    href: '/career-services',
    benefits: [
      'Resume building',
      'Interview preparation',
      'Job matching',
      'Career coaching',
    ],
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; light: string }> = {
  green: { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-200', light: 'bg-green-50' },
  blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
  blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
  amber: { bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-200', light: 'bg-amber-50' },
};

export default function CommunityServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Community Services' },
        ]}
      />
      {/* Hero */}
      <section className="relative py-20 bg-slate-800">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
            <Heart className="w-4 h-4 text-red-400" />
            All Services Free for Qualifying Residents
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
            Community Services Hub
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            One place to access free tax help, mental wellness support, job training, and employment services. 
            We're here to help you build a better future.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/tax"
              className="px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
            >
              Free Tax Prep
            </Link>
            <Link
              href="/programs"
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
            >
              Free Training
            </Link>
            <Link
              href="/nonprofit"
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
            >
              Mental Wellness
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Our Community Ecosystem Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
              <h3 className="font-bold mb-2">Get Free Tax Help</h3>
              <p className="text-gray-600 text-sm">Start at our VITA site for free tax preparation</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
              <h3 className="font-bold mb-2">Access Wellness Support</h3>
              <p className="text-gray-600 text-sm">Connect with Selfish Inc. for mental health services</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
              <h3 className="font-bold mb-2">Get Free Training</h3>
              <p className="text-gray-600 text-sm">Enroll in WIOA-funded career programs</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">4</div>
              <h3 className="font-bold mb-2">Get Hired</h3>
              <p className="text-gray-600 text-sm">Job placement with our employer partners</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Our Free Services</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            All services are free or low-cost for qualifying Indiana residents
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service) => {
              const colors = colorClasses[service.color];
              return (
                <div
                  key={service.title}
                  className={`rounded-2xl border-2 ${colors.border} overflow-hidden hover:shadow-lg transition`}
                >
                  <div className={`${colors.bg} p-6 text-white`}>
                    <service.icon className="w-10 h-10 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                    <p className="text-white/90">{service.description}</p>
                  </div>
                  <div className="p-6 bg-white">
                    <ul className="space-y-3 mb-6">
                      {service.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-3">
                          <CheckCircle className={`w-5 h-5 ${colors.text}`} />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={service.href}
                      className={`inline-flex items-center gap-2 ${colors.text} font-semibold hover:underline`}
                    >
                      Learn More <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Who Qualifies?</h2>
          <p className="text-slate-300 mb-8">
            Most services are available to Indiana residents who meet income guidelines or face barriers to employment.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="font-bold text-green-400 mb-2">VITA Tax Services</h3>
              <p className="text-slate-300 text-sm">Income under $64,000/year</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="font-bold text-blue-400 mb-2">WIOA Training</h3>
              <p className="text-slate-300 text-sm">Low-income, unemployed, underemployed, or facing barriers</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="font-bold text-blue-400 mb-2">Mental Wellness</h3>
              <p className="text-slate-300 text-sm">Open to all community members</p>
            </div>
          </div>
          <Link
            href="/wioa-eligibility"
            className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition"
          >
            Check Your Eligibility <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Apply Now</h2>
          <p className="text-gray-600 mb-8">
            Not sure where to start? Contact us and we'll help connect you with the right services.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="tel:3173143757"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
            >
              <Phone className="w-5 h-5" />
              (317) 314-3757
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition"
            >
              <MapPin className="w-5 h-5" />
              Find a Location
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
