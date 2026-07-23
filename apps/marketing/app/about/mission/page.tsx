import { Metadata } from 'next';
import Link from 'next/link';
import { Target, Heart, Users, Globe, Award, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Mission',
  description: 'Elevate for Humanity transforms lives through workforce development, connecting job seekers to careers and employers to talent.',
};

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-blue-200 font-semibold mb-3 uppercase text-sm tracking-wide">Who We Are</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Mission</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Transforming lives through workforce development — connecting job seekers to meaningful careers and employers to skilled talent.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Why We Exist</h2>
          <p className="text-lg text-slate-700 mb-8 leading-relaxed">
            There is a gap between people who want to work and the skills employers need. 
            Elevate for Humanity bridges that gap. We believe everyone deserves a pathway to 
            a living wage career — regardless of background, education, or past circumstances.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 my-12">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <Target className="w-12 h-12 text-brand-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Our Purpose</h3>
              <p className="text-slate-600 text-sm">Connect training to employment — closing the skills gap for individuals and employers.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <Heart className="w-12 h-12 text-brand-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Our Values</h3>
              <p className="text-slate-600 text-sm">Dignity, access, and opportunity for every participant — no exceptions.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <TrendingUp className="w-12 h-12 text-brand-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Our Impact</h3>
              <p className="text-slate-600 text-sm">Measurable outcomes: jobs placed, credentials earned, careers launched.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">What Makes Us Different</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <Award className="w-8 h-8 text-brand-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold mb-2">DOL Registered Apprenticeships</h3>
                <p className="text-slate-600">We sponsor DOL-registered apprenticeship programs — giving participants industry-recognized credentials portable across employers and states.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Users className="w-8 h-8 text-brand-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold mb-2">Employer-Driven Training</h3>
                <p className="text-slate-600">Our programs are built around real employer needs — ensuring graduates have skills that translate directly to jobs.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Globe className="w-8 h-8 text-brand-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold mb-2">Funded Pathways</h3>
                <p className="text-slate-600">We help participants navigate WIOA, state grants, and employer sponsorships — so cost is never a barrier to training.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Heart className="w-8 h-8 text-brand-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold mb-2">Whole-Person Support</h3>
                <p className="text-slate-600">From career coaching to barrier removal, we support participants throughout their journey — not just in the classroom.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-orange-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Join Us in Building a Workforce That Works for Everyone</h2>
          <p className="text-xl text-orange-100 mb-8">Whether you&apos;re seeking training, looking to hire, or want to partner — there&apos;s a place for you at Elevate.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/check-eligibility" className="bg-white text-brand-orange-600 font-bold py-3 px-8 rounded-lg hover:bg-orange-50">Check Eligibility</Link>
            <Link href="/contact" className="bg-transparent border-2 border-white font-bold py-3 px-8 rounded-lg hover:bg-white/10">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
