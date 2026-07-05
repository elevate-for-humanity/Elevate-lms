import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Users, Target, Heart, Award, GraduationCap, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About | Elevate for Humanity',
  description: 'Elevate for Humanity - nonprofit workforce development organization in Indianapolis, Indiana. DOL-registered apprenticeship sponsor and WIOA-approved training provider.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-blue-700 via-brand-blue-800 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              From Unemployed to Employed
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Elevate for Humanity is a nonprofit workforce development organization 
              dedicated to helping individuals build meaningful careers through training, 
              apprenticeships, and job placement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/success-stories" 
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-brand-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Read Success Stories
              </Link>
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '1,247+', label: 'Students Enrolled' },
              { value: '92%', label: 'Graduation Rate' },
              { value: '75+', label: 'Hiring Partners' },
              { value: '10+', label: 'Years Serving Indiana' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-brand-blue-700">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-4">
                To provide pathways from unemployment to meaningful employment through 
                industry-recognized training, registered apprenticeships, and employer partnerships.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We believe everyone deserves the opportunity to build a career, regardless of 
                their background or circumstances.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-brand-blue-100 text-brand-blue-700 rounded-full text-sm font-medium">
                  DOL Registered Apprenticeship Sponsor
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  WIOA Approved Training Provider
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-brand-blue-50 to-green-50 rounded-2xl p-8">
              <div className="space-y-6">
                {[
                  { icon: Target, title: 'Our Vision', desc: 'A workforce where everyone has access to career-building opportunities' },
                  { icon: Heart, title: 'Our Values', desc: 'Integrity, accessibility, excellence, and community impact' },
                  { icon: Users, title: 'Who We Serve', desc: 'Unemployed, underemployed, veterans, justice-involved, and career changers' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <item.icon className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Overview */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What We Offer</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: GraduationCap,
                title: 'Career Training',
                desc: 'Programs in healthcare, skilled trades, technology, and business.',
                link: '/programs',
                linkText: 'View Programs'
              },
              {
                icon: Award,
                title: 'Registered Apprenticeships',
                desc: 'Earn while you learn at partner employers. $14-18/hour starting pay.',
                link: '/apprenticeships',
                linkText: 'Learn About Apprenticeships'
              },
              {
                icon: Building2,
                title: 'Employer Partnerships',
                desc: 'Connect with 75+ hiring partners for job placement.',
                link: '/for-employers',
                linkText: 'Partner With Us'
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-7 h-7 text-brand-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4">{item.desc}</p>
                <Link href={item.link} className="text-brand-blue-600 font-semibold hover:underline">
                  {item.linkText} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 md:p-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Most Students Pay $0</h2>
              <p className="text-lg text-gray-600 mb-6">
                Through WIOA, Vocational Rehabilitation, and state grants, many of our students receive free training.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/check-eligibility" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Check Your Eligibility
                </Link>
                <Link 
                  href="/funding" 
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-green-600 text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors"
                >
                  Learn About Funding
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Whether you are looking for training, funding, or to partner with us, we are here to help.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/apply" 
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-blue-700 font-bold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Apply Now
            </Link>
            <Link 
              href="/contact" 
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
