import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { GraduationCap, Users, Award, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Learning Management System | Elevate for Humanity',
  description: 'Access your courses, track progress, and earn credentials through Elevate for Humanity\'s training platform.',
  robots: { index: false, follow: false },
};

export default function LmsRootPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative w-full h-[45vh] min-h-[320px] max-h-[500px] overflow-hidden">
        <Image
          src="/images/pages/lms-page-1.webp"
          alt="Student learning on Elevate LMS"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-900/85 to-brand-blue-900/40" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <p className="text-brand-orange-400 text-xs font-bold uppercase tracking-widest mb-2">
              Training Platform
            </p>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">
              Your Learning Hub
            </h1>
            <p className="text-slate-200 max-w-xl text-lg">
              Access courses, track progress, complete assignments, and earn industry-recognized credentials.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Our learning platform gives you the tools, resources, and support to complete your training and launch your career.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Course Access</h3>
              <p className="text-sm text-slate-600">Complete lessons, watch videos, and read materials at your own pace.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-green-100 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-brand-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Track Progress</h3>
              <p className="text-sm text-slate-600">Monitor your completion, see your grades, and track competencies.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-brand-orange-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Earn Credentials</h3>
              <p className="text-sm text-slate-600">Receive verified credentials and certificates recognized by employers.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Get Support</h3>
              <p className="text-sm text-slate-600">Connect with instructors, career coaches, and peer Instructors.</p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
            <h3 className="text-2xl font-bold mb-6 text-center">How Your Training Works</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
                <h4 className="font-bold mb-2">Log In</h4>
                <p className="text-sm text-slate-600">Access your personalized dashboard with your enrolled courses and upcoming assignments.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
                <h4 className="font-bold mb-2">Learn & Practice</h4>
                <p className="text-sm text-slate-600">Complete interactive lessons, hands-on activities, and assessments at your own pace.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
                <h4 className="font-bold mb-2">Earn & Graduate</h4>
                <p className="text-sm text-slate-600">Pass your exams, earn credentials, and connect with employers for job placement.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-brand-blue-700 to-brand-blue-900 rounded-2xl p-8 text-center text-white">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h3 className="text-2xl font-bold mb-3">Ready to Start Learning?</h3>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">
              Log in to access your training portal. If you haven&apos;t enrolled yet, apply today to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="bg-brand-orange-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-orange-700 inline-flex items-center justify-center gap-2">
                Log In to Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/apply" className="bg-white/10 backdrop-blur text-white font-bold py-3 px-8 rounded-lg hover:bg-white/20 inline-flex items-center justify-center gap-2 border border-white/20">
                Apply for Training
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
