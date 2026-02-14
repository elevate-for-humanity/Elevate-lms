import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle,
  Users,
  Shield,
  AlertCircle,
  DollarSign,
  Clock,
  Award,
  FileCheck,
  Zap,
  Calculator,
  Phone,
  MapPin,
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/tax',
  },
  title: 'Tax Preparation Services | Elevate For Humanity',
  description:
    'Trusted tax help — free community-based VITA tax preparation and professional Supersonic Fast Cash tax services.',
  openGraph: {
    title: 'Tax Preparation Services',
    description: 'Free VITA tax preparation and professional Supersonic Fast Cash tax services.',
    url: 'https://www.elevateforhumanity.org/tax',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Tax Services' }],
    type: 'website',
  },
};

export default function TaxServicesPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax" }]} />
      </div>
{/* Hero Section */}
      <section className="relative min-h-[550px] flex items-center overflow-hidden">
        <Image
          src="/images/business/tax-prep-certification.jpg"
          alt="Tax Preparation Services"
          fill
          className="object-cover"
          priority
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
              <DollarSign className="w-4 h-4" />
              Tax Season 2026 - File by April 15th
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
              Tax Preparation Services
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Choose the tax service that fits your needs. Free VITA tax preparation for 
              eligible individuals or professional services through Supersonic Fast Cash.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/tax"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors"
              >
                <Users className="w-5 h-5" />
                Free VITA Tax Prep
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/supersonic-fast-cash"
                className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors"
              >
                <Zap className="w-5 h-5" />
                Supersonic Fast Cash
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Navigation */}
      <section className="py-4 bg-gray-100 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/tax" className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium hover:bg-green-200 transition-colors">
              VITA Free Tax Prep
            </Link>
            <Link href="/supersonic-fast-cash" className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium hover:bg-red-200 transition-colors">
              Supersonic Fast Cash
            </Link>
            <Link href="/tax" className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
              Locations
            </Link>
            <Link href="/tax" className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
              What to Bring
            </Link>
            <Link href="/tax/volunteer" className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors">
              Volunteer
            </Link>
          </div>
        </div>
      </section>

      {/* Two Options Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Choose Your Tax Service
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We offer two distinct tax preparation options to serve different needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* VITA Free Tax Prep */}
            <div className="bg-white rounded-2xl border-2 border-green-200 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="relative h-48">
                <Image
                  src="/images/heroes/training-provider-2.jpg"
                  alt="VITA Free Tax Preparation"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    100% FREE
                  </span>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">VITA Tax Preparation</h3>
                    <p className="text-green-600 font-semibold">Rise Up Foundation</p>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  Free tax preparation for individuals and families earning under $64,000. 
                  IRS-certified volunteers help you file accurately and claim all credits you deserve.
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">No cost - completely free service</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">IRS-certified volunteer preparers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">EITC, Child Tax Credit, Education Credits</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">E-file with direct deposit</span>
                  </li>
                </ul>

                <Link
                  href="/tax"
                  className="block w-full text-center px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors"
                >
                  Get Free Tax Help
                  <ArrowRight className="inline-block w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>

            {/* Supersonic Fast Cash */}
            <div className="bg-white rounded-2xl border-2 border-red-200 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="relative h-48">
                <Image
                  src="/images/heroes-hq/tax-refund-hero.jpg"
                  alt="Supersonic Fast Cash Tax Services"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    PROFESSIONAL
                  </span>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Supersonic Fast Cash</h3>
                    <p className="text-red-600 font-semibold">Professional Tax Services</p>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  Professional tax preparation for all income levels. Fast refunds, 
                  same-day advances available, and support for complex tax situations.
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Same-day refund advances available</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Business & self-employment returns</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Complex tax situations welcome</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Multiple locations & online filing</span>
                  </li>
                </ul>

                <Link
                  href="/supersonic-fast-cash"
                  className="block w-full text-center px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
                >
                  Get Started Now
                  <ArrowRight className="inline-block w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Notice */}
      <section className="py-12 bg-amber-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white border-l-4 border-amber-500 p-6 rounded-lg shadow-sm">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Important Compliance Notice
                </h3>
                <p className="text-gray-700 leading-relaxed mb-2">
                  <strong>VITA (Free Tax Prep)</strong> is provided through Rise Up Foundation, 
                  a nonprofit organization. Services are free and performed by IRS-certified volunteers.
                </p>
                <p className="text-gray-700 leading-relaxed mb-2">
                  <strong>Supersonic Fast Cash</strong> is a separate for-profit tax preparation business. 
                  Fees apply for professional services.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  These services operate independently. Clients must choose one service path. 
                  Volunteers in the VITA program do not receive compensation for tax preparation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Why Choose Our Tax Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional, accurate tax preparation you can trust
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Maximum Refund</h3>
              <p className="text-gray-600">
                We find every credit and deduction you qualify for - EITC, Child Tax Credit, 
                Education Credits, and more.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Processing</h3>
              <p className="text-gray-600">
                E-filed returns processed quickly. Direct deposit setup included. 
                Track your refund status online.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">IRS-Certified</h3>
              <p className="text-gray-600">
                All preparers pass IRS competency exams. Accuracy guarantee on every return we prepare.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Audit Support</h3>
              <p className="text-gray-600">
                If you get audited, we stand behind our work. Audit assistance included for all clients.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">All Tax Situations</h3>
              <p className="text-gray-600">
                From simple W-2 returns to complex business taxes, self-employment, and investments.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Convenient Locations</h3>
              <p className="text-gray-600">
                Multiple locations across Indiana. Walk in with your documents and we&apos;ll take care of the rest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Additional Resources
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/tax/volunteer"
              className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                <Users className="w-6 h-6 text-green-600 group-hover:text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Volunteer With Us
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Help your community by becoming a VITA volunteer tax preparer.
              </p>
              <div className="flex items-center text-green-600 font-semibold text-sm">
                Learn More <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

            <Link
              href="/tax/upload"
              className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                <FileCheck className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Secure Document Upload
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload your tax documents securely for faster processing.
              </p>
              <div className="flex items-center text-blue-600 font-semibold text-sm">
                Upload Documents <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

            <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                IRS Resources
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Official IRS information and free tax preparation resources.
              </p>
              <div className="space-y-2">
                <a
                  href="https://irs.treasury.gov/freetaxprep/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 hover:underline"
                >
                  IRS Free Tax Prep →
                </a>
                <a
                  href="https://www.irs.gov/refunds"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 hover:underline"
                >
                  Where&apos;s My Refund? →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
            Ready to File Your Taxes?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Don&apos;t wait until the last minute. Get your maximum refund today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tax"
              className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-green-700 transition-colors"
            >
              Free VITA Tax Prep
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/supersonic-fast-cash"
              className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-red-700 transition-colors"
            >
              Supersonic Fast Cash
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="mt-8 text-blue-200">
            <Phone className="inline-block w-4 h-4 mr-2" />
            Questions? Contact us at Get Help Online
          </p>
        </div>
      </section>
      {/* CTA Section */}
      <section className="bg-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-blue-100 mb-6">Apply today for free career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition"
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
