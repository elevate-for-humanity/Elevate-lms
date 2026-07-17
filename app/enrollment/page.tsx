import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, CheckCircle2, Clock, DollarSign, ArrowRight, Phone } from 'lucide-react';
import { ParisFloatingWrapper } from '@/components/paris/ParisFloatingWrapper';

export const metadata: Metadata = {
  title: 'Enrollment | Elevate for Humanity',
  description: 'Complete your enrollment in workforce training programs. Check eligibility and start your career journey today.',
};

export default function EnrollmentPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <section className="relative w-full h-[40vh] min-h-[280px] max-h-[400px] overflow-hidden">
        <Image
          src="/images/pages/programs-hero-vibrant.webp"
          alt="Student enrollment at Elevate for Humanity"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-900/80 to-brand-blue-900/40" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <p className="text-brand-orange-400 text-xs font-bold uppercase tracking-widest mb-2">
              Enrollment
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              Start Your Training Journey
            </h1>
            <p className="text-slate-200 max-w-xl">
              Complete your enrollment in 4 simple steps. Most eligible students pay $0 in tuition.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Steps */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Your Enrollment Journey</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex gap-4 p-5 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Check Eligibility</h3>
                  <p className="text-slate-600 text-sm">We screen for WIOA, Workforce Ready Grant, FSSA IMPACT, and Job Ready Indy funding.</p>
                </div>
              </div>
              <div className="flex gap-4 p-5 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Complete Application</h3>
                  <p className="text-slate-600 text-sm">Submit your program application with required documents.</p>
                </div>
              </div>
              <div className="flex gap-4 p-5 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Enrollment Agreement</h3>
                  <p className="text-slate-600 text-sm">Review and sign your enrollment documents.</p>
                </div>
              </div>
              <div className="flex gap-4 p-5 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-brand-green-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Start Training</h3>
                  <p className="text-slate-600 text-sm">Begin your workforce training with expert instructors.</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-brand-blue-700 to-brand-blue-900 rounded-2xl p-8 text-center text-white mb-8">
            <h3 className="text-2xl font-bold mb-3">Ready to Get Started?</h3>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">
              Most eligible Indiana residents pay $0 in tuition through WIOA and state workforce funding programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/apply" className="bg-brand-orange-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-orange-700 inline-flex items-center justify-center gap-2">
                Check Your Eligibility
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="tel:3173143757" className="bg-white/10 backdrop-blur text-white font-bold py-3 px-8 rounded-lg hover:bg-white/20 inline-flex items-center justify-center gap-2 border border-white/20">
                <Phone className="w-4 h-4" />
                Call (317) 314-3757
              </a>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow">
              <Clock className="w-8 h-8 text-brand-blue-600 mb-3" />
              <h4 className="font-bold mb-2">Fast Process</h4>
              <p className="text-sm text-slate-600">Eligibility check takes 3-5 minutes. Application takes about 10 minutes.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <DollarSign className="w-8 h-8 text-brand-green-600 mb-3" />
              <h4 className="font-bold mb-2">Most Pay $0</h4>
              <p className="text-sm text-slate-600">Eligible participants receive fully funded training through workforce programs.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <CheckCircle2 className="w-8 h-8 text-brand-orange-600 mb-3" />
              <h4 className="font-bold mb-2">Get Supported</h4>
              <p className="text-sm text-slate-600">Career coaches help you navigate barriers and stay on track.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PARIS AI Assistant */}
      <ParisFloatingWrapper />
    </div>
  );
}
