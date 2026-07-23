import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Users, DollarSign, CheckCircle2, ArrowRight, Briefcase, GraduationCap, Shield, Truck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Employers',
  description: 'Partner with Elevate for Humanity to build your talent pipeline, access apprenticeship programs, and earn tax credits.',
};

export default function ForEmployersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-purple-200 font-semibold mb-3 uppercase text-sm tracking-wide">For Employers</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Build Your Talent Pipeline</h1>
          <p className="text-xl text-purple-100">Connect with pre-screened, trained candidates ready to work. Access apprenticeship programs, WIOA employer services, and tax credits.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center">Why Partner With Us?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Pre-Screened Talent</h3>
              <p className="text-slate-600 text-sm">Candidates are pre-assessed for work readiness, skills, and career goals.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Apprenticeship Programs</h3>
              <p className="text-slate-600 text-sm">DOL-registered apprenticeships in barbering, cosmetology, and more.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Tax Credits</h3>
              <p className="text-slate-600 text-sm">Access Work Opportunity Tax Credits (WOTC) up to $9,600 per hired veteran.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Free Employer Services</h3>
              <p className="text-slate-600 text-sm">WIOA provides free recruiting, screening, and job matching services.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center">Choose Your Path</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="w-8 h-8 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900">Post a Job</h3>
              </div>
              <p className="text-slate-600 mb-6">Submit your job posting and we&apos;ll connect you with qualified candidates from our training programs.</p>
              <Link href="/employer/register" className="block w-full text-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700">Post a Job</Link>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-8 h-8 text-purple-600" />
                <h3 className="text-xl font-bold text-slate-900">Become a Host Shop</h3>
              </div>
              <p className="text-slate-600 mb-6">Host apprenticeship apprentices in your barbershop or salon. Earn while you train the next generation.</p>
              <Link href="/host-shop" className="block w-full text-center bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700">Learn More</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-orange-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your Talent Pipeline?</h2>
          <p className="text-xl text-orange-100 mb-8">Let&apos;s discuss your hiring needs.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact" className="bg-white text-brand-orange-600 font-bold py-4 px-8 rounded-lg hover:bg-orange-50">Contact Our Team</Link>
            <Link href="/employer/register" className="bg-transparent border-2 border-white font-bold py-4 px-8 rounded-lg hover:bg-white/10">Register as Employer</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
