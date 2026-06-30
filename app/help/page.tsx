export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Video,
  MessageCircle,
  Phone,
  Mail,
  Search,
  FileText,
  Users,
  Headphones,
  Clock,
  CheckCircle,
  ArrowRight,
  LifeBuoy,
  Zap,
  Shield,
  Award,
  Rocket,
} from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/help',
  },
  title: 'Help Center | Get Support & Resources',
  description:
    'Access comprehensive help resources, tutorials, FAQs, and support for your training journey. Get answers fast with our knowledge base, video guides, and 24/7 support.',
};

export default async function HelpPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Hero Section with Gradient Overlay */}
      <section className="relative h-[500px] md:h-[600px] flex items-center justify-center text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
          <Image
            src="/images/artlist/hero-training-1.webp"
            alt="Student receiving personalized help and support"
            fill
            className="object-cover"
            quality={90}
            priority
            sizes="100vw" placeholder="empty"
          />
          {/* Gradient Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-900/90 via-brand-blue-800/80 to-brand-blue-700/90" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <LifeBuoy className="w-5 h-5" />
            <span className="text-sm font-semibold">24/7 Support Available</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
            How Can We Help You Today?
          </h1>

          <p className="text-lg md:text-xl mb-10 text-white/90 max-w-3xl mx-auto leading-relaxed">
            Get instant answers, watch tutorials, or connect with our support team. We're here to
            ensure your success every step of the way.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search for help articles, tutorials, or FAQs..."
                className="w-full pl-12 pr-4 py-4 rounded-xl text-black border-2 border-white/20 focus:border-white focus:outline-none text-lg"
              />
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/faq"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-100 transition shadow-lg"
            >
              <FileText className="w-5 h-5" />
              Browse FAQs
            </Link>
            <Link
              href="/help/tutorials"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition border-2 border-white/20"
            >
              <Video className="w-5 h-5" />
              Watch Tutorials
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-transparent text-slate-900 px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/10 transition border-2 border-white"
            >
              <MessageCircle className="w-5 h-5" />
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      {/* Help Categories Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-black mb-4">
              Choose Your Help Topic
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Find the resources you need to succeed in your training journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Getting Started */}
            <Link
              href="/help/getting-started"
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition border-2 border-slate-200 hover:border-blue-600 group"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition">
                <Rocket className="w-8 h-8 text-blue-600 group-hover:text-white transition" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Getting Started</h3>
              <p className="text-slate-600 mb-4">
                Learn how to apply, enroll, and begin your training journey
              </p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </Link>

            {/* Technical Support */}
            <Link
              href="/help/technical"
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition border-2 border-slate-200 hover:border-brand-green-600 group"
            >
              <div className="w-16 h-16 bg-brand-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-green-600 transition">
                <Headphones className="w-8 h-8 text-brand-green-600 group-hover:text-white transition" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Technical Support</h3>
              <p className="text-slate-600 mb-4">
                Get help with login issues, platform navigation, and technical problems
              </p>
              <div className="flex items-center text-brand-green-600 font-semibold group-hover:gap-2 transition-all">
                <span>Get support</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </Link>

            {/* Course Help */}
            <Link
              href="/help/courses"
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition border-2 border-slate-200 hover:border-purple-600 group"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition">
                <BookOpen className="w-8 h-8 text-purple-600 group-hover:text-white transition" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Course Help</h3>
              <p className="text-slate-600 mb-4">
                Access course materials, submit assignments, and track your progress
              </p>
              <div className="flex items-center text-purple-600 font-semibold group-hover:gap-2 transition-all">
                <span>View guides</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </Link>

            {/* Account & Billing */}
            <Link
              href="/help/account"
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition border-2 border-slate-200 hover:border-orange-600 group"
            >
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-600 transition">
                <Shield className="w-8 h-8 text-orange-600 group-hover:text-white transition" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Account & Billing</h3>
              <p className="text-slate-600 mb-4">
                Manage your account settings, update information, and view billing
              </p>
              <div className="flex items-center text-orange-600 font-semibold group-hover:gap-2 transition-all">
                <span>Manage account</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Resources Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Image */}
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/artlist/hero-training-2.webp"
                alt="Student using help resources on laptop"
                fill
                className="object-cover"
                quality={90}
                sizes="(max-width: 1024px) 100vw, 50vw" placeholder="empty"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-6 h-6"  aria-label="award"/>
                  <span className="font-bold">98% Student Satisfaction</span>
                </div>
                <p className="text-sm text-white/90">
                  Our support team is rated excellent by students
                </p>
              </div>
            </div>

            {/* Right: Popular Resources */}
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-black mb-6">
                Popular Help Resources
              </h2>
              <p className="text-xl text-slate-600 mb-8">
                Quick access to our most-used guides and tutorials
              </p>

              <div className="space-y-4">
                <Link
                  href="/help/tutorials"
                  className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl hover:bg-blue-50 hover:border-blue-600 border-2 border-slate-200 transition group"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition">
                    <Video className="w-6 h-6 text-blue-600 group-hover:text-white transition" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-black mb-1">How to Apply for Programs</h3>
                    <p className="text-sm text-slate-600">Step-by-step video guide • 5 min</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition" />
                </Link>

                <Link
                  href="/help/tutorials"
                  className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl hover:bg-blue-50 hover:border-blue-600 border-2 border-slate-200 transition group"
                >
                  <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-green-600 transition">
                    <BookOpen className="w-6 h-6 text-brand-green-600 group-hover:text-white transition" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-black mb-1">Accessing Your Courses</h3>
                    <p className="text-sm text-slate-600">Complete guide • 3 min read</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-green-600 transition" />
                </Link>

                <Link
                  href="/help/tutorials"
                  className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl hover:bg-blue-50 hover:border-blue-600 border-2 border-slate-200 transition group"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600 transition">
                    <FileText className="w-6 h-6 text-purple-600 group-hover:text-white transition" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-black mb-1">Submitting Assignments</h3>
                    <p className="text-sm text-slate-600">Tutorial with screenshots • 4 min</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition" />
                </Link>

                <Link
                  href="/help/tutorials"
                  className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl hover:bg-blue-50 hover:border-blue-600 border-2 border-slate-200 transition group"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-600 transition">
                    <Zap className="w-6 h-6 text-orange-600 group-hover:text-white transition" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-black mb-1">Common Technical Issues</h3>
                    <p className="text-sm text-slate-600">Troubleshooting guide • 6 min</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-orange-600 transition" />
                </Link>
              </div>

              <Link
                href="/help/tutorials"
                className="inline-flex items-center gap-2 mt-8 text-blue-600 font-bold hover:gap-3 transition-all"
              >
                View All Tutorials
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-black mb-4">
              Need Personal Assistance?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our support team is available 24/7 to help you succeed
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Phone Support */}
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Call Us</h3>
              <p className="text-slate-600 mb-6">Speak directly with a support specialist</p>
              <a
                href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
                className="text-2xl font-bold text-blue-600 hover:text-blue-700 mb-4 block"
              >
                {PLATFORM_DEFAULTS.supportPhone}
              </a>
              <p className="text-sm text-slate-500">
                Mon-Fri: 9am-5pm EST
                <br />
                Sat: 10am-2pm EST
              </p>
            </div>

            {/* Email Support */}
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-brand-green-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Email Us</h3>
              <p className="text-slate-600 mb-6">Get a detailed response within 24 hours</p>
              <a
                href="mailto:elevate4humanityedu@gmail.com"
                className="text-lg font-bold text-brand-green-600 hover:text-brand-green-700 mb-4 block break-all"
              >
                elevate4humanityedu@gmail.com
              </a>
              <p className="text-sm text-slate-500">
                Response time:
                <br />
                Usually within 2-4 hours
              </p>
            </div>

            {/* Live Chat */}
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Live Chat</h3>
              <p className="text-slate-600 mb-6">Chat with us in real-time for instant help</p>
              <button className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition mb-4">
                Start Chat
              </button>
              <p className="text-sm text-slate-500">
                Available:
                <br />
                Mon-Fri: 9am-9pm EST
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-black text-blue-600 mb-2">24/7</div>
              <div className="text-slate-600">Support Available</div>
            </div>
            <div>
              <div className="text-4xl font-black text-brand-green-600 mb-2">&lt;2hrs</div>
              <div className="text-slate-600">Average Response Time</div>
            </div>
            <div>
              <div className="text-4xl font-black text-purple-600 mb-2">500+</div>
              <div className="text-slate-600">Help Articles</div>
            </div>
            <div>
              <div className="text-4xl font-black text-orange-600 mb-2">98%</div>
              <div className="text-slate-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-base md:text-lg text-blue-100 mb-8">
              Advance your career with workforce training programs. Funding may be available for eligible participants.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-slate-50 text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-600 border-2 border-white text-lg"
              >
                Browse Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
