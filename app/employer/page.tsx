import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle, Users, DollarSign, Award, Briefcase } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'For Employers | Elevate for Humanity',
  description: 'Hire trained workers. No recruiting fees. Build your workforce pipeline.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/employer',
  },
};

export default function EmployerPage() {
  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Employer' }]} />
        </div>
      </div>

      {/* Hero with Image */}
      <section className="relative min-h-[550px] flex items-center overflow-hidden">
        <Image
          src="/images/heroes-hq/employer-hero.jpg"
          alt="Employer partnership"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 w-full">
          <div className="max-w-2xl bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Briefcase className="w-4 h-4" />
              For Employers
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-6">
              Hire Trained, Job-Ready Workers
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Access a pipeline of candidates with industry credentials and hands-on training. 
              No recruiting fees. We handle the training, you get qualified workers.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact?type=employer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Partner With Us
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/hire-graduates"
                className="inline-flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-900 text-base font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                View Candidates
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links to Subpages */}
      <section className="py-6 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/hire-graduates" className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
              Hire Graduates
            </Link>
            <Link href="/ojt-and-funding" className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium hover:bg-green-200 transition-colors">
              OJT & Funding
            </Link>
            <Link href="/workforce-partners" className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
              Workforce Partners
            </Link>
            <Link href="/partners" className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors">
              Partner With Us
            </Link>
            <Link href="/programs" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors">
              View Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Partner With Elevate for Humanity?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We solve your hiring challenges by providing trained, motivated workers ready to contribute from day one.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Zero Recruiting Fees</h3>
              <p className="text-gray-600">
                Access our talent pipeline at no cost. We&apos;re funded by WIOA, JRI, and workforce development grants - not employer fees.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Certified & Job-Ready</h3>
              <p className="text-gray-600">
                Every candidate completes industry-recognized training with certifications. They arrive ready to work, not ready to learn basics.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Retention Support</h3>
              <p className="text-gray-600">
                We don&apos;t disappear after placement. Our team provides ongoing support to help new hires succeed and stay.
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link
              href="/contact?type=employer"
              className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all"
            >
              Start Hiring Today <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12">
            Industries we serve
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 bg-gray-50 rounded-2xl text-center">
              <p className="font-semibold text-gray-900">Healthcare</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl text-center">
              <p className="font-semibold text-gray-900">Skilled Trades</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl text-center">
              <p className="font-semibold text-gray-900">Technology</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl text-center">
              <p className="font-semibold text-gray-900">Business</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-gray-900">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Connect</h3>
              <p className="text-gray-600">
                Tell us about your hiring needs and timeline
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-gray-900">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Match</h3>
              <p className="text-gray-600">
                We send you qualified, pre-screened candidates
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-gray-900">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Hire</h3>
              <p className="text-gray-600">
                Interview and hire with ongoing support from our team
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-brand-blue-700">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Build Your Workforce Pipeline?
          </h2>
          <p className="text-xl text-blue-100 mb-4">
            Join 50+ Indiana employers who hire from our trained talent pool.
          </p>
          <p className="text-lg text-blue-200 mb-8">
            No recruiting fees. Pre-screened candidates. Ongoing retention support.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact?type=employer"
              className="inline-flex items-center gap-2 px-10 py-5 bg-white text-brand-blue-700 text-lg font-bold rounded-full hover:bg-gray-100 transition-colors"
            >
              Partner With Us <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/hire-graduates"
              className="inline-flex items-center px-10 py-5 bg-transparent border-2 border-white text-white text-lg font-bold rounded-full hover:bg-white/10 transition-colors"
            >
              View Available Candidates
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
