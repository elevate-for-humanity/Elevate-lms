import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, DollarSign, Users, Building2, ArrowRight, Clock, GraduationCap, FileText, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Check Your Eligibility | WIOA & Workforce Funding',
  description: 'Find out if you qualify for free or subsidized workforce training. WIOA funding, state grants, and employer sponsorships available for eligible Indiana residents.',
};

export default function EligibilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 via-brand-blue-800 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-blue-200 font-semibold mb-3 tracking-wide uppercase text-sm">Funding & Eligibility</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Is Workforce Training Really Free?
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Many of our participants pay nothing out-of-pocket. Funding is available through WIOA, state grants, and employer sponsorships.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Eligibility Quiz */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center">
              Quick Eligibility Check
            </h2>
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 mb-4">1. Are you currently unemployed, underemployed, or looking to change careers?</h3>
                <div className="flex gap-4">
                  <button className="flex-1 py-3 px-6 bg-green-100 text-green-800 font-semibold rounded-lg hover:bg-green-200">Yes</button>
                  <button className="flex-1 py-3 px-6 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200">No</button>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 mb-4">2. Do you live in Indiana?</h3>
                <div className="flex gap-4">
                  <button className="flex-1 py-3 px-6 bg-green-100 text-green-800 font-semibold rounded-lg hover:bg-green-200">Yes</button>
                  <button className="flex-1 py-3 px-6 bg-yellow-100 text-yellow-800 font-semibold rounded-lg hover:bg-yellow-200">Outside Indiana</button>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 mb-4">3. Are you 18 years or older and legally able to work?</h3>
                <div className="flex gap-4">
                  <button className="flex-1 py-3 px-6 bg-green-100 text-green-800 font-semibold rounded-lg hover:bg-green-200">Yes</button>
                  <button className="flex-1 py-3 px-6 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200">No</button>
                </div>
              </div>
            </div>
            <div className="mt-10 text-center bg-gradient-to-r from-brand-orange-50 to-brand-orange-100 rounded-xl p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-2">You May Qualify!</h3>
              <p className="text-slate-600 mb-6">Get a free eligibility review to confirm and find your funding path.</p>
              <Link href="/check-eligibility" className="inline-flex items-center gap-2 bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-brand-orange-700">
                Get Free Eligibility Review <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Funding Options */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center">Funding Options</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <DollarSign className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">WIOA Funding</h3>
              <p className="text-slate-600 text-sm">Workforce Innovation and Opportunity Act may cover tuition, books, and supplies.</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
              <GraduationCap className="w-10 h-10 text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Next Level Jobs</h3>
              <p className="text-slate-600 text-sm">Indiana program covering 100% tuition for eligible programs in high-demand fields.</p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
              <Building2 className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Employer Sponsorship</h3>
              <p className="text-slate-600 text-sm">Earn while you learn with employer-paid training and guaranteed employment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to See What You Qualify For?</h2>
          <p className="text-xl text-blue-100 mb-8">Get a free review — no commitment required.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/check-eligibility" className="bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-brand-orange-700">
              Check My Eligibility
            </Link>
            <Link href="/contact" className="bg-white text-brand-blue-700 font-bold py-4 px-8 rounded-lg hover:bg-blue-50">
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
