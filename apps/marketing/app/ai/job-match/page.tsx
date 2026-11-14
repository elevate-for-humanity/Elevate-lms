import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Briefcase, Target, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Job Match | Elevate',
  description: 'Let our AI find the perfect job match based on your skills, experience, and career goals.',
};

export default function AIJobMatchPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red-500 to-brand-orange-500" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI Powered
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              AI Job Matching
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Our AI analyzes your skills, experience, and career goals to find the perfect job matches from our employer network.
            </p>
            <Link href="https://app.elevateforhumanity.org/lms/ai/job-match" className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Start Job Match
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">1. Tell Us About You</h3>
              <p className="text-sm text-slate-600">Share your skills, experience, and what you're looking for in a job.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">2. AI Analyzes</h3>
              <p className="text-sm text-slate-600">Our AI matches your profile against thousands of job openings.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">3. Get Matched</h3>
              <p className="text-sm text-slate-600">Receive personalized job recommendations with direct apply links.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12">Why Use AI Job Match?</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <TrendingUp className="w-8 h-8 text-brand-blue-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">Personalized Matches</h3>
              <p className="text-sm text-slate-600">AI considers your unique background to find jobs you actually qualify for.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <Briefcase className="w-8 h-8 text-brand-blue-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">Employer Network</h3>
              <p className="text-sm text-slate-600">Access to 200+ employers actively hiring through our platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-50 border-t border-brand-blue-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Find Your Perfect Job</h2>
          <p className="text-slate-600 mb-8">Take 2 minutes to get matched with your ideal position.</p>
          <Link href="https://app.elevateforhumanity.org/lms/ai/job-match" className="inline-flex items-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
            Start Matching Now
          </Link>
        </div>
      </section>
    </div>
  );
}
