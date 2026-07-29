import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Users, DollarSign, CheckCircle2, ArrowRight, Briefcase, GraduationCap, Shield, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Post a Job | Employer Partnerships',
  description: 'Post jobs and connect with trained talent from our workforce programs. Build your apprenticeship pipeline and access WIOA employer services.',
};

export default function EmployerPostJobPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-purple-200 font-semibold mb-3 tracking-wide uppercase text-sm">For Employers</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Build Your Talent Pipeline
            </h1>
            <p className="text-xl text-purple-100 leading-relaxed">
              Connect with pre-screened, trained candidates ready to work. Access apprenticeship programs, 
              WIOA employer services, and tax credits for hiring.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center">
            Why Partner With Elevate for Humanity?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Pre-Screened Talent</h3>
              <p className="text-slate-600 text-sm">
                Candidates are pre-assessed for work readiness, skills, and career goals.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Apprenticeship Programs</h3>
              <p className="text-slate-600 text-sm">
                DOL-registered apprenticeships in barbering, cosmetology, and more.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Tax Credits</h3>
              <p className="text-slate-600 text-sm">
                Access Work Opportunity Tax Credits (WOTC) and other employer incentives.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Free Employer Services</h3>
              <p className="text-slate-600 text-sm">
                WIOA provides free recruiting, screening, and job matching services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hiring Options */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center">
            Choose Your Hiring Path
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Post a Job */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="w-8 h-8 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900">Post a Job Opening</h3>
              </div>
              <p className="text-slate-600 mb-6">
                Submit your job posting and we&apos;ll connect you with qualified candidates from our training programs and job seeker network.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Free job posting
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Candidate matching
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Direct referrals to your team
                </li>
              </ul>
              <Link
                href="/employer/register"
                className="block w-full text-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Post a Job
              </Link>
            </div>

            {/* Host Shop / Apprenticeship */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-8 h-8 text-purple-600" />
                <h3 className="text-xl font-bold text-slate-900">Become a Host Shop</h3>
              </div>
              <p className="text-slate-600 mb-6">
                Host apprenticeship apprentices in your barbershop or salon. Earn while you train the next generation.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Free apprentice matching
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Instructor training provided
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Compliance support
                </li>
              </ul>
              <Link
                href="/partners/host-shops"
                className="block w-full text-center bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Become a Host Shop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Employer Services */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              Free WIOA Employer Services
            </h2>
            <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto">
              As an eligible employer, you may receive these services at no cost through our workforce partnerships:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900">Pre-Screening & Skills Assessment</h4>
                  <p className="text-slate-600 text-sm">We assess candidates&apos; skills, work history, and readiness before referring them.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900">On-the-Job Training Reimbursement</h4>
                  <p className="text-slate-600 text-sm">Get reimbursed for training costs when you hire and train eligible workers.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900">Work Opportunity Tax Credit (WOTC)</h4>
                  <p className="text-slate-600 text-sm">Claim federal tax credits up to $9,600 per hired veteran or $2,400 for other eligible workers.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900">Apprenticeship Support</h4>
                  <p className="text-slate-600 text-sm">We handle apprentice registration, reporting, and compliance so you can focus on training.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-br from-purple-900 to-purple-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-purple-300" />
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your Talent Pipeline?</h2>
          <p className="text-xl text-purple-200 mb-8">
            Let&apos;s discuss your hiring needs and find the right talent for your team.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-purple-900 font-bold py-4 px-8 rounded-lg hover:bg-purple-100"
            >
              Contact Our Employer Team <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/employer/register"
              className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-lg hover:bg-white/10"
            >
              Register as Employer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
