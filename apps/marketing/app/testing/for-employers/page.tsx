import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Users, ClipboardList, Shield, Calendar, Phone, CheckCircle, TrendingUp, Award } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Testing for Employers | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Workforce testing solutions for employers - pre-hire assessments, certification verification, and group testing.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/testing/for-employers' },
};

const BENEFITS = [
  { icon: ClipboardList, title: 'Pre-Employment Assessments', desc: 'Screen candidates with validated job-relevant assessments before you hire.' },
  { icon: Award, title: 'Certification Tracking', desc: 'Track employee credentials, renewal dates, and compliance status in one dashboard.' },
  { icon: Calendar, title: 'Flexible Scheduling', desc: 'Book individual or group testing sessions that fit your workforce schedule.' },
  { icon: Users, title: 'Group Discounts', desc: 'Volume pricing for cohort testing. The more tests, the lower the per-person cost.' },
  { icon: TrendingUp, title: 'Career Pathway Support', desc: 'Connect testing results to training programs and advancement opportunities.' },
  { icon: Shield, title: 'Audit-Ready Records', desc: 'We maintain complete records for compliance audits and workforce reporting.' },
];

const INDUSTRIES = ['Manufacturing', 'Healthcare', 'Retail', 'Hospitality', 'Construction', 'Logistics', 'Government', 'Education'];

export default function TestingForEmployersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative flex items-end overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" style={{ minHeight: 'clamp(260px, 45vw, 520px)' }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAgTCAwIDIwIEwgMTAgMjAgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmZmYwMDIiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12 w-full text-white">
          <nav className="text-sm text-white/60 mb-4">
            <Link href="/testing" className="hover:text-white transition-colors">Testing Center</Link>
            <span className="mx-2">/</span>
            <span className="text-white">For Employers</span>
          </nav>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 bg-brand-red-600/20 text-brand-red-300 border border-brand-red-500/30">
            <Building2 className="w-4 h-4" /> For Employers
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-3">Workforce Testing Solutions</h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Build a certified workforce. We handle testing logistics so you can focus on hiring and growing your team.
          </p>
        </div>
      </section>

      {/* BODY */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Partnership benefits */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">What We Offer</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <benefit.icon className="w-10 h-10 text-brand-red-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Industries served */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Industries We Serve</h2>
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
            <div className="flex flex-wrap justify-center gap-4">
              {INDUSTRIES.map((industry) => (
                <div key={industry} className="bg-white rounded-lg px-5 py-3 border border-slate-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-green-600" />
                  <span className="font-medium text-slate-700">{industry}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Contact Us', desc: 'Tell us your workforce needs and certification requirements.' },
              { step: '2', title: 'Custom Quote', desc: 'We create a testing package tailored to your industry and schedule.' },
              { step: '3', title: 'Schedule Tests', desc: 'Book sessions for individuals or groups at your convenience.' },
              { step: '4', title: 'Track Results', desc: 'Access a dashboard to monitor credentials and compliance.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-red-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">{item.step}</div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Build a Certified Workforce?</h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            Contact us for a custom quote. We work with employers of all sizes — from small businesses to enterprise workforce programs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact?type=employer" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">
              Contact Us
            </Link>
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`} className="border-2 border-white/30 text-white hover:bg-white/10 font-bold px-8 py-4 rounded-xl transition-colors text-lg inline-flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" /> Call for Info
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
