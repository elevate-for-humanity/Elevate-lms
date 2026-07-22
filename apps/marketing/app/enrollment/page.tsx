import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, CheckCircle2, Clock, DollarSign, ArrowRight, Phone, BookOpen, Users, Building2 } from 'lucide-react';
import { ParisFloatingWrapper } from '@/components/paris/ParisFloatingWrapper';

export const metadata: Metadata = {
  title: 'Enrollment | Elevate for Humanity',
  description: 'Complete your enrollment in workforce training programs. Check eligibility and start your career journey today.',
};

export default function EnrollmentPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <Image
          src="/images/pages/programs-hero-vibrant.webp"
          alt="Student enrollment at Elevate for Humanity"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-900/90 to-brand-blue-900/50" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <p className="text-brand-orange-400 text-xs font-bold uppercase tracking-widest mb-3">
              Enrollment
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Complete Your Enrollment
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mb-8">
              Ready to start your career journey? Complete enrollment in 4 easy steps and join thousands of successful graduates.
            </p>
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Start Enrollment <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Enrollment Steps */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How Enrollment Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', icon: FileText, title: 'Apply', desc: 'Complete a short application. No cost, no commitment.' },
              { step: '02', icon: CheckCircle2, title: 'Eligibility', desc: 'We check WIOA, Workforce Ready Grant, and other funding sources.' },
              { step: '03', icon: BookOpen, title: 'Enroll', desc: 'Once funded, complete your enrollment and get your start date.' },
              { step: '04', icon: Users, title: 'Start Training', desc: 'Join your cohort and begin your career journey.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-brand-red-600 rounded-full flex items-center justify-center">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <span className="text-4xl font-bold text-brand-red-600">{step}</span>
                <h3 className="text-xl font-bold mt-2 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding Options */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Most Students Pay $0</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            WIOA, Workforce Ready Grant, and other funding programs cover tuition for eligible Indiana residents.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: DollarSign, title: 'WIOA / WorkOne', desc: 'Federal funding for eligible job seekers. Covers tuition, books, and exam fees.' },
              { icon: Building2, title: 'Workforce Ready Grant', desc: 'Indiana state grant for high-demand credentials. No repayment required.' },
              { icon: Clock, title: 'Payment Plans', desc: 'Flexible options for those who don\'t qualify for grant funding.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <Icon className="w-10 h-10 text-brand-red-600 mb-4" />
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-slate-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-brand-red-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-white/90 mb-8">
            Check your eligibility in 2 minutes. No commitment required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-red-600 font-bold px-8 py-4 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Apply Now - It's Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="tel:3173143757"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold px-8 py-4 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Phone className="w-5 h-5" /> Call (317) 314-3757
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
