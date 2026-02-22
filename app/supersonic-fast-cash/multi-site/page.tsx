
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  DollarSign,
  Users,
  TrendingUp,
  ArrowRight,
  MapPin,
  Briefcase,
  Shield,
  Headphones,
  BarChart3,
  Zap,
  Star,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Become a Multi-Site Partner | Supersonic Fast Cash',
  description: 'Open your own Supersonic Fast Cash tax preparation office. Low startup costs, comprehensive training, and ongoing support.',
  alternates: {
    canonical: 'https://www.supersonicfastermoney.com/multi-site',
  },
};

const benefits = [
  {
    icon: DollarSign,
    title: 'Low Startup Costs',
    description: 'Start your tax business with minimal investment compared to traditional franchises',
  },
  {
    icon: Briefcase,
    title: 'Turnkey Business',
    description: 'Everything you need: software, training, marketing materials, and support',
  },
  {
    icon: Users,
    title: 'Comprehensive Training',
    description: 'PTIN-credentialed tax preparer training and ongoing education',
  },
  {
    icon: Headphones,
    title: 'Dedicated Support',
    description: 'Year-round support from our experienced team',
  },
  {
    icon: BarChart3,
    title: 'Proven Systems',
    description: 'Battle-tested processes for client acquisition and retention',
  },
  {
    icon: Shield,
    title: 'Brand Recognition',
    description: 'Leverage the Supersonic Fast Cash brand and reputation',
  },
];

const whatYouGet = [
  'Professional tax preparation software license',
  'IRS EFIN application assistance',
  'Complete tax preparer training program',
  'Marketing materials and signage',
  'Client management system access',
  'Refund advance and bank product access',
  'Ongoing technical support',
  'Annual tax law update training',
  'Quality review and compliance support',
  'Co-branded marketing campaigns',
];

const requirements = [
  {
    title: 'Location',
    description: 'Retail or office space in a high-traffic area (minimum 400 sq ft)',
  },
  {
    title: 'Investment',
    description: 'Initial investment starting at $5,000 - $15,000 depending on location',
  },
  {
    title: 'Commitment',
    description: 'Minimum 2-year partnership agreement',
  },
  {
    title: 'Background',
    description: 'Clean background check and no tax-related violations',
  },
];

const testimonials = [
  {
    quote: "Opening my Supersonic Fast Cash office was the best business decision I've made. The support and training made it easy to get started.",
    author: 'Graduate',
    location: 'Indianapolis, IN',
    year: '2023 Partner',
  },
  {
    quote: "I went from preparing taxes at my kitchen table to running a professional office with 3 employees. The systems they provide just work.",
    author: 'Sandra M.',
    location: 'Gary, IN',
    year: '2022 Partner',
  },
];

const steps = [
  {
    step: 1,
    title: 'Apply Online',
    description: 'Complete our partnership application form',
  },
  {
    step: 2,
    title: 'Discovery Call',
    description: 'Speak with our partnership team about your goals',
  },
  {
    step: 3,
    title: 'Training',
    description: 'Complete tax preparer certification and systems training',
  },
  {
    step: 4,
    title: 'Launch',
    description: 'Open your doors and start serving clients',
  },
];

export default function MultiSitePage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Multi Site" }]} />
      </div>
{/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/programs-hq/tax-preparation.jpg" alt="Multi-Site Tax Office" fill className="object-cover" priority sizes="100vw" />
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-black text-brand-blue-400">15+</div>
              <div className="text-gray-400">Active Locations</div>
            </div>
            <div>
              <div className="text-4xl font-black text-brand-blue-400">50K+</div>
              <div className="text-gray-400">Returns Filed</div>
            </div>
            <div>
              <div className="text-4xl font-black text-brand-blue-400">98%</div>
              <div className="text-gray-400">Partner Retention</div>
            </div>
            <div>
              <div className="text-4xl font-black text-brand-blue-400">$75K+</div>
              <div className="text-gray-400">Avg. Partner Revenue</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Why Partner With Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide everything you need to run a successful tax preparation business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl p-6">
                <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-7 h-7 text-brand-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our partnership package includes all the tools, training, and support you need to build a thriving tax preparation business.
              </p>
              <ul className="space-y-3">
                {whatYouGet.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-center mb-8">
                <Zap className="w-16 h-16 text-brand-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Ready to Get Started?
                </h3>
                <p className="text-gray-600">
                  Join our network of successful tax professionals
                </p>
              </div>
              <Link
                href="/supersonic-fast-cash/multi-site/apply"
                className="block w-full bg-brand-blue-600 text-white text-center py-4 rounded-xl font-bold hover:bg-brand-blue-700 transition-colors"
              >
                Apply for Partnership
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              How to Become a Partner
            </h2>
            <p className="text-xl text-gray-600">
              Four simple steps to launch your tax business
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-black text-2xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Partnership Requirements
            </h2>
            <p className="text-xl text-gray-600">
              What you need to qualify
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {requirements.map((req, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{req.title}</h3>
                <p className="text-gray-600 text-sm">{req.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Partner Success Stories
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 text-lg mb-6 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.author}</div>
                  <div className="text-gray-600 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {testimonial.location} • {testimonial.year}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
            Ready to Build Your Tax Business?
          </h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Apply today and join our growing network of successful partners.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/multi-site/apply"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-700 px-10 py-5 rounded-xl font-bold text-xl hover:bg-brand-blue-50 transition-colors shadow-lg"
            >
              🚀 Apply Now
              <ArrowRight className="w-6 h-6" />
            </Link>
            <Link
              href="/supersonic-fast-cash/contact"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-500/30 text-white px-10 py-5 rounded-xl font-bold text-xl hover:bg-brand-blue-500/40 transition-colors border border-white/30"
            >
              Questions? Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
