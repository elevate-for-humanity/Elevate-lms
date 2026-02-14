'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import TestimonialsSection from '@/components/content/TestimonialsSection';
import {
  BadgeCheck,
  Calculator,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  MapPin,
  Phone,
  Shield,
  Upload,
  Users,
  Zap,
  ArrowRight,
} from 'lucide-react';

export default function SupersonicFastCashPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Supersonic Fast Cash' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        {/* Image Background */}
        <Image
          src="/images/heroes-hq/tax-refund-hero.jpg"
          alt="Tax Refund Services"
          fill
          className="object-cover"
          priority
        />
        

        {/* Animated background accents */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tight leading-none mb-8">
              Get Your Tax Refund
              <span className="block text-transparent bg-clip-text bg-slate-700 animate-pulse">
                TODAY!
              </span>
            </h1>

            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-100 mb-12">
              Up to <span className="text-red-400">$7,500</span> in Just{' '}
              <span className="text-red-400">15 Minutes</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link
                href="/supersonic-fast-cash/apply"
                className="group px-12 py-6 bg-slate-700 text-white text-xl sm:text-2xl font-black rounded-2xl hover:from-blue-700 hover:to-blue-800 shadow-2xl hover:shadow-blue-500/50 uppercase transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-3">
                  💵 Get Cash Now
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </span>
              </Link>
              <Link
                href="/supersonic-fast-cash/diy-taxes"
                className="group px-12 py-6 bg-white text-blue-900 text-xl sm:text-2xl font-black rounded-2xl hover:bg-gray-50 shadow-2xl uppercase transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex flex-col items-center justify-center gap-1">
                  <span className="flex items-center gap-3">
                    <FileText className="w-6 h-6" />
                    File Yourself
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <span className="text-xs font-normal normal-case text-gray-500">Secure login required</span>
                </span>
              </Link>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl text-center border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <div className="font-black text-xl text-white mb-1">Up to $7,500</div>
                <div className="text-gray-300 text-sm">Same Day Cash</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl text-center border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                <Clock className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                <div className="font-black text-xl text-white mb-1">15 Minutes</div>
                <div className="text-gray-300 text-sm">Fast Approval</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl text-center border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                <Shield className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                <div className="font-black text-xl text-white mb-1">0% Interest</div>
                <div className="text-gray-300 text-sm">No Hidden Fees</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl text-center border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                <BadgeCheck className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
                <div className="font-black text-xl text-white mb-1">PTIN-Credentialed</div>
                <div className="text-gray-300 text-sm">Licensed Pros</div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get your money in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-3xl mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Apply Online</h3>
              <p className="text-gray-600">
                Fill out our simple application in under 5 minutes. No appointment needed.
              </p>
            </div>

            <div className="relative text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-3xl mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Approved</h3>
              <p className="text-gray-600">
                Our team reviews your application and approves you in as little as 15 minutes.
              </p>
            </div>

            <div className="relative text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-3xl mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Your Cash</h3>
              <p className="text-gray-600">
                Pick up your cash today or get it deposited directly to your account.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/supersonic-fast-cash/apply"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-10 py-5 rounded-xl font-bold text-xl hover:bg-blue-700 transition-colors shadow-lg"
            >
              Start Your Application
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for tax season
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Link
              href="/supersonic-fast-cash/services/tax-preparation"
              className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all group border border-gray-200"
            >
              <div className="relative h-36">
                <Image src="/images/business/program-tax-preparation.jpg" alt="Tax Preparation" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Tax Preparation
                </h3>
                <p className="text-gray-600 text-sm">
                  Professional tax prep by PTIN-credentialed experts.
                </p>
              </div>
            </Link>

            <Link
              href="/supersonic-fast-cash/services/refund-advance"
              className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all group border border-gray-200"
            >
              <div className="relative h-36">
                <Image src="/images/business/program-tax-preparation.jpg" alt="Refund Advance" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                  Refund Advance
                </h3>
                <p className="text-gray-600 text-sm">
                  Get up to $7,500 same day with 0% interest.
                </p>
              </div>
            </Link>

            <Link
              href="/supersonic-fast-cash/diy-taxes"
              className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all group border border-gray-200"
            >
              <div className="relative h-36">
                <Image src="/images/heroes/employer-partner-3.jpg" alt="DIY Tax Filing" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  DIY Tax Filing
                </h3>
                <p className="text-gray-600 text-sm">
                  File your own taxes with our easy online software.
                </p>
              </div>
            </Link>

            <Link
              href="/supersonic-fast-cash/services/audit-protection"
              className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all group border border-gray-200"
            >
              <div className="relative h-36">
                <Image src="/images/heroes/about-team.jpg" alt="Audit Protection" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                  Audit Protection
                </h3>
                <p className="text-gray-600 text-sm">
                  Peace of mind with full audit representation.
                </p>
              </div>
            </Link>

            <Link
              href="/supersonic-fast-cash/training"
              className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all group border border-gray-200"
            >
              <div className="relative h-36">
                <Image src="/images/business/tax-prep-certification-optimized.jpg" alt="Tax Preparer Training" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                  Become a Tax Pro
                </h3>
                <p className="text-gray-600 text-sm">
                  Get trained and certified as a tax preparer.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Visit Us Today
              </h2>
              <p className="text-xl text-blue-200 mb-8">
                Walk in or schedule an appointment. We&apos;re ready to help you get your money fast.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-8 h-8 text-red-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg">Main Office</h3>
                    <p className="text-blue-200">8888 Keystone Crossing, Suite 1300</p>
                    <p className="text-blue-200">Indianapolis, IN 46240</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-8 h-8 text-red-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg">Hours</h3>
                    <p className="text-blue-200">Mon-Fri: 9am - 8pm</p>
                    <p className="text-blue-200">Sat: 9am - 5pm | Sun: 12pm - 5pm</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="w-8 h-8 text-red-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg">Contact Us</h3>
                    <p className="text-blue-200">Get Help Online</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link
                  href="/supersonic-fast-cash/locations"
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-900 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  All Locations
                </Link>
                <Link
                  href="/supersonic-fast-cash/book-appointment"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  Book Appointment
                </Link>
              </div>
            </div>

            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image
                src="/images/programs-hq/tax-preparation.jpg"
                alt="Supersonic Fast Cash Office"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - fetched from database */}
      <TestimonialsSection 
        serviceType="tax"
        title="What Our Customers Say"
        bgColor="bg-gray-50"
        limit={3}
      />

      {/* Quick Links */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link
              href="/supersonic-fast-cash/calculator"
              className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Calculator className="w-8 h-8 text-blue-600" />
              <span className="font-semibold text-gray-900">Refund Calculator</span>
            </Link>
            <Link
              href="/supersonic-fast-cash/tax-tools"
              className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <FileText className="w-8 h-8 text-green-600" />
              <span className="font-semibold text-gray-900">Tax Tools</span>
            </Link>
            <Link
              href="/supersonic-fast-cash/upload-documents"
              className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Upload className="w-8 h-8 text-blue-600" />
              <span className="font-semibold text-gray-900">Upload Documents</span>
            </Link>
            <Link
              href="/supersonic-fast-cash/training"
              className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <BadgeCheck className="w-8 h-8 text-orange-600" />
              <span className="font-semibold text-gray-900">Tax Training</span>
            </Link>
            <Link
              href="/supersonic-fast-cash/careers"
              className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Users className="w-8 h-8 text-red-600" />
              <span className="font-semibold text-gray-900">Join Our Team</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Get Your Money?
          </h2>
          <p className="text-xl text-red-100 mb-10">
            Apply now and get up to $7,500 today. No appointment needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/apply"
              className="inline-flex items-center justify-center gap-2 bg-white text-red-600 px-10 py-5 rounded-xl font-black text-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              💵 Apply Now - Get Cash Today
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
          <p className="mt-6 text-red-200 text-sm">
            Or contact us at <a href="/support" className="underline font-bold text-white">Get Help Online</a>
          </p>
        </div>
      </section>

      {/* E-File Disclosure */}
      <section className="py-6 bg-gray-100 border-t">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-500">
            Electronic filing is subject to IRS validation. Acceptance is not guaranteed. 
            Refund advance amounts and availability subject to eligibility requirements and lender approval.
            All tax preparers are PTIN-credentialed and authorized for IRS e-file.
          </p>
        </div>
      </section>
    </div>
  );
}
