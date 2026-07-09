import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Award, Users, TrendingUp, Building2, GraduationCap, Shield } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `About ${PLATFORM_DEFAULTS.orgName} | Workforce Training & Apprenticeships`,
  description: `Learn about ${PLATFORM_DEFAULTS.orgName} - DOL-registered apprenticeship sponsor, WIOA-approved training provider. Transform your career with funded training in healthcare, skilled trades, and technology.`,
  keywords: [`about', 'workforce development', 'DOL registered apprenticeship', 'WIOA training provider', 'Indianapolis career training`],
  openGraph: {
    title: `About ${PLATFORM_DEFAULTS.orgName}`,
    description: `Transform your career with workforce training, apprenticeships, and career development.',
    images: [{ url: '/images/pages/about-hero.webp', width: 1200, height: 630, alt: 'About Elevate for Humanity' }],
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/pages/team-collaboration.webp" alt="About Elevate for Humanity - Team collaboration" fill className="object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-blue-300 font-semibold mb-4 uppercase tracking-wide text-sm">Who We Are</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Transforming Lives Through Workforce Development
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              We connect job seekers to meaningful careers and employers to skilled talent. 
              As a DOL-registered apprenticeship sponsor and WIOA-approved training provider, 
              we bridge the gap between potential and opportunity.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/apply" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-brand-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">DOL</div>
              <p className="text-blue-200">Registered Sponsor</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">WIOA</div>
              <p className="text-blue-200">Approved Provider</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">WorkOne</div>
              <p className="text-blue-200">Partner Network</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">NHA</div>
              <p className="text-blue-200">Testing Center</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Our Mission</h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                There is a gap between people who want to work and the skills employers need. 
                We bridge that gap. We believe everyone deserves a pathway to a living wage career 
                — regardless of background, education, or past circumstances.
              </p>
              <p className="text-lg text-slate-700 leading-relaxed mb-8">
                Through apprenticeship programs, funded training, and career services, we help 
                individuals achieve their potential while providing employers with the skilled 
                workforce they need to succeed.
              </p>
              <Link href="/how-it-works" className="inline-flex items-center text-brand-blue-600 hover:text-brand-blue-700 font-semibold">
                Learn How It Works <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <Image src="/images/pages/training-classroom.webp" alt="Students in training" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What We Offer</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              From apprenticeship to employment, we provide the pathways, funding, and support you need.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Apprenticeships</h3>
              <p className="text-slate-600 mb-4">
                DOL-registered programs in barbering, cosmetology, and esthetics. Earn while you learn 
                at host shops across Indiana.
              </p>
              <Link href="/barber-and-beauty-apprenticeships" className="text-brand-blue-600 hover:text-brand-blue-700 font-semibold inline-flex items-center">
                Explore Programs <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-brand-orange-100 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-brand-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Funded Training</h3>
              <p className="text-slate-600 mb-4">
                WIOA, Workforce Ready Grant, and other funding options. Many students pay $0 for 
                their training.
              </p>
              <Link href="/funding" className="text-brand-blue-600 hover:text-brand-blue-700 font-semibold inline-flex items-center">
                See Funding Options <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Career Services</h3>
              <p className="text-slate-600 mb-4">
                Job placement assistance, resume building, interview prep, and employer connections 
                to launch your career.
              </p>
              <Link href="/career-services" className="text-brand-blue-600 hover:text-brand-blue-700 font-semibold inline-flex items-center">
                View Services <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications & Partners */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <Image src="/images/pages/workone-partners.webp" alt="WorkOne Indiana partner" fill className="object-cover" />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Certifications & Partners</h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-8">
                We work with trusted partners and industry leaders to ensure our programs meet 
                the highest standards. Our certifications are recognized by employers statewide.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">DOL-Registered</h4>
                    <p className="text-slate-600">U.S. Department of Labor recognized apprenticeship programs</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Award className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">NHA Testing Center</h4>
                    <p className="text-slate-600">National Healthcareer Association approved certification testing</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Building2 className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">WorkOne Indiana Partner</h4>
                    <p className="text-slate-600">Connected to Indiana's workforce development network</p>
                  </div>
                </div>
              </div>
              
              <Link href="/accreditation" className="inline-flex items-center text-brand-blue-600 hover:text-brand-blue-700 font-semibold">
                View All Certifications <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Whether you're seeking training, looking for employees, or want to partner with us — 
            we're here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Apply Now <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
