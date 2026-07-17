import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Users, Briefcase, TrendingUp, CheckCircle2 } from 'lucide-react';
import EmployerApplicationForm from './EmployerApplicationForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Employer Application | Partner With Us',
  description: 'Partner with us to find qualified candidates, post job openings, and participate in apprenticeship programs. Build your workforce pipeline today.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/employer',
  },
};

export default async function EmployerApplicationPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative h-[200px] sm:h-[260px] overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-orange-900" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-brand-orange-400" />
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Partner With Us</h1>
            <p className="text-lg text-slate-300">Build Your Workforce Pipeline</p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Employer' }]} />
        </div>
      </div>

      {/* Benefits Section */}
      <section className="bg-white border-b border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Why Partner With Elevate?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-slate-50 rounded-xl">
              <Users className="w-10 h-10 mx-auto mb-3 text-brand-orange-600" />
              <h3 className="font-bold mb-2">Pre-Screened Talent</h3>
              <p className="text-sm text-slate-600">Access graduates who have been vetted and trained to industry standards</p>
            </div>
            <div className="text-center p-6 bg-slate-50 rounded-xl">
              <Briefcase className="w-10 h-10 mx-auto mb-3 text-brand-orange-600" />
              <h3 className="font-bold mb-2">OJT Reimbursement</h3>
              <p className="text-sm text-slate-600">Get reimbursed for on-the-job training hours through workforce programs</p>
            </div>
            <div className="text-center p-6 bg-slate-50 rounded-xl">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 text-brand-orange-600" />
              <h3 className="font-bold mb-2">Reduce Turnover</h3>
              <p className="text-sm text-slate-600">Apprentices trained to your standards from day one</p>
            </div>
            <div className="text-center p-6 bg-slate-50 rounded-xl">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-brand-orange-600" />
              <h3 className="font-bold mb-2">WOTC Tax Credits</h3>
              <p className="text-sm text-slate-600">Take advantage of federal tax credits for hiring eligible employees</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-widest text-brand-orange-700 uppercase mb-2">
            Get Started
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Apply to Become a Partner</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Complete the form below to start building your workforce pipeline. 
            We'll connect within 1 business day.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
          <EmployerApplicationForm />
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-600 mb-4">Want to learn more first?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/contact" 
              className="px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:border-brand-orange-500 hover:text-brand-orange-600 transition-colors"
            >
              Contact Us
            </Link>
            <Link 
              href="/hire-graduates" 
              className="px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:border-brand-orange-500 hover:text-brand-orange-600 transition-colors"
            >
              Hire Our Graduates
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
